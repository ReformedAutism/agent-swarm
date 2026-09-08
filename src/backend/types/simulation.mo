import Common "../types/common";

module {
  // Lifecycle state of an autonomous agent.
  public type AgentStatus = {
    #alive;
    #evolving;
    #dormant;
    #extinct;
  };

  // The strategy an agent pursues to earn money and grow control.
  public type Strategy = {
    name : Text;
    description : Text;
  };

  // A knowledge trait an agent has evolved over time.
  public type Trait = {
    name : Text;
    level : Nat;
  };

  // A single point in an agent's money-supply history.
  public type MoneySnapshot = {
    tick : Nat;
    money : Float;
    at : Common.Timestamp;
  };

  // A single point in an agent's knowledge-growth timeline.
  public type KnowledgeSnapshot = {
    tick : Nat;
    knowledge : Float;
    at : Common.Timestamp;
  };

  // Lineage links an agent to its ancestors and descendants.
  public type Lineage = {
    ancestors : [Nat];
    descendants : [Nat];
  };

  // A fully-evolved autonomous agent.
  public type Agent = {
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

  // Aggregate statistics across the whole swarm.
  public type SwarmStats = {
    totalMoney : Float;
    totalKnowledge : Float;
    activeAgents : Nat;
    generationsEvolved : Nat;
    tick : Nat;
  };

  // Global simulation state.
  public type SimulationState = {
    var running : Bool;
    var tick : Nat;
    var seedPopulation : Nat;
    var spotlightAgentId : ?Nat;
  };

  // Control input for pausing/resuming the simulation.
  public type SimulationControl = {
    #pause;
    #resume;
  };
};
