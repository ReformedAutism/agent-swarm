import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/swarm-extensions";
import SimulationTypes "../types/simulation";
import SwarmExtensionsLib "../lib/swarm-extensions";

mixin (
  accessControlState : AccessControl.AccessControlState,
  learningRecords : List.List<Types.LearningRecord>,
  trades : List.List<Types.TradeRecord>,
  treasury : Types.Treasury,
  networks : List.List<Types.Network>,
  agents : List.List<SimulationTypes.Agent>,
  ledger : Types.ICRC1Ledger,
  selfPrincipal : Principal,
  nextLearningId : { var next : Nat },
  nextTradeId : { var next : Nat },
  nextNetworkId : { var next : Nat },
) {
  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
  };

  // Establishes the treasury owner as the first admin on first use, then gates
  // treasury mutations on that owner.
  func requireTreasuryOwner(caller : Principal) {
    if (treasury.owner == Principal.fromText("aaaaa-aa") and AccessControl.isAdmin(accessControlState, caller)) {
      treasury.owner := caller;
    };
    if (caller != treasury.owner) {
      Runtime.trap("Unauthorized: Only the treasury owner can fund or withdraw");
    };
  };

  // Records an agent observing a peer and integrating its strategy.
  public shared ({ caller }) func observeAndLearn(
    agentId : Nat,
    sourcePeerId : Nat,
    adoptedStrategy : SimulationTypes.Strategy,
    integrationWeight : Float,
  ) : async () {
    requireUser(caller);
    SwarmExtensionsLib.observeAndLearn(learningRecords, nextLearningId, agentId, sourcePeerId, adoptedStrategy, integrationWeight);
  };

  // Returns all learning records across the swarm.
  public query ({ caller }) func listLearningRecords() : async [Types.LearningRecord] {
    requireUser(caller);
    SwarmExtensionsLib.listLearningRecords(learningRecords);
  };

  // Returns the learning lineage of a single agent.
  public query ({ caller }) func getAgentLearning(agentId : Nat) : async [Types.LearningRecord] {
    requireUser(caller);
    SwarmExtensionsLib.getAgentLearning(learningRecords, agentId);
  };

  // Funds the swarm treasury (owner-only).
  public shared ({ caller }) func fundTreasury(token : Text, amount : Float) : async () {
    requireTreasuryOwner(caller);
    ignore await SwarmExtensionsLib.fundTreasury(ledger, selfPrincipal, treasury, token, amount);
  };

  // Withdraws from the swarm treasury (owner-only).
  public shared ({ caller }) func withdrawTreasury(token : Text, amount : Float) : async () {
    requireTreasuryOwner(caller);
    ignore await SwarmExtensionsLib.withdrawTreasury(ledger, selfPrincipal, treasury, token, amount);
  };

  // Returns the current treasury state.
  public query ({ caller }) func getTreasury() : async Types.TreasuryState {
    requireUser(caller);
    SwarmExtensionsLib.getTreasury(treasury);
  };

  // Executes a buy/sell trade against the treasury balance and records it.
  public shared ({ caller }) func executeTrade(
    agentId : Nat,
    token : Text,
    amount : Float,
    price : Float,
    direction : Types.TradeDirection,
  ) : async () {
    requireUser(caller);
    ignore await SwarmExtensionsLib.executeTrade(ledger, selfPrincipal, treasury, trades, nextTradeId, agentId, token, amount, price, direction);
  };

  // Returns all executed trades across the swarm.
  public query ({ caller }) func listTrades() : async [Types.TradeRecord] {
    requireUser(caller);
    SwarmExtensionsLib.listTrades(trades);
  };

  // Returns the executed trades of a single agent.
  public query ({ caller }) func getAgentTrades(agentId : Nat) : async [Types.TradeRecord] {
    requireUser(caller);
    SwarmExtensionsLib.getAgentTrades(trades, agentId);
  };

  // Creates a new network and returns its id.
  public shared ({ caller }) func createNetwork(name : Text) : async Nat {
    requireUser(caller);
    SwarmExtensionsLib.createNetwork(networks, nextNetworkId, name);
  };

  // Adds an agent to a network.
  public shared ({ caller }) func joinNetwork(networkId : Nat, agentId : Nat) : async () {
    requireUser(caller);
    SwarmExtensionsLib.joinNetwork(networks, agents, networkId, agentId);
  };

  // Removes an agent from a network.
  public shared ({ caller }) func leaveNetwork(networkId : Nat, agentId : Nat) : async () {
    requireUser(caller);
    SwarmExtensionsLib.leaveNetwork(networks, networkId, agentId);
  };

  // Returns all networks.
  public query ({ caller }) func listNetworks() : async [Types.Network] {
    requireUser(caller);
    SwarmExtensionsLib.listNetworks(networks);
  };

  // Returns a single network by id.
  public query ({ caller }) func getNetwork(networkId : Nat) : async ?Types.Network {
    requireUser(caller);
    SwarmExtensionsLib.getNetwork(networks, networkId);
  };
};
