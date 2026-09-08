import Common "../types/common";

module {
  public type TransactionType = {
    #income;
    #expense;
  };

  public type UserProfile = {
    startingBalance : Float;
    currency : Text;
    onboardingCompleted : Bool;
  };

  public type Transaction = {
    id : Nat;
    owner : Common.UserId;
    amount : Float;
    kind : TransactionType;
    category : Text;
    date : Common.Timestamp;
    note : Text;
  };

  public type TransactionInput = {
    amount : Float;
    kind : TransactionType;
    category : Text;
    date : Common.Timestamp;
    note : Text;
  };

  public type Budget = {
    id : Nat;
    owner : Common.UserId;
    category : Text;
    monthlyLimit : Float;
  };

  public type BudgetInput = {
    category : Text;
    monthlyLimit : Float;
  };

  public type Contribution = {
    amount : Float;
    date : Common.Timestamp;
  };

  public type SavingsGoal = {
    id : Nat;
    owner : Common.UserId;
    name : Text;
    targetAmount : Float;
    targetDate : Common.Timestamp;
    contributions : [Contribution];
  };

  public type SavingsGoalInput = {
    name : Text;
    targetAmount : Float;
    targetDate : Common.Timestamp;
  };
};
