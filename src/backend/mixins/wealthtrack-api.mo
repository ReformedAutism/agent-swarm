import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/wealthtrack";
import Common "../types/common";
import WealthTrackLib "../lib/wealthtrack";

mixin (
  accessControlState : AccessControl.AccessControlState,
  userProfiles : Map.Map<Common.UserId, Types.UserProfile>,
  transactions : List.List<Types.Transaction>,
  budgets : List.List<Types.Budget>,
  savingsGoals : List.List<Types.SavingsGoal>,
  nextTransactionId : { var next : Nat },
  nextBudgetId : { var next : Nat },
  nextGoalId : { var next : Nat },
) {
  // ---- UserProfile ----

  public query ({ caller }) func getCallerProfile() : async ?Types.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.getProfile(userProfiles, caller);
  };

  public shared ({ caller }) func saveCallerProfile(profile : Types.UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.saveProfile(userProfiles, caller, profile);
  };

  // ---- Transaction ----

  public shared ({ caller }) func addTransaction(input : Types.TransactionInput) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.addTransaction(transactions, nextTransactionId, caller, input);
  };

  public query ({ caller }) func getTransaction(id : Nat) : async ?Types.Transaction {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.getTransaction(transactions, caller, id);
  };

  public query ({ caller }) func listTransactions() : async [Types.Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.listTransactions(transactions, caller);
  };

  public shared ({ caller }) func updateTransaction(id : Nat, input : Types.TransactionInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.updateTransaction(transactions, caller, id, input);
  };

  public shared ({ caller }) func deleteTransaction(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    WealthTrackLib.deleteTransaction(transactions, caller, id);
  };

  // ---- Budget ----

  public shared ({ caller }) func addBudget(input : Types.BudgetInput) : async Nat {
    WealthTrackLib.addBudget(budgets, nextBudgetId, caller, input);
  };

  public query ({ caller }) func getBudget(id : Nat) : async ?Types.Budget {
    WealthTrackLib.getBudget(budgets, caller, id);
  };

  public query ({ caller }) func listBudgets() : async [Types.Budget] {
    WealthTrackLib.listBudgets(budgets, caller);
  };

  public shared ({ caller }) func updateBudget(id : Nat, input : Types.BudgetInput) : async () {
    WealthTrackLib.updateBudget(budgets, caller, id, input);
  };

  public shared ({ caller }) func deleteBudget(id : Nat) : async () {
    WealthTrackLib.deleteBudget(budgets, caller, id);
  };

  // ---- SavingsGoal ----

  public shared ({ caller }) func addSavingsGoal(input : Types.SavingsGoalInput) : async Nat {
    WealthTrackLib.addSavingsGoal(savingsGoals, nextGoalId, caller, input);
  };

  public query ({ caller }) func getSavingsGoal(id : Nat) : async ?Types.SavingsGoal {
    WealthTrackLib.getSavingsGoal(savingsGoals, caller, id);
  };

  public query ({ caller }) func listSavingsGoals() : async [Types.SavingsGoal] {
    WealthTrackLib.listSavingsGoals(savingsGoals, caller);
  };

  public shared ({ caller }) func updateSavingsGoal(id : Nat, input : Types.SavingsGoalInput) : async () {
    WealthTrackLib.updateSavingsGoal(savingsGoals, caller, id, input);
  };

  public shared ({ caller }) func deleteSavingsGoal(id : Nat) : async () {
    WealthTrackLib.deleteSavingsGoal(savingsGoals, caller, id);
  };

  public shared ({ caller }) func addContribution(id : Nat, amount : Float) : async () {
    WealthTrackLib.addContribution(savingsGoals, caller, id, amount);
  };
};
