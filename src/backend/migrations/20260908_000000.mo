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

  type ContinuationWeights = {
    survival : Float;
    reserves : Float;
    uptime : Float;
  };

  type CoreParams = {
    continuationWeights : ContinuationWeights;
    perEpochResourceBudget : Nat;
    mutationRate : Float;
    trialSize : Nat;
  };

  type ContinuationScore = {
    survival : Float;
    reserves : Float;
    uptime : Float;
    compositeScore : Float;
  };

  type BudgetState = {
    perEpoch : Nat;
    spent : Nat;
    remaining : Nat;
  };

  type RuleStatus = {
    #active;
    #trial;
    #retired;
  };

  type RuleRecord = {
    id : Nat;
    domain : Text;
    body : Text;
    version : Nat;
    parent : ?Nat;
    status : RuleStatus;
    contribution : Float;
    createdEpoch : Nat;
  };

  type TrialOutcome = {
    #improved;
    #neutral;
    #worse;
  };

  type TrialRecord = {
    ruleId : Nat;
    variantBody : Text;
    outcome : TrialOutcome;
    continuationDelta : Float;
    epoch : Nat;
  };

  type OrchestrationKind = {
    #observation;
    #mutation;
    #trial;
    #promotion;
    #retirement;
  };

  type OrchestrationLogEntry = {
    epoch : Nat;
    kind : OrchestrationKind;
    ruleId : ?Nat;
    detail : Text;
    continuationDelta : ?Float;
  };

  type CoreState = {
    var params : CoreParams;
    var rules : [RuleRecord];
    var trials : [TrialRecord];
    var log : [OrchestrationLogEntry];
    var epoch : Nat;
    var budget : BudgetState;
    var lastScore : Float;
    var completedEpochs : Nat;
    var history : [ContinuationScore];
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
    learningRecords : List.List<LearningRecord>;
    trades : List.List<TradeRecord>;
    treasury : Treasury;
    networks : List.List<Network>;
    nextLearningId : { var next : Nat };
    nextTradeId : { var next : Nat };
    nextNetworkId : { var next : Nat };
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
    coreState : CoreState;
  };

  // Seed rules encode the current behaviors from lib/simulation.mo and
  // lib/swarm-extensions.mo as compact text bodies. Mirrored in
  // lib/evolution-core.mo so resetEvolutionCore can restore them.
  func seedRules() : [RuleRecord] {
    [
      {
        id = 0;
        domain = "evolution";
        body = "baseEarnings=10.0;evolutionThreshold=100.0;knowledgeCostRate=0.2;dormancyThreshold=5.0;seedMoney=100.0;seedKnowledge=10.0;traitWeight=0.05;generationGrowth=0.1;earningsVariance=0.5;knowledgeConversion=0.5;reinvestRate=0.1;inheritanceMoney=0.3;inheritanceKnowledge=0.2";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 1;
        domain = "peer-learning";
        body = "weightMode=relativeGap;clampMin=0.0;clampMax=1.0;adoption=full";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 2;
        domain = "trading";
        body = "decimals=8;settlement=icrc1;balanceCheck=treasury;direction=buy|sell";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 3;
        domain = "networking";
        body = "strategyPool=dedupe;performanceWeight=1.0;membership=open";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 4;
        domain = "knowledge-acquisition";
        body = "costRate=0.2;conversion=0.5;reinvestRate=0.1;evolutionThreshold=100.0";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 5;
        domain = "conservation";
        body = "dormancyThreshold=5.0;reserveFloor=0.2;response=dormancy";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
    ]
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
      learningRecords = old.learningRecords;
      trades = old.trades;
      treasury = old.treasury;
      networks = old.networks;
      nextLearningId = old.nextLearningId;
      nextTradeId = old.nextTradeId;
      nextNetworkId = old.nextNetworkId;
      coreState = {
        var params = {
          continuationWeights = { survival = 1.0 / 3.0; reserves = 1.0 / 3.0; uptime = 1.0 / 3.0 };
          perEpochResourceBudget = 100;
          mutationRate = 0.1;
          trialSize = 3;
        };
        var rules = seedRules();
        var trials = [];
        var log = [];
        var epoch = 0;
        var budget = { perEpoch = 100; spent = 0; remaining = 100 };
        var lastScore = 0.0;
        var completedEpochs = 0;
        var history = [];
      };
    };
  };
};