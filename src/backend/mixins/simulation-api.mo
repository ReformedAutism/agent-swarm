import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/simulation";
import SwarmTypes "../types/swarm-extensions";
import SimulationLib "../lib/simulation";

mixin (
  accessControlState : AccessControl.AccessControlState,
  agents : List.List<Types.Agent>,
  state : Types.SimulationState,
  learningRecords : List.List<SwarmTypes.LearningRecord>,
  nextLearningId : { var next : Nat },
) {
  public query ({ caller }) func listAgents() : async [Types.Agent] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.listAgents(agents);
  };

  public query ({ caller }) func getAgent(id : Nat) : async ?Types.Agent {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.getAgent(agents, id);
  };

  public query ({ caller }) func getSwarmStats() : async Types.SwarmStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.getSwarmStats(agents, state);
  };

  public shared ({ caller }) func advanceTick() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.advanceTick(agents, state, learningRecords, nextLearningId);
  };

  public shared ({ caller }) func setSimulationControl(control : Types.SimulationControl) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.setSimulationControl(state, control);
  };

  public shared ({ caller }) func resetSwarm() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.resetSwarm(agents, state);
  };

  public shared ({ caller }) func spotlightAgent(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SimulationLib.spotlightAgent(state, id);
  };
};
