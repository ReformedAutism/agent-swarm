import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types/swarm-extensions";
import SimulationTypes "../types/simulation";

module {
  // The treasury's dedicated subaccount on the ICRC-1 ledger. The canister owns
  // tokens in this subaccount; the user funds it by transferring tokens to the
  // canister's principal with this subaccount, and the canister transfers from
  // it when withdrawing or trading.
  let treasurySubaccount : Blob = "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";

  // Converts a Float amount in nominal token units to the ledger's base units
  // (8 decimals, e.g. e8s for ICP).
  func toBaseUnits(amount : Float) : Nat {
    if (amount < 0.0) {
      Runtime.trap("Amount must be non-negative");
    };
    (amount * 100000000.0).toInt().toNat()
  };

  // Deduplicates a strategy list by name, keeping the first occurrence.
  func dedupeStrategies(strategies : [SimulationTypes.Strategy]) : [SimulationTypes.Strategy] {
    var seen : [Text] = [];
    var result : [SimulationTypes.Strategy] = [];
    for (s in strategies.values()) {
      if (not seen.contains(s.name)) {
        seen := seen.concat([s.name]);
        result := result.concat([s]);
      };
    };
    result
  };

  // Computes the collective performance of a set of member agents as their
  // average money.
  func computeCollectivePerformance(members : [SimulationTypes.Agent]) : Float {
    if (members.size() == 0) { return 0.0 };
    var total = 0.0;
    for (m in members.values()) { total += m.money };
    total / members.size().toFloat()
  };
  // Records an agent adopting a strategy from a higher-performing peer.
  public func observeAndLearn(
    learningRecords : List.List<Types.LearningRecord>,
    nextId : { var next : Nat },
    agentId : Nat,
    sourcePeerId : Nat,
    adoptedStrategy : SimulationTypes.Strategy,
    integrationWeight : Float,
  ) : () {
    let id = nextId.next;
    nextId.next += 1;
    learningRecords.add({
      id;
      agentId;
      sourcePeerId;
      adoptedStrategy;
      integrationWeight;
      at = Time.now();
    });
  };

  // Returns all learning records across the swarm.
  public func listLearningRecords(learningRecords : List.List<Types.LearningRecord>) : [Types.LearningRecord] {
    learningRecords.toArray()
  };

  // Returns the learning lineage of a single agent.
  public func getAgentLearning(learningRecords : List.List<Types.LearningRecord>, agentId : Nat) : [Types.LearningRecord] {
    learningRecords.toArray().filter(func r = r.agentId == agentId)
  };

  // Funds the swarm treasury by transferring a token amount from the canister's
  // main account into its treasury subaccount on the ICRC-1 ledger. Returns the
  // ledger block index of the transfer.
  public func fundTreasury(
    ledger : Types.ICRC1Ledger,
    selfPrincipal : Principal,
    treasury : Types.Treasury,
    token : Text,
    amount : Float,
  ) : async Nat {
    let baseAmount = toBaseUnits(amount);
    let result = await ledger.icrc1_transfer({
      from_subaccount = null;
      to = { owner = selfPrincipal; subaccount = ?treasurySubaccount };
      amount = baseAmount;
      fee = null;
      memo = null;
      created_at_time = null;
    });
    switch (result) {
      case (#Ok blockIndex) {
        switch (treasury.balances.find(func b = b.token == token)) {
          case (?b) {
            treasury.balances := treasury.balances.map(func x = if (x.token == token) { { x with balance = x.balance + amount } } else { x });
          };
          case null {
            treasury.balances := treasury.balances.concat([{ token; balance = amount }]);
          };
        };
        blockIndex
      };
      case (#Err e) {
        Runtime.trap("Ledger transfer failed");
      };
    };
  };

  // Withdraws a token amount from the swarm treasury by transferring it from
  // the canister's treasury subaccount back to its main account on the ICRC-1
  // ledger. Returns the ledger block index of the transfer.
  public func withdrawTreasury(
    ledger : Types.ICRC1Ledger,
    selfPrincipal : Principal,
    treasury : Types.Treasury,
    token : Text,
    amount : Float,
  ) : async Nat {
    switch (treasury.balances.find(func b = b.token == token)) {
      case (?b) {
        if (amount > b.balance) {
          Runtime.trap("Insufficient treasury balance");
        };
      };
      case null {
        Runtime.trap("Token not held in treasury");
      };
    };
    let baseAmount = toBaseUnits(amount);
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?treasurySubaccount;
      to = { owner = selfPrincipal; subaccount = null };
      amount = baseAmount;
      fee = null;
      memo = null;
      created_at_time = null;
    });
    switch (result) {
      case (#Ok blockIndex) {
        treasury.balances := treasury.balances.map(func x = if (x.token == token) { { x with balance = x.balance - amount } } else { x });
        blockIndex
      };
      case (#Err e) {
        Runtime.trap("Ledger transfer failed");
      };
    };
  };

  // Returns the current treasury state.
  public func getTreasury(treasury : Types.Treasury) : Types.TreasuryState {
    { owner = treasury.owner; balances = treasury.balances }
  };

  // Executes a buy/sell trade against the treasury balance and records it. The
  // trade settles as a real ICRC-1 transfer from the treasury subaccount, and
  // the ledger's returned block index is recorded in the trade record.
  public func executeTrade(
    ledger : Types.ICRC1Ledger,
    selfPrincipal : Principal,
    treasury : Types.Treasury,
    trades : List.List<Types.TradeRecord>,
    nextId : { var next : Nat },
    agentId : Nat,
    token : Text,
    amount : Float,
    price : Float,
    direction : Types.TradeDirection,
  ) : async Nat {
    // The trade consumes the token from the treasury balance; agents only trade
    // within the funded balance.
    switch (treasury.balances.find(func b = b.token == token)) {
      case (?b) {
        if (amount > b.balance) {
          Runtime.trap("Insufficient treasury balance for trade");
        };
      };
      case null {
        Runtime.trap("Token not held in treasury");
      };
    };
    let baseAmount = toBaseUnits(amount);
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?treasurySubaccount;
      to = { owner = selfPrincipal; subaccount = null };
      amount = baseAmount;
      fee = null;
      memo = null;
      created_at_time = null;
    });
    switch (result) {
      case (#Ok blockIndex) {
        treasury.balances := treasury.balances.map(func x = if (x.token == token) { { x with balance = x.balance - amount } } else { x });
        let id = nextId.next;
        nextId.next += 1;
        trades.add({
          id;
          agentId;
          token;
          amount;
          price;
          direction;
          blockIndex;
          at = Time.now();
        });
        blockIndex
      };
      case (#Err e) {
        Runtime.trap("Ledger transfer failed");
      };
    };
  };

  // Returns all executed trades across the swarm.
  public func listTrades(trades : List.List<Types.TradeRecord>) : [Types.TradeRecord] {
    trades.toArray()
  };

  // Returns the executed trades of a single agent.
  public func getAgentTrades(trades : List.List<Types.TradeRecord>, agentId : Nat) : [Types.TradeRecord] {
    trades.toArray().filter(func t = t.agentId == agentId)
  };

  // Creates a new network and returns its id.
  public func createNetwork(networks : List.List<Types.Network>, nextId : { var next : Nat }, name : Text) : Nat {
    let id = nextId.next;
    nextId.next += 1;
    networks.add({
      id;
      name;
      memberAgentIds = [];
      sharedStrategyPool = [];
      collectivePerformance = 0.0;
    });
    id
  };

  // Adds an agent to a network, populating the shared strategy pool from the
  // members' strategies and recomputing the network's collective performance.
  public func joinNetwork(
    networks : List.List<Types.Network>,
    agents : List.List<SimulationTypes.Agent>,
    networkId : Nat,
    agentId : Nat,
  ) : () {
    let snapshot = networks.toArray();
    networks.clear();
    for (n in snapshot.values()) {
      if (n.id == networkId) {
        if (n.memberAgentIds.contains(agentId)) {
          networks.add(n);
        } else {
          let newMembers = n.memberAgentIds.concat([agentId]);
          let memberAgents = agents.toArray().filter(func a = newMembers.contains(a.id));
          let strategyPool = dedupeStrategies(memberAgents.map(func a = a.strategy));
          let collectivePerformance = computeCollectivePerformance(memberAgents);
          networks.add({
            n with
            memberAgentIds = newMembers;
            sharedStrategyPool = strategyPool;
            collectivePerformance;
          });
        };
      } else {
        networks.add(n);
      };
    };
  };

  // Removes an agent from a network.
  public func leaveNetwork(networks : List.List<Types.Network>, networkId : Nat, agentId : Nat) : () {
    let snapshot = networks.toArray();
    networks.clear();
    for (n in snapshot.values()) {
      if (n.id == networkId) {
        networks.add({ n with memberAgentIds = n.memberAgentIds.filter(func id = id != agentId) });
      } else {
        networks.add(n);
      };
    };
  };

  // Returns all networks.
  public func listNetworks(networks : List.List<Types.Network>) : [Types.Network] {
    networks.toArray()
  };

  // Returns a single network by id.
  public func getNetwork(networks : List.List<Types.Network>, networkId : Nat) : ?Types.Network {
    networks.find(func n = n.id == networkId)
  };
};
