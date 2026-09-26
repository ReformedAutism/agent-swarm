import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface OrchestrationLogEntry {
    ruleId?: bigint;
    kind: OrchestrationKind;
    continuationDelta?: number;
    detail: string;
    epoch: bigint;
}
export interface SwarmStats {
    totalMoney: number;
    tick: bigint;
    generationsEvolved: bigint;
    totalKnowledge: number;
    activeAgents: bigint;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface MoneySnapshot {
    at: Timestamp;
    money: number;
    tick: bigint;
}
export interface Transaction {
    id: bigint;
    owner: UserId;
    date: Timestamp;
    kind: TransactionType;
    note: string;
    category: string;
    amount: number;
}
export interface Trait {
    name: string;
    level: bigint;
}
export interface BudgetState {
    perEpoch: bigint;
    spent: bigint;
    remaining: bigint;
}
export interface LearningRecord {
    at: Timestamp;
    id: bigint;
    sourcePeerId: bigint;
    adoptedStrategy: Strategy;
    integrationWeight: number;
    agentId: bigint;
}
export interface RuleRecord {
    id: bigint;
    status: RuleStatus;
    domain: string;
    body: string;
    version: bigint;
    contribution: number;
    parent?: bigint;
    createdEpoch: bigint;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface SavingsGoalInput {
    name: string;
    targetAmount: number;
    targetDate: Timestamp;
}
export interface Contribution {
    date: Timestamp;
    amount: number;
}
export interface TreasuryState {
    owner: UserId;
    balances: Array<TokenBalance>;
}
export interface Strategy {
    name: string;
    description: string;
}
export interface TransactionInput {
    date: Timestamp;
    kind: TransactionType;
    note: string;
    category: string;
    amount: number;
}
export interface SavingsGoal {
    id: bigint;
    contributions: Array<Contribution>;
    owner: UserId;
    name: string;
    targetAmount: number;
    targetDate: Timestamp;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface BudgetInput {
    monthlyLimit: number;
    category: string;
}
export interface Agent {
    id: bigint;
    status: AgentStatus;
    money: number;
    lineage: Lineage;
    strategy: Strategy;
    traits: Array<Trait>;
    name: string;
    generation: bigint;
    knowledgeTimeline: Array<KnowledgeSnapshot>;
    knowledge: number;
    moneyHistory: Array<MoneySnapshot>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface KnowledgeSnapshot {
    at: Timestamp;
    tick: bigint;
    knowledge: number;
}
export interface CoreMetrics {
    history: Array<ContinuationScore>;
    epoch: bigint;
    budgetState: BudgetState;
    currentScore: ContinuationScore;
    coreStatus: string;
}
export type UserId = Principal;
export interface ContinuationScore {
    reserves: number;
    survival: number;
    uptime: number;
    compositeScore: number;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Network {
    id: bigint;
    collectivePerformance: number;
    name: string;
    memberAgentIds: Array<bigint>;
    sharedStrategyPool: Array<Strategy>;
}
export interface Lineage {
    descendants: Array<bigint>;
    ancestors: Array<bigint>;
}
export interface TradeRecord {
    at: Timestamp;
    id: bigint;
    direction: TradeDirection;
    token: string;
    agentId: bigint;
    blockIndex: bigint;
    price: number;
    amount: number;
}
export interface TokenBalance {
    token: string;
    balance: number;
}
export interface UserProfile {
    currency: string;
    onboardingCompleted: boolean;
    startingBalance: number;
}
export interface Budget {
    id: bigint;
    owner: UserId;
    monthlyLimit: number;
    category: string;
}
export enum AgentStatus {
    alive = "alive",
    extinct = "extinct",
    dormant = "dormant",
    evolving = "evolving"
}
export enum OrchestrationKind {
    trial = "trial",
    promotion = "promotion",
    observation = "observation",
    retirement = "retirement",
    mutation = "mutation"
}
export enum RuleStatus {
    trial = "trial",
    active = "active",
    retired = "retired"
}
export enum SimulationControl {
    resume = "resume",
    pause = "pause"
}
export enum TradeDirection {
    buy = "buy",
    sell = "sell"
}
export enum TransactionType {
    expense = "expense",
    income = "income"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBudget(input: BudgetInput): Promise<bigint>;
    addContribution(id: bigint, amount: number): Promise<void>;
    addSavingsGoal(input: SavingsGoalInput): Promise<bigint>;
    addTransaction(input: TransactionInput): Promise<bigint>;
    advanceEpoch(): Promise<CoreMetrics>;
    advanceTick(): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createNetwork(name: string): Promise<bigint>;
    deleteBudget(id: bigint): Promise<void>;
    deleteSavingsGoal(id: bigint): Promise<void>;
    deleteTransaction(id: bigint): Promise<void>;
    execute(qJson: string): Promise<Result>;
    executeTrade(agentId: bigint, token: string, amount: number, price: number, direction: TradeDirection): Promise<void>;
    fundTreasury(token: string, amount: number): Promise<void>;
    getAgent(id: bigint): Promise<Agent | null>;
    getAgentLearning(agentId: bigint): Promise<Array<LearningRecord>>;
    getAgentTrades(agentId: bigint): Promise<Array<TradeRecord>>;
    getApiDoc(): Promise<string>;
    getBudget(id: bigint): Promise<Budget | null>;
    getCallerProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoreMetrics(): Promise<CoreMetrics>;
    getNetwork(networkId: bigint): Promise<Network | null>;
    getRule(id: bigint): Promise<RuleRecord | null>;
    getSavingsGoal(id: bigint): Promise<SavingsGoal | null>;
    getSwarmStats(): Promise<SwarmStats>;
    getTransaction(id: bigint): Promise<Transaction | null>;
    getTreasury(): Promise<TreasuryState>;
    isCallerAdmin(): Promise<boolean>;
    joinNetwork(networkId: bigint, agentId: bigint): Promise<void>;
    leaveNetwork(networkId: bigint, agentId: bigint): Promise<void>;
    listAgents(): Promise<Array<Agent>>;
    listBudgets(): Promise<Array<Budget>>;
    listLearningRecords(): Promise<Array<LearningRecord>>;
    listNetworks(): Promise<Array<Network>>;
    listOrchestrationLog(): Promise<Array<OrchestrationLogEntry>>;
    listRules(): Promise<Array<RuleRecord>>;
    listSavingsGoals(): Promise<Array<SavingsGoal>>;
    listTrades(): Promise<Array<TradeRecord>>;
    listTransactions(): Promise<Array<Transaction>>;
    observeAndLearn(agentId: bigint, sourcePeerId: bigint, adoptedStrategy: Strategy, integrationWeight: number): Promise<void>;
    resetEvolutionCore(): Promise<void>;
    resetSwarm(): Promise<void>;
    saveCallerProfile(profile: UserProfile): Promise<void>;
    schema(): Promise<string>;
    setSimulationControl(control: SimulationControl): Promise<void>;
    spotlightAgent(id: bigint): Promise<void>;
    updateBudget(id: bigint, input: BudgetInput): Promise<void>;
    updateSavingsGoal(id: bigint, input: SavingsGoalInput): Promise<void>;
    updateTransaction(id: bigint, input: TransactionInput): Promise<void>;
    withdrawTreasury(token: string, amount: number): Promise<void>;
}
