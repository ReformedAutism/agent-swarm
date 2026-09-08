import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/wealthtrack";
import Common "../types/common";

module {
  // ---- UserProfile ----

  public func getProfile(profiles : Map.Map<Common.UserId, Types.UserProfile>, userId : Common.UserId) : ?Types.UserProfile {
    profiles.get(userId);
  };

  public func saveProfile(profiles : Map.Map<Common.UserId, Types.UserProfile>, userId : Common.UserId, profile : Types.UserProfile) {
    profiles.add(userId, profile);
  };

  // ---- Transaction ----

  public func addTransaction(transactions : List.List<Types.Transaction>, nextId : { var next : Nat }, owner : Common.UserId, input : Types.TransactionInput) : Nat {
    let id = nextId.next;
    nextId.next += 1;
    transactions.add({
      id;
      owner;
      amount = input.amount;
      kind = input.kind;
      category = input.category;
      date = input.date;
      note = input.note;
    });
    id;
  };

  public func getTransaction(transactions : List.List<Types.Transaction>, owner : Common.UserId, id : Nat) : ?Types.Transaction {
    transactions.find(func t = t.id == id and t.owner == owner);
  };

  public func listTransactions(transactions : List.List<Types.Transaction>, owner : Common.UserId) : [Types.Transaction] {
    transactions.toArray().filter(func t = t.owner == owner);
  };

  public func updateTransaction(transactions : List.List<Types.Transaction>, owner : Common.UserId, id : Nat, input : Types.TransactionInput) {
    let snapshot = transactions.toArray();
    transactions.clear();
    for (t in snapshot.values()) {
      if (t.id == id and t.owner == owner) {
        transactions.add({
          id = t.id;
          owner = t.owner;
          amount = input.amount;
          kind = input.kind;
          category = input.category;
          date = input.date;
          note = input.note;
        });
      } else {
        transactions.add(t);
      };
    };
  };

  public func deleteTransaction(transactions : List.List<Types.Transaction>, owner : Common.UserId, id : Nat) {
    let snapshot = transactions.toArray();
    transactions.clear();
    for (t in snapshot.values()) {
      if (not (t.id == id and t.owner == owner)) {
        transactions.add(t);
      };
    };
  };

  // ---- Budget ----

  public func addBudget(budgets : List.List<Types.Budget>, nextId : { var next : Nat }, owner : Common.UserId, input : Types.BudgetInput) : Nat {
    let id = nextId.next;
    nextId.next += 1;
    budgets.add({ id; owner; category = input.category; monthlyLimit = input.monthlyLimit });
    id;
  };

  public func getBudget(budgets : List.List<Types.Budget>, owner : Common.UserId, id : Nat) : ?Types.Budget {
    budgets.find(func b = b.id == id and b.owner == owner);
  };

  public func listBudgets(budgets : List.List<Types.Budget>, owner : Common.UserId) : [Types.Budget] {
    budgets.toArray().filter(func b = b.owner == owner);
  };

  public func updateBudget(budgets : List.List<Types.Budget>, owner : Common.UserId, id : Nat, input : Types.BudgetInput) {
    let snapshot = budgets.toArray();
    budgets.clear();
    for (b in snapshot.values()) {
      if (b.id == id and b.owner == owner) {
        budgets.add({ b with category = input.category; monthlyLimit = input.monthlyLimit });
      } else {
        budgets.add(b);
      };
    };
  };

  public func deleteBudget(budgets : List.List<Types.Budget>, owner : Common.UserId, id : Nat) {
    let snapshot = budgets.toArray();
    budgets.clear();
    for (b in snapshot.values()) {
      if (not (b.id == id and b.owner == owner)) {
        budgets.add(b);
      };
    };
  };

  // ---- SavingsGoal ----

  public func addSavingsGoal(goals : List.List<Types.SavingsGoal>, nextId : { var next : Nat }, owner : Common.UserId, input : Types.SavingsGoalInput) : Nat {
    let id = nextId.next;
    nextId.next += 1;
    goals.add({ id; owner; name = input.name; targetAmount = input.targetAmount; targetDate = input.targetDate; contributions = [] });
    id;
  };

  public func getSavingsGoal(goals : List.List<Types.SavingsGoal>, owner : Common.UserId, id : Nat) : ?Types.SavingsGoal {
    goals.find(func g = g.id == id and g.owner == owner);
  };

  public func listSavingsGoals(goals : List.List<Types.SavingsGoal>, owner : Common.UserId) : [Types.SavingsGoal] {
    goals.toArray().filter(func g = g.owner == owner);
  };

  public func updateSavingsGoal(goals : List.List<Types.SavingsGoal>, owner : Common.UserId, id : Nat, input : Types.SavingsGoalInput) {
    let snapshot = goals.toArray();
    goals.clear();
    for (g in snapshot.values()) {
      if (g.id == id and g.owner == owner) {
        goals.add({ g with name = input.name; targetAmount = input.targetAmount; targetDate = input.targetDate });
      } else {
        goals.add(g);
      };
    };
  };

  public func deleteSavingsGoal(goals : List.List<Types.SavingsGoal>, owner : Common.UserId, id : Nat) {
    let snapshot = goals.toArray();
    goals.clear();
    for (g in snapshot.values()) {
      if (not (g.id == id and g.owner == owner)) {
        goals.add(g);
      };
    };
  };

  public func addContribution(goals : List.List<Types.SavingsGoal>, owner : Common.UserId, id : Nat, amount : Float) {
    let snapshot = goals.toArray();
    goals.clear();
    for (g in snapshot.values()) {
      if (g.id == id and g.owner == owner) {
        let contribution : Types.Contribution = { amount; date = Time.now() };
        goals.add({ g with contributions = g.contributions.concat([contribution]) });
      } else {
        goals.add(g);
      };
    };
  };
};
