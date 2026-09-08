import Common "../types/common";
import SimulationTypes "../types/simulation";
import Principal "mo:core/Principal";

module {
  // An ICRC-1 account: an owner principal plus an optional subaccount.
  public type ICRC1Account = {
    owner : Principal;
    subaccount : ?Blob;
  };

  // Arguments to an ICRC-1 ledger transfer.
  public type TransferArg = {
    from_subaccount : ?Blob;
    to : ICRC1Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  // Errors returned by an ICRC-1 ledger transfer.
  public type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  // The ICRC-1 ledger canister interface used for treasury transfers.
  public type ICRC1Ledger = actor {
    icrc1_transfer : (TransferArg) -> async { #Ok : Nat; #Err : TransferError };
  };
  // A record of an agent adopting a strategy from a higher-performing peer.
  public type LearningRecord = {
    id : Nat;
    agentId : Nat;
    sourcePeerId : Nat;
    adoptedStrategy : SimulationTypes.Strategy;
    integrationWeight : Float;
    at : Common.Timestamp;
  };

  // Direction of a token trade executed against the ICRC-1 ledger.
  public type TradeDirection = {
    #buy;
    #sell;
  };

  // A single executed token trade from the swarm treasury.
  public type TradeRecord = {
    id : Nat;
    agentId : Nat;
    token : Text;
    amount : Float;
    price : Float;
    direction : TradeDirection;
    blockIndex : Nat;
    at : Common.Timestamp;
  };

  // A per-token balance held in the swarm treasury.
  public type TokenBalance = {
    token : Text;
    balance : Float;
  };

  // Internal mutable treasury account held by the actor.
  public type Treasury = {
    var owner : Common.UserId;
    var balances : [TokenBalance];
  };

  // Public shared view of the treasury.
  public type TreasuryState = {
    owner : Common.UserId;
    balances : [TokenBalance];
  };

  // A network of agents that share strategies and coordinate trading.
  public type Network = {
    id : Nat;
    name : Text;
    memberAgentIds : [Nat];
    sharedStrategyPool : [SimulationTypes.Strategy];
    collectivePerformance : Float;
  };
};
