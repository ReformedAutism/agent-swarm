import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type UserId = Principal;
  type Timestamp = Int;

  type TransactionType = {
    #income;
    #expense;
  };

  type UserProfile = {
    startingBalance : Float;
    currency : Text;
    onboardingCompleted : Bool;
  };

  type Transaction = {
    id : Nat;
    owner : UserId;
    amount : Float;
    kind : TransactionType;
    category : Text;
    date : Timestamp;
    note : Text;
  };

  type Budget = {
    id : Nat;
    owner : UserId;
    category : Text;
    monthlyLimit : Float;
  };

  type Contribution = {
    amount : Float;
    date : Timestamp;
  };

  type SavingsGoal = {
    id : Nat;
    owner : UserId;
    name : Text;
    targetAmount : Float;
    targetDate : Timestamp;
    contributions : [Contribution];
  };

  type AgentStatus = {
    #alive;
    #evolving;
    #dormant;
    #extinct;
  };

  type Strategy = {
    name : Text;
    description : Text;
  };

  type Trait = {
    name : Text;
    level : Nat;
  };

  type MoneySnapshot = {
    tick : Nat;
    money : Float;
    at : Timestamp;
  };

  type KnowledgeSnapshot = {
    tick : Nat;
    knowledge : Float;
    at : Timestamp;
  };

  type Lineage = {
    ancestors : [Nat];
    descendants : [Nat];
  };

  type Agent = {
    id : Nat;
    name : Text;
    money : Float;
    knowledge : Float;
    generation : Nat;
    status : AgentStatus;
    strategy : Strategy;
    traits : [Trait];
    lineage : Lineage;
    moneyHistory : [MoneySnapshot];
    knowledgeTimeline : [KnowledgeSnapshot];
  };

  type SimulationState = {
    var running : Bool;
    var tick : Nat;
    var seedPopulation : Nat;
    var spotlightAgentId : ?Nat;
  };

  type LearningRecord = {
    id : Nat;
    agentId : Nat;
    sourcePeerId : Nat;
    adoptedStrategy : Strategy;
    integrationWeight : Float;
    at : Timestamp;
  };

  type TradeDirection = {
    #buy;
    #sell;
  };

  type TradeRecord = {
    id : Nat;
    agentId : Nat;
    token : Text;
    amount : Float;
    price : Float;
    direction : TradeDirection;
    blockIndex : Nat;
    at : Timestamp;
  };

  type TokenBalance = {
    token : Text;
    balance : Float;
  };

  type Treasury = {
    var owner : UserId;
    var balances : [TokenBalance];
  };

  type Network = {
    id : Nat;
    name : Text;
    memberAgentIds : [Nat];
    sharedStrategyPool : [Strategy];
    collectivePerformance : Float;
  };

  type OldActor = {
    accessControlState : AccessControlState;
    userProfiles : Map.Map<UserId, UserProfile>;
    transactions : List.List<Transaction>;
    budgets : List.List<Budget>;
    savingsGoals : List.List<SavingsGoal>;
    nextTransactionId : { var next : Nat };
    nextBudgetId : { var next : Nat };
    nextGoalId : { var next : Nat };
    agents : List.List<Agent>;
    state : SimulationState;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    userProfiles : Map.Map<UserId, UserProfile>;
    transactions : List.List<Transaction>;
    budgets : List.List<Budget>;
    savingsGoals : List.List<SavingsGoal>;
    nextTransactionId : { var next : Nat };
    nextBudgetId : { var next : Nat };
    nextGoalId : { var next : Nat };
    agents : List.List<Agent>;
    state : SimulationState;
    learningRecords : List.List<LearningRecord>;
    trades : List.List<TradeRecord>;
    treasury : Treasury;
    networks : List.List<Network>;
    nextLearningId : { var next : Nat };
    nextTradeId : { var next : Nat };
    nextNetworkId : { var next : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      userProfiles = old.userProfiles;
      transactions = old.transactions;
      budgets = old.budgets;
      savingsGoals = old.savingsGoals;
      nextTransactionId = old.nextTransactionId;
      nextBudgetId = old.nextBudgetId;
      nextGoalId = old.nextGoalId;
      agents = old.agents;
      state = old.state;
      learningRecords = List.empty();
      trades = List.empty();
      treasury = {
        var owner = Principal.fromText("aaaaa-aa");
        var balances = [];
      };
      networks = List.empty();
      nextLearningId = { var next = 0 };
      nextTradeId = { var next = 0 };
      nextNetworkId = { var next = 0 };
    };
  };
};
