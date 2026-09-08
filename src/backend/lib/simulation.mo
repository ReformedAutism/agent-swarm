import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/simulation";
import SwarmTypes "../types/swarm-extensions";
import SwarmExtensionsLib "../lib/swarm-extensions";

module {
  // Simulation tuning constants.
  let baseEarnings = 10.0;
  let evolutionThreshold = 100.0;
  let knowledgeCostRate = 0.2;
  let dormancyThreshold = 5.0;
  let seedMoney = 100.0;
  let seedKnowledge = 10.0;

  // Deterministic pseudo-random value in [0, 1) from a Nat seed.
  func rand(seed : Nat) : Float {
    let a = seed * 2654435761;
    let b = a * 2654435761;
    let c = b * 2654435761;
    (c % 100000).toFloat() / 100000.0
  };

  // Trait multiplier derived from the sum of trait levels.
  func traitMultiplier(traits : [Types.Trait]) : Float {
    var sum = 0;
    for (t in traits.values()) { sum += t.level };
    (1.0 + sum.toFloat() * 0.05)
  };

  // Returns all agents in the swarm.
  public func listAgents(agents : List.List<Types.Agent>) : [Types.Agent] {
    agents.toArray()
  };

  // Returns a single agent's detail including history and lineage.
  public func getAgent(agents : List.List<Types.Agent>, id : Nat) : ?Types.Agent {
    agents.find(func a = a.id == id)
  };

  // Returns aggregate swarm statistics.
  public func getSwarmStats(agents : List.List<Types.Agent>, state : Types.SimulationState) : Types.SwarmStats {
    var totalMoney = 0.0;
    var totalKnowledge = 0.0;
    var activeAgents = 0;
    var generationsEvolved = 0;
    for (a in agents.toArray().values()) {
      totalMoney += a.money;
      totalKnowledge += a.knowledge;
      if (a.status != #extinct) { activeAgents += 1 };
      if (a.generation > generationsEvolved) { generationsEvolved := a.generation };
    };
    {
      totalMoney;
      totalKnowledge;
      activeAgents;
      generationsEvolved;
      tick = state.tick;
    }
  };

  // Advances the simulation by one tick, evolving all agents and wiring in
  // agent-to-agent learning: a higher-performing agent causes a lower-performing
  // peer to adopt a portion of its strategy, producing a learning lineage record.
  public func advanceTick(
    agents : List.List<Types.Agent>,
    state : Types.SimulationState,
    learningRecords : List.List<SwarmTypes.LearningRecord>,
    nextLearningId : { var next : Nat },
  ) {
    if (not state.running) { return };
    state.tick += 1;
    let tick = state.tick;
    let now = Time.now();

    let snapshot = agents.toArray();
    let next = List.empty<Types.Agent>();
    var maxId = 0;

    for (agent in snapshot.values()) {
      if (agent.id > maxId) { maxId := agent.id };
      let updated = advanceAgent(agent, tick, now);
      next.add(updated);
      // Evolution: spawn a descendant when the agent reached the evolving state.
      if (updated.status == #evolving) {
        maxId += 1;
        next.add(spawnDescendant(updated, maxId, tick, now));
      };
    };

    // Peer learning: the highest-performing agent causes at least one
    // lower-performing peer to adopt a portion of its strategy.
    let nextArr = next.toArray();
    var best : ?Types.Agent = null;
    for (a in nextArr.values()) {
      switch (best) {
        case (?b) { if (a.money > b.money) { best := ?a } };
        case null { best := ?a };
      };
    };
    var finalArr = nextArr;
    switch (best) {
      case (?bestAgent) {
        let learner = nextArr.find(func a = a.id != bestAgent.id and a.status != #extinct and a.money < bestAgent.money);
        switch (learner) {
          case (?l) {
            // Weight by how much better the peer performed, clamped to [0, 1].
            let rawWeight = if (bestAgent.money > 0.0) { (bestAgent.money - l.money) / bestAgent.money } else { 0.0 };
            let weight = if (rawWeight > 1.0) { 1.0 } else if (rawWeight < 0.0) { 0.0 } else { rawWeight };
            SwarmExtensionsLib.observeAndLearn(learningRecords, nextLearningId, l.id, bestAgent.id, bestAgent.strategy, weight);
            finalArr := nextArr.map(func a = if (a.id == l.id) { { a with strategy = bestAgent.strategy } } else { a });
          };
          case null {};
        };
      };
      case null {};
    };

    agents.clear();
    for (a in finalArr.values()) { agents.add(a) };
  };

  // Advances a single agent by one tick.
  func advanceAgent(agent : Types.Agent, tick : Nat, now : Int) : Types.Agent {
    switch (agent.status) {
      case (#extinct) { agent };
      case (#dormant) { agent };
      case (#alive) {
        // Earn money through the strategy (deterministic pseudo-random growth).
        let earnings = baseEarnings * (1.0 + agent.generation.toFloat() * 0.1) * traitMultiplier(agent.traits) * (0.5 + rand(agent.id * 31 + tick));
        var money = agent.money + earnings;

        // Spend money on knowledge acquisition.
        let knowledgeCost = money * knowledgeCostRate;
        var knowledge = agent.knowledge + knowledgeCost * 0.5;
        money -= knowledgeCost;

        // Reinvest earnings into knowledge to grow control.
        let reinvest = earnings * 0.1;
        knowledge += reinvest;
        money -= reinvest;

        var status : Types.AgentStatus = #alive;
        if (money <= 0.0) {
          status := #extinct;
          money := 0.0;
        } else if (money < dormancyThreshold) {
          status := #dormant;
        } else if (knowledge >= evolutionThreshold) {
          status := #evolving;
        };

        {
          agent with
          money;
          knowledge;
          status;
          moneyHistory = agent.moneyHistory.concat([{ tick; money; at = now }]);
          knowledgeTimeline = agent.knowledgeTimeline.concat([{ tick; knowledge; at = now }]);
        };
      };
      case (#evolving) {
        // An evolving agent returns to alive after spawning its descendant.
        {
          agent with
          status = #alive;
          moneyHistory = agent.moneyHistory.concat([{ tick; money = agent.money; at = now }]);
          knowledgeTimeline = agent.knowledgeTimeline.concat([{ tick; knowledge = agent.knowledge; at = now }]);
        };
      };
    };
  };

  // Spawns a descendant with inherited traits and a mutated strategy.
  func spawnDescendant(parent : Types.Agent, id : Nat, tick : Nat, now : Int) : Types.Agent {
    let mutatedTraits = parent.traits.map(func t = { t with level = t.level + 1 });
    let childTraits = mutatedTraits.concat([{ name = "adaptability"; level = 1 }]);
    {
      id;
      name = parent.name # " Jr.";
      money = parent.money * 0.3;
      knowledge = parent.knowledge * 0.2;
      generation = parent.generation + 1;
      status = #alive;
      strategy = { name = parent.strategy.name # " v2"; description = parent.strategy.description };
      traits = childTraits;
      lineage = {
        ancestors = parent.lineage.ancestors.concat([parent.id]);
        descendants = [];
      };
      moneyHistory = [{ tick; money = parent.money * 0.3; at = now }];
      knowledgeTimeline = [{ tick; knowledge = parent.knowledge * 0.2; at = now }];
    }
  };

  // Pauses or resumes the global simulation.
  public func setSimulationControl(state : Types.SimulationState, control : Types.SimulationControl) {
    switch (control) {
      case (#pause) { state.running := false };
      case (#resume) { state.running := true };
    };
  };

  // Resets the swarm to a fresh seed population.
  public func resetSwarm(agents : List.List<Types.Agent>, state : Types.SimulationState) {
    agents.clear();
    var i = 0;
    while (i < state.seedPopulation) {
      agents.add(seedAgent(i));
      i += 1;
    };
    state.tick := 0;
    state.spotlightAgentId := null;
    state.running := true;
  };

  // Creates a fresh seed agent.
  func seedAgent(id : Nat) : Types.Agent {
    let now = Time.now();
    {
      id;
      name = "Agent " # (id + 1).toText();
      money = seedMoney;
      knowledge = seedKnowledge;
      generation = 0;
      status = #alive;
      strategy = { name = "Growth"; description = "Earns through steady growth" };
      traits = [{ name = "resilience"; level = 1 }];
      lineage = { ancestors = []; descendants = [] };
      moneyHistory = [{ tick = 0; money = seedMoney; at = now }];
      knowledgeTimeline = [{ tick = 0; knowledge = seedKnowledge; at = now }];
    }
  };

  // Spotlights a specific agent to follow its evolution.
  public func spotlightAgent(state : Types.SimulationState, id : Nat) {
    state.spotlightAgentId := ?id;
  };
};
