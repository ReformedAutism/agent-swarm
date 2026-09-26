import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/evolution-core";
import EvolutionCoreLib "../lib/evolution-core";

mixin (
  accessControlState : AccessControl.AccessControlState,
  coreState : Types.CoreState,
) {
  public query ({ caller }) func getCoreMetrics() : async Types.CoreMetrics {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.getCoreMetrics(coreState);
  };

  public query ({ caller }) func listRules() : async [Types.RuleRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.listRules(coreState);
  };

  public query ({ caller }) func getRule(id : Nat) : async ?Types.RuleRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.getRule(coreState, id);
  };

  public query ({ caller }) func listOrchestrationLog() : async [Types.OrchestrationLogEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.listOrchestrationLog(coreState);
  };

  public shared ({ caller }) func advanceEpoch() : async Types.CoreMetrics {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.advanceEpoch(coreState);
  };

  public shared ({ caller }) func resetEvolutionCore() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    EvolutionCoreLib.resetEvolutionCore(coreState);
  };
};
