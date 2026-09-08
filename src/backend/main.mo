import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import ListEntity "mo:caffeineai-oql/ListEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import Types "types/wealthtrack";
import Common "types/common";
import SimulationTypes "types/simulation";
import SwarmTypes "types/swarm-extensions";
import SimulationLib "lib/simulation";
import SwarmLib "lib/swarm-extensions";
import WealthTrackApi "mixins/wealthtrack-api";
import SimulationApi "mixins/simulation-api";
import SwarmExtensionsApi "mixins/swarm-extensions-api";
import ApiDocMixin "mixins/api-doc";

actor Self {
  let accessControlState : AccessControl.AccessControlState;
  let userProfiles : Map.Map<Common.UserId, Types.UserProfile>;
  let transactions : List.List<Types.Transaction>;
  let budgets : List.List<Types.Budget>;
  let savingsGoals : List.List<Types.SavingsGoal>;
  let nextTransactionId : { var next : Nat };
  let nextBudgetId : { var next : Nat };
  let nextGoalId : { var next : Nat };
  let agents : List.List<SimulationTypes.Agent>;
  let state : SimulationTypes.SimulationState;
  let learningRecords : List.List<SwarmTypes.LearningRecord>;
  let trades : List.List<SwarmTypes.TradeRecord>;
  let treasury : SwarmTypes.Treasury;
  let networks : List.List<SwarmTypes.Network>;
  let nextLearningId : { var next : Nat };
  let nextTradeId : { var next : Nat };
  let nextNetworkId : { var next : Nat };

  include MixinAuthorization(accessControlState, null);

  include WealthTrackApi(
    accessControlState,
    userProfiles,
    transactions,
    budgets,
    savingsGoals,
    nextTransactionId,
    nextBudgetId,
    nextGoalId,
  );

  include SimulationApi(accessControlState, agents, state, learningRecords, nextLearningId);

  transient let ledger : SwarmTypes.ICRC1Ledger = actor("ryjl3-tyaaa-aaaaa-aaaba-cai");
  transient let selfPrincipal = Principal.fromActor(Self);

  include SwarmExtensionsApi(
    accessControlState,
    learningRecords,
    trades,
    treasury,
    networks,
    agents,
    ledger,
    selfPrincipal,
    nextLearningId,
    nextTradeId,
    nextNetworkId,
  );

  include ApiDocMixin();

  transient let anyP = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      budgets.toEntity("budget", "Budget", "id")
        .sample({ id = 0; owner = anyP; category = ""; monthlyLimit = 0.0 })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Common.UserId, Types.UserProfile)>("userProfile", func () = userProfiles.entries(), "UserProfile", "owner")
        .sample((anyP, { startingBalance = 0.0; currency = ""; onboardingCompleted = false }))
        .payload("owner", func ((p, _)) = p)
        .payload("startingBalance", func ((_, u)) = u.startingBalance)
        .payload("currency", func ((_, u)) = u.currency)
        .payload("onboardingCompleted", func ((_, u)) = u.onboardingCompleted)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      transactions.toEntityManual("transaction", "Transaction", "id")
        .sample({ id = 0; owner = anyP; amount = 0.0; kind = #income; category = ""; date = 0; note = "" })
        .payload("id", func t = t.id)
        .payload("owner", func t = t.owner)
        .payload("amount", func t = t.amount)
        .payload("kind", func t = (switch (t.kind) { case (#income) { "income" }; case (#expense) { "expense" } }))
        .payload("category", func t = t.category)
        .payload("date", func t = t.date)
        .payload("note", func t = t.note)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      savingsGoals.toEntityManual("savingsGoal", "SavingsGoal", "id")
        .sample({ id = 0; owner = anyP; name = ""; targetAmount = 0.0; targetDate = 0; contributions = [] })
        .payload("id", func g = g.id)
        .payload("owner", func g = g.owner)
        .payload("name", func g = g.name)
        .payload("targetAmount", func g = g.targetAmount)
        .payload("targetDate", func g = g.targetDate)
        .payload("contributionCount", func g = g.contributions.size())
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      agents.toEntityManual("agent", "Agent", "id")
        .sample({ id = 0; name = ""; money = 0.0; knowledge = 0.0; generation = 0; status = #alive; strategy = { name = ""; description = "" }; traits = []; lineage = { ancestors = []; descendants = [] }; moneyHistory = []; knowledgeTimeline = [] })
        .payload("id", func a = a.id)
        .payload("name", func a = a.name)
        .payload("money", func a = a.money)
        .payload("knowledge", func a = a.knowledge)
        .payload("generation", func a = a.generation)
        .payload("status", func a = (switch (a.status) { case (#alive) { "alive" }; case (#evolving) { "evolving" }; case (#dormant) { "dormant" }; case (#extinct) { "extinct" } }))
        .payload("strategy", func a = a.strategy.name)
        .public_()
        .build(),
      OQL.Entity.manual<SimulationTypes.SimulationState>("simulationState", func () = [state].values(), "SimulationState", "tick")
        .sample({ var running = true; var tick = 0; var seedPopulation = 0; var spotlightAgentId = null : ?Nat })
        .payload("running", func s = s.running)
        .payload("tick", func s = s.tick)
        .payload("seedPopulation", func s = s.seedPopulation)
        .payload("spotlightAgentId", func s = (switch (s.spotlightAgentId) { case (?id) { id }; case null { 0 } }))
        .public_()
        .build(),
      OQL.Entity.manual<SimulationTypes.SwarmStats>("swarmStats", func () = [SimulationLib.getSwarmStats(agents, state)].values(), "SwarmStats", "tick")
        .sample({ totalMoney = 0.0; totalKnowledge = 0.0; activeAgents = 0; generationsEvolved = 0; tick = 0 })
        .payload("totalMoney", func s = s.totalMoney)
        .payload("totalKnowledge", func s = s.totalKnowledge)
        .payload("activeAgents", func s = s.activeAgents)
        .payload("generationsEvolved", func s = s.generationsEvolved)
        .payload("tick", func s = s.tick)
        .public_()
        .build(),
      learningRecords.toEntityManual("learningRecord", "LearningRecord", "id")
        .sample({ id = 0; agentId = 0; sourcePeerId = 0; adoptedStrategy = { name = ""; description = "" }; integrationWeight = 0.0; at = 0 })
        .payload("id", func r = r.id)
        .payload("agentId", func r = r.agentId)
        .payload("sourcePeerId", func r = r.sourcePeerId)
        .payload("adoptedStrategy", func r = r.adoptedStrategy.name)
        .payload("integrationWeight", func r = r.integrationWeight)
        .payload("at", func r = r.at)
        .public_()
        .build(),
      trades.toEntityManual("trade", "TradeRecord", "id")
        .sample({ id = 0; agentId = 0; token = ""; amount = 0.0; price = 0.0; direction = #buy; blockIndex = 0; at = 0 })
        .payload("id", func t = t.id)
        .payload("agentId", func t = t.agentId)
        .payload("token", func t = t.token)
        .payload("amount", func t = t.amount)
        .payload("price", func t = t.price)
        .payload("direction", func t = (switch (t.direction) { case (#buy) { "buy" }; case (#sell) { "sell" } }))
        .payload("blockIndex", func t = t.blockIndex)
        .payload("at", func t = t.at)
        .public_()
        .build(),
      networks.toEntityManual("network", "Network", "id")
        .sample({ id = 0; name = ""; memberAgentIds = []; sharedStrategyPool = []; collectivePerformance = 0.0 })
        .payload("id", func n = n.id)
        .payload("name", func n = n.name)
        .payload("memberCount", func n = n.memberAgentIds.size())
        .payload("strategyCount", func n = n.sharedStrategyPool.size())
        .payload("collectivePerformance", func n = n.collectivePerformance)
        .public_()
        .build(),
      OQL.Entity.manual<(Nat, SwarmTypes.TreasuryState)>("treasury", func () = [(0, SwarmLib.getTreasury(treasury))].values(), "TreasuryState", "id")
        .sample((0, { owner = anyP; balances = [] }))
        .payload("id", func ((id, _)) = id)
        .payload("owner", func ((_, t)) = t.owner)
        .payload("balanceCount", func ((_, t)) = t.balances.size())
        .public_()
        .build(),
    ];
  });
};
