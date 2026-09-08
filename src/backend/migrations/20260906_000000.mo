import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
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

  type OldActor = {};

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
  };

  func seedAgent(id : Nat) : Agent {
    {
      id;
      name = "Agent " # (id + 1).toText();
      money = 100.0;
      knowledge = 10.0;
      generation = 0;
      status = #alive;
      strategy = { name = "Growth"; description = "Earns through steady growth" };
      traits = [{ name = "resilience"; level = 1 }];
      lineage = { ancestors = []; descendants = [] };
      moneyHistory = [{ tick = 0; money = 100.0; at = 0 }];
      knowledgeTimeline = [{ tick = 0; knowledge = 10.0; at = 0 }];
    }
  };

  func seedAgents() : List.List<Agent> {
    let agents = List.empty<Agent>();
    agents.add(seedAgent(0));
    agents.add(seedAgent(1));
    agents.add(seedAgent(2));
    agents.add(seedAgent(3));
    agents.add(seedAgent(4));
    agents
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      userProfiles = Map.empty();
      transactions = List.empty();
      budgets = List.empty();
      savingsGoals = List.empty();
      nextTransactionId = { var next = 0 };
      nextBudgetId = { var next = 0 };
      nextGoalId = { var next = 0 };
      agents = seedAgents();
      state = {
        var running = true;
        var tick = 0;
        var seedPopulation = 5;
        var spotlightAgentId = null;
      };
    };
  };
};
