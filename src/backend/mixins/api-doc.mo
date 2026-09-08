mixin () {
  public query func getApiDoc() : async Text {
    "# WealthTrack Simulation Backend API

## Purpose
The backend powers the WealthTrack personal finance dashboard's autonomous agent
swarm simulation. It maintains a population of autonomous agents that earn money
through their strategies, spend on knowledge acquisition, evolve, and go extinct
when their money supply is depleted. The simulation advances on a periodic tick,
and the dashboard surfaces live-updating numbers. The backend also stores the
user's personal finance data (profile, transactions, budgets, savings goals) and
the swarm-extension layer: agents observe and learn from higher-performing
peers, the swarm holds a treasury on the ICRC-1 ledger, agents execute real
token trades from that treasury, and agents can form networks that share
strategies and coordinate trading.

## Authentication & Authorization
Most public methods require a signed-in caller with at least the `user` role.
Authorization is enforced per-call via role-based access control.

- **Anonymous callers** are never registered and are rejected with a trap
  message `Unauthorized`.
- **Unregistered signed-in callers** (a principal that has never called
  `_initialize_access_control`) are rejected with a trap message
  `User is not registered`.
- **Registered `user` and `admin` callers** are allowed to call every
  role-guarded method.

Methods that require the `user` role (trap `Unauthorized` when the caller lacks
it): `getCallerProfile`, `saveCallerProfile`, `addTransaction`,
`getTransaction`, `listTransactions`, `updateTransaction`, `deleteTransaction`,
`listAgents`, `getAgent`, `getSwarmStats`, `advanceTick`,
`setSimulationControl`, `resetSwarm`, `spotlightAgent`, `observeAndLearn`,
`listLearningRecords`, `getAgentLearning`, `getTreasury`, `executeTrade`,
`listTrades`, `getAgentTrades`, `createNetwork`, `joinNetwork`, `leaveNetwork`,
`listNetworks`, `getNetwork`.

The budget and savings-goal methods (`addBudget`, `getBudget`, `listBudgets`,
`updateBudget`, `deleteBudget`, `addSavingsGoal`, `getSavingsGoal`,
`listSavingsGoals`, `updateSavingsGoal`, `deleteSavingsGoal`,
`addContribution`) perform no explicit role check in the source; they operate
on the caller's own rows via the caller's principal, so a caller can only read
or mutate its own data.

### Treasury ownership
`fundTreasury` and `withdrawTreasury` are additionally gated on the treasury
owner. The treasury owner is established as the first `admin` to call a treasury
mutation; after that, only that principal may fund or withdraw. All other
swarm-extension methods require only the `user` role.

### Registration
Registration happens only when a caller signs in through the app's own
frontend. A direct API caller must call `_initialize_access_control()` once as a
signed-in caller before any role-guarded call (guarded queries included). The
first caller to initialize becomes `admin`; every subsequent caller becomes
`user`. A principal that never signed in through the frontend is unregistered
even when it belongs to the app's owner.

### Identity derivation
The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding the
user's Internet Identity authorization derives the correct per-app principal
against that origin (for example `icp identity link web <name> --app <host>`).
Such a delegation acts with the user's full authority in this app until it
expires. A signed-in caller derived against a different origin is a different
principal than the one the frontend registered.

## Public Methods
- `getCallerProfile() : async ?UserProfile` — returns the calling user's
  profile, or `null` when none has been saved.
- `saveCallerProfile(profile : UserProfile) : async ()` — saves the calling
  user's profile (`startingBalance`, `currency`, `onboardingCompleted`).
- `addTransaction(input : TransactionInput) : async Nat` — records a
  transaction for the caller and returns its id.
- `getTransaction(id : Nat) : async ?Transaction` — returns one of the caller's
  transactions by id, or `null` when unknown or not owned by the caller.
- `listTransactions() : async [Transaction]` — returns the caller's
  transactions.
- `updateTransaction(id : Nat, input : TransactionInput) : async ()` — updates
  one of the caller's transactions.
- `deleteTransaction(id : Nat) : async ()` — deletes one of the caller's
  transactions.
- `addBudget(input : BudgetInput) : async Nat` — creates a budget for the
  caller and returns its id.
- `getBudget(id : Nat) : async ?Budget` — returns one of the caller's budgets
  by id, or `null` when unknown or not owned by the caller.
- `listBudgets() : async [Budget]` — returns the caller's budgets.
- `updateBudget(id : Nat, input : BudgetInput) : async ()` — updates one of the
  caller's budgets.
- `deleteBudget(id : Nat) : async ()` — deletes one of the caller's budgets.
- `addSavingsGoal(input : SavingsGoalInput) : async Nat` — creates a savings
  goal for the caller and returns its id.
- `getSavingsGoal(id : Nat) : async ?SavingsGoal` — returns one of the caller's
  savings goals by id, or `null` when unknown or not owned by the caller.
- `listSavingsGoals() : async [SavingsGoal]` — returns the caller's savings
  goals.
- `updateSavingsGoal(id : Nat, input : SavingsGoalInput) : async ()` — updates
  one of the caller's savings goals.
- `deleteSavingsGoal(id : Nat) : async ()` — deletes one of the caller's
  savings goals.
- `addContribution(id : Nat, amount : Float) : async ()` — adds a contribution
  to one of the caller's savings goals.
- `listAgents() : async [Agent]` — returns every agent in the swarm with its
  current money, knowledge, generation, status, strategy, traits, lineage, and
  history.
- `getAgent(id : Nat) : async ?Agent` — returns a single agent by id, or `null`
  when the id is unknown.
- `getSwarmStats() : async SwarmStats` — returns aggregate swarm statistics:
  total money, total knowledge, active agents, generations evolved, and the
  current tick.
- `advanceTick() : async ()` — advances the simulation by one tick, evolving
  every agent.
- `setSimulationControl(control : SimulationControl) : async ()` — pauses or
  resumes the global simulation (`#pause` / `#resume`).
- `resetSwarm() : async ()` — resets the swarm to a fresh seed population.
- `spotlightAgent(id : Nat) : async ()` — selects an agent to spotlight and
  follow its evolution over time.
- `observeAndLearn(agentId : Nat, sourcePeerId : Nat, adoptedStrategy : Strategy, integrationWeight : Float) : async ()` — records that an agent observed a higher-performing peer and integrated its strategy, forming a visible learning lineage.
- `listLearningRecords() : async [LearningRecord]` — returns every learning record across the swarm.
- `getAgentLearning(agentId : Nat) : async [LearningRecord]` — returns the learning lineage of a single agent.
- `fundTreasury(token : Text, amount : Float) : async ()` — funds the swarm treasury by transferring `amount` of `token` from the canister's main account into its treasury subaccount on the ICRC-1 ledger (owner-only). The transfer's ledger block index is recorded internally.
- `withdrawTreasury(token : Text, amount : Float) : async ()` — withdraws `amount` of `token` from the swarm treasury by transferring it from the canister's treasury subaccount back to its main account on the ICRC-1 ledger (owner-only).
- `getTreasury() : async TreasuryState` — returns the current treasury owner and per-token balances.
- `executeTrade(agentId : Nat, token : Text, amount : Float, price : Float, direction : TradeDirection) : async ()` — executes a buy/sell trade against the treasury balance. The trade settles as a real ICRC-1 transfer from the treasury subaccount, and the ledger's returned block index is recorded in the trade record.
- `listTrades() : async [TradeRecord]` — returns every executed trade across the swarm.
- `getAgentTrades(agentId : Nat) : async [TradeRecord]` — returns the executed trades of a single agent.
- `createNetwork(name : Text) : async Nat` — creates a new network and returns its id.
- `joinNetwork(networkId : Nat, agentId : Nat) : async ()` — adds an agent to a network.
- `leaveNetwork(networkId : Nat, agentId : Nat) : async ()` — removes an agent from a network.
- `listNetworks() : async [Network]` — returns all networks.
- `getNetwork(networkId : Nat) : async ?Network` — returns a single network by id, or `null` when unknown.

## Queryable Data (OQL)
The backend exposes its persisted data through the OQL query layer, discoverable
via `schema() : async Text` and queried via
`execute(query : Text) : async Text` (JSON query, JSON result). Each table
carries its own authorization level:

- **Public tables** (readable by anyone, including anonymous callers):
  `agent`, `simulationState`, `swarmStats`, `learningRecord`, `trade`,
  `network`, `treasury`.
- **Per-user tables** (`.controllerOrScoped()` — a signed-in caller reads only
  its own rows, while the platform controller reads all): `budget`,
  `transaction`, `savingsGoal`, `userProfile`. Ownership is the caller's
  principal.

## Units & Encodings
- **Agent id** (`id`): a `Nat` unique per agent.
- **Money / knowledge** (`money`, `knowledge`, `totalMoney`, `totalKnowledge`):
  `Float` values in the app's nominal units.
- **Generation** (`generation`): `Nat`, the evolution depth of an agent (0 for
  seed agents).
- **Status** (`status`): variant encoded as one of `alive`, `evolving`,
  `dormant`, `extinct`.
- **Timestamps** (`at`, `date`): `Int` nanoseconds since the Unix epoch
  (`Time.now()`).
- **Spotlight** (`spotlightAgentId`): optional `Nat`; `null` when no agent is
  spotlighted.
- **Simulation control** (`SimulationControl`): variant `#pause` or `#resume`.
- **Learning record** (`LearningRecord`): `id`, `agentId`, `sourcePeerId` are
  `Nat`; `adoptedStrategy` is a `Strategy` (`name`/`description` Text);
  `integrationWeight` is a `Float` in `[0, 1]` reflecting how much better the
  source peer performed; `at` is an `Int` nanosecond timestamp.
- **Trade** (`TradeRecord`): `token` is the ICRC-1 token symbol (e.g. `ICP`,
  `ckBTC`, `ckETH`); `amount` and `price` are `Float`; `direction` is the
  variant `#buy` or `#sell`; `blockIndex` is a `Nat`; `at` is an `Int`
  nanosecond timestamp.
- **Treasury** (`TreasuryState`): `owner` is the owning `Principal`;
  `balances` is a list of `{ token : Text; balance : Float }`.
- **Network** (`Network`): `id` and `memberAgentIds` are `Nat`;
  `sharedStrategyPool` is a list of `Strategy`; `collectivePerformance` is a
  `Float` network-level metric.
- **User profile** (`UserProfile`): `startingBalance` is a `Float`;
  `currency` is a `Text` code; `onboardingCompleted` is a `Bool`.
- **Transaction** (`Transaction`): `id` and `owner` are `Nat`/`Principal`;
  `amount` is a `Float`; `kind` is the variant `#income` or `#expense`;
  `category` and `note` are `Text`; `date` is an `Int` nanosecond timestamp.
- **Budget** (`Budget`): `id` and `owner` are `Nat`/`Principal`; `category` is
  `Text`; `monthlyLimit` is a `Float`.
- **Savings goal** (`SavingsGoal`): `id` and `owner` are `Nat`/`Principal`;
  `name` is `Text`; `targetAmount` is a `Float`; `targetDate` is an `Int`
  nanosecond timestamp; `contributions` is a list of
  `{ amount : Float; date : Int }`.

## Lifecycle & Polling
- The simulation advances one tick per `advanceTick()` call while `running` is
  true. Each tick increments `state.tick` and evolves every agent.
- Agent lifecycle: `alive` → `dormant` (money below the dormancy threshold) or
  `extinct` (money depleted to zero) or `evolving` (knowledge reaches the
  evolution threshold). An `evolving` agent spawns a descendant and returns to
  `alive` on the next tick.
- Each `advanceTick()` also runs agent-to-agent learning: the highest-performing
  agent causes at least one lower-performing peer to adopt a portion of its
  strategy, and a `LearningRecord` is appended to the learning lineage. The
  learner's `strategy` is updated to the peer's strategy and the record's
  `integrationWeight` reflects how much better the peer performed (clamped to
  `[0, 1]`).
- `getSwarmStats()` returns the current aggregate snapshot; poll it (or
  `listAgents()`) to observe live-updating numbers after each `advanceTick()`.
- `resetSwarm()` resets the tick to 0, clears the spotlight, and reseeds the
  population.

## Mutation Retry Safety
- `advanceTick()` is not idempotent: each call advances the simulation by one
  tick, so retrying advances further. Callers should advance once per intended
  tick.
- `setSimulationControl(#pause)` / `setSimulationControl(#resume)` are
  idempotent — pausing an already-paused simulation is a no-op.
- `resetSwarm()` is destructive: it discards the current population and history
  and reseeds a fresh population. Repeated calls reseed again.
- `spotlightAgent(id)` is idempotent — setting the same spotlight again is a
  no-op.

## Errors, Traps & Gotchas
- Role-guarded methods trap with `Unauthorized` when the caller lacks the
  `user` role. The budget and savings-goal methods perform no explicit role
  check and instead scope every read/write to the caller's own rows.
- Unregistered signed-in callers trap with `User is not registered`.
- `advanceTick()` is a no-op when the simulation is paused (`running == false`).
- `getAgent(id)` returns `null` for an unknown id rather than trapping.
- `getTransaction(id)`, `getBudget(id)`, and `getSavingsGoal(id)` return `null`
  for an unknown id or an id not owned by the caller rather than trapping.
- `fundTreasury`/`withdrawTreasury` trap with
  `Unauthorized: Only the treasury owner can fund or withdraw` when the caller
  is not the treasury owner.
- `withdrawTreasury` traps with `Insufficient treasury balance` when the amount
  exceeds the held balance, and `Token not held in treasury` when the token is
  not present.
- `executeTrade` traps with `Insufficient treasury balance for trade` or
  `Token not held in treasury` when the trade cannot be covered by the funded
  balance — agents only trade within the funded balance.
- `fundTreasury`, `withdrawTreasury`, and `executeTrade` each perform a real
  ICRC-1 `icrc1_transfer` on the ledger canister
  (`ryjl3-tyaaa-aaaaa-aaaba-cai`). If the ledger rejects the transfer they trap
  with `Ledger transfer failed`, and the in-memory balance and any trade record
  are left unchanged. Amounts are converted from nominal `Float` units to the
  ledger's base units (8 decimals, e.g. e8s for ICP); a negative amount traps
  with `Amount must be non-negative`.
- `getNetwork(id)` returns `null` for an unknown id rather than trapping.
- The simulation is deterministic: per-tick randomness is derived from a Nat
  seed (agent id and tick), so identical inputs produce identical outcomes."
  };
};
