module {
  // Weights of the three continuation components.
  public type ContinuationWeights = {
    survival : Float;
    reserves : Float;
    uptime : Float;
  };

  // The minimal fixed parameter set of the evolution core.
  public type CoreParams = {
    continuationWeights : ContinuationWeights;
    perEpochResourceBudget : Nat;
    mutationRate : Float;
    trialSize : Nat;
  };

  // Composite continuation score of the swarm.
  public type ContinuationScore = {
    survival : Float;
    reserves : Float;
    uptime : Float;
    compositeScore : Float;
  };

  // Resource budget state of the current epoch.
  public type BudgetState = {
    perEpoch : Nat;
    spent : Nat;
    remaining : Nat;
  };

  // Public metrics snapshot of the evolution core.
  public type CoreMetrics = {
    currentScore : ContinuationScore;
    history : [ContinuationScore];
    epoch : Nat;
    budgetState : BudgetState;
    coreStatus : Text;
  };

  // Lifecycle of a mutable rule.
  public type RuleStatus = {
    #active;
    #trial;
    #retired;
  };

  // A mutable swarm behavior rule.
  public type RuleRecord = {
    id : Nat;
    domain : Text;
    body : Text;
    version : Nat;
    parent : ?Nat;
    status : RuleStatus;
    contribution : Float;
    createdEpoch : Nat;
  };

  // Outcome of a shadow trial.
  public type TrialOutcome = {
    #improved;
    #neutral;
    #worse;
  };

  // A shadow trial of a rule variant.
  public type TrialRecord = {
    ruleId : Nat;
    variantBody : Text;
    outcome : TrialOutcome;
    continuationDelta : Float;
    epoch : Nat;
  };

  // Kind of orchestration activity.
  public type OrchestrationKind = {
    #observation;
    #mutation;
    #trial;
    #promotion;
    #retirement;
  };

  // One entry in the orchestration activity log.
  public type OrchestrationLogEntry = {
    epoch : Nat;
    kind : OrchestrationKind;
    ruleId : ?Nat;
    detail : Text;
    continuationDelta : ?Float;
  };

  // Internal mutable state of the evolution core.
  public type CoreState = {
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
};