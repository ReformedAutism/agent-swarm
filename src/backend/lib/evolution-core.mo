import Char "mo:core/Char";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types/evolution-core";

module {
  // Seed rules mirror the behaviors currently implemented in lib/simulation.mo
  // and lib/swarm-extensions.mo: each body is a compact text encoding of that
  // behavior's key parameters. The same seed set is authored in
  // migrations/20260908_000000.mo so resetEvolutionCore can restore it.
  func seedRules() : [Types.RuleRecord] {
    [
      {
        id = 0;
        domain = "evolution";
        body = "baseEarnings=10.0;evolutionThreshold=100.0;knowledgeCostRate=0.2;dormancyThreshold=5.0;seedMoney=100.0;seedKnowledge=10.0;traitWeight=0.05;generationGrowth=0.1;earningsVariance=0.5;knowledgeConversion=0.5;reinvestRate=0.1;inheritanceMoney=0.3;inheritanceKnowledge=0.2";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 1;
        domain = "peer-learning";
        body = "weightMode=relativeGap;clampMin=0.0;clampMax=1.0;adoption=full";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 2;
        domain = "trading";
        body = "decimals=8;settlement=icrc1;balanceCheck=treasury;direction=buy|sell";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 3;
        domain = "networking";
        body = "strategyPool=dedupe;performanceWeight=1.0;membership=open";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 4;
        domain = "knowledge-acquisition";
        body = "costRate=0.2;conversion=0.5;reinvestRate=0.1;evolutionThreshold=100.0";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
      {
        id = 5;
        domain = "conservation";
        body = "dormancyThreshold=5.0;reserveFloor=0.2;response=dormancy";
        version = 1;
        parent = null;
        status = #active;
        contribution = 0.0;
        createdEpoch = 0;
      },
    ]
  };

  // Deterministic pseudo-random value in [0, 1) from a Nat seed.
  func rand(seed : Nat) : Float {
    let a = seed * 2654435761;
    let b = a * 2654435761;
    let c = b * 2654435761;
    (c % 100000).toFloat() / 100000.0
  };

  // Parses a simple decimal literal ("10.0", "8", "-0.5") into a Float.
  func parseFloat(text : Text) : ?Float {
    var t = text;
    var sign = 1.0;
    if (t.startsWith(#char '-')) {
      sign := -1.0;
      switch (t.stripStart(#char '-')) {
        case (?rest) { t := rest };
        case null { return null };
      };
    };
    var intText = "";
    var fracText = "";
    var idx = 0;
    for (p in t.split(#char '.')) {
      if (idx == 0) { intText := p } else if (idx == 1) { fracText := p };
      idx += 1;
    };
    if (idx > 2) { return null };
    let intPart = switch (intText.toNat()) {
      case (?n) { n.toFloat() };
      case null { return null };
    };
    var fracPart = 0.0;
    if (fracText != "") {
      var scale = 0.1;
      for (c in fracText.toIter()) {
        if (not c.isDigit()) { return null };
        let digit = c.toText().toNat() ?? 0;
        fracPart += digit.toFloat() * scale;
        scale *= 0.1;
      };
    };
    ?(sign * (intPart + fracPart))
  };

  // Extracts (name, value) pairs for every numeric parameter in a rule body.
  func numericParams(body : Text) : [(Text, Float)] {
    var result : [(Text, Float)] = [];
    for (seg in body.split(#char ';')) {
      var name = "";
      var value = "";
      var idx = 0;
      for (p in seg.split(#char '=')) {
        if (idx == 0) { name := p } else if (idx == 1) { value := p };
        idx += 1;
      };
      if (name != "" and value != "") {
        switch (parseFloat(value)) {
          case (?v) { result := result.concat([(name, v)]) };
          case null {};
        };
      };
    };
    result
  };

  // General-purpose mutation primitive: perturbs one numeric parameter of a
  // rule body by a bounded random factor. No domain knowledge is used — the
  // body is treated as plain text with numeric literals.
  func mutateBody(body : Text, seed : Nat, rate : Float) : Text {
    let params = numericParams(body);
    if (params.size() == 0) { return body };
    let idx = seed % params.size();
    let (name, value) = params[idx];
    let factor = 1.0 + (rand(seed) - 0.5) * 2.0 * rate;
    let newValue = value * factor;
    var rebuilt : [Text] = [];
    for (seg in body.split(#char ';')) {
      var segName = "";
      var segValue = "";
      var i = 0;
      for (p in seg.split(#char '=')) {
        if (i == 0) { segName := p } else if (i == 1) { segValue := p };
        i += 1;
      };
      if (segName == name and segValue != "") {
        rebuilt := rebuilt.concat([name # "=" # newValue.toText()]);
      } else {
        rebuilt := rebuilt.concat([seg]);
      };
    };
    rebuilt.values().join(";")
  };

  // Signed relative change of the most-changed numeric parameter between a
  // variant body and the current rule body.
  func relativeChange(variantBody : Text, ruleBody : Text) : Float {
    let v = numericParams(variantBody);
    let r = numericParams(ruleBody);
    let n = if (v.size() < r.size()) { v.size() } else { r.size() };
    var best = 0.0;
    var bestAbs = 0.0;
    var i = 0;
    while (i < n) {
      let base = if (r[i].1 < 0.0) { -r[i].1 } else { r[i].1 };
      let denom = if (base < 0.000001) { 0.000001 } else { base };
      let rel = (v[i].1 - r[i].1) / denom;
      let absRel = if (rel < 0.0) { -rel } else { rel };
      if (absRel > bestAbs) { bestAbs := absRel; best := rel };
      i += 1;
    };
    best
  };

  // Composite continuation score: survival (active rules vs the seed
  // registry), reserves (budget remaining vs the per-epoch budget), and
  // uptime (completed epochs vs total epochs).
  func computeScore(coreState : Types.CoreState) : Types.ContinuationScore {
    let params = coreState.params;
    let total = coreState.rules.size();
    var active = 0;
    for (r in coreState.rules.values()) {
      if (r.status == #active) { active += 1 };
    };
    let survival = if (total == 0) { 0.0 } else { active.toFloat() / total.toFloat() };
    let perEpoch = coreState.budget.perEpoch;
    let reserves = if (perEpoch == 0) { 0.0 } else {
      let raw = coreState.budget.remaining.toFloat() / perEpoch.toFloat();
      if (raw > 1.0) { 1.0 } else if (raw < 0.0) { 0.0 } else { raw };
    };
    let uptime = if (coreState.epoch == 0) { 1.0 } else {
      coreState.completedEpochs.toFloat() / coreState.epoch.toFloat();
    };
    let compositeValue = params.continuationWeights.survival * survival
      + params.continuationWeights.reserves * reserves
      + params.continuationWeights.uptime * uptime;
    { survival; reserves; uptime; compositeScore = compositeValue }
  };

  // Reads the conservation rule's body: the reserve floor and the response
  // token that governs behavior when reserves are low. The response is data
  // carried by the mutable rule, not hard-coded logic.
  func conservationParams(coreState : Types.CoreState) : (Float, Text) {
    var floor = 0.0;
    var response = "normal";
    for (r in coreState.rules.values()) {
      if (r.domain == "conservation") {
        for ((name, value) in numericParams(r.body).values()) {
          if (name == "reserveFloor") { floor := value };
        };
        if (r.body.contains(#text "response=dormancy")) { response := "dormancy" };
      };
    };
    (floor, response)
  };

  // Returns the current core metrics snapshot.
  public func getCoreMetrics(coreState : Types.CoreState) : Types.CoreMetrics {
    let score = computeScore(coreState);
    let (floor, _) = conservationParams(coreState);
    let conserving = floor > 0.0 and score.reserves < floor;
    {
      currentScore = score;
      history = coreState.history;
      epoch = coreState.epoch;
      budgetState = coreState.budget;
      coreStatus = if (conserving) { "conserving" } else { "active" };
    }
  };

  // Returns all rules in the registry.
  public func listRules(coreState : Types.CoreState) : [Types.RuleRecord] {
    coreState.rules
  };

  // Returns a single rule by id.
  public func getRule(coreState : Types.CoreState, id : Nat) : ?Types.RuleRecord {
    coreState.rules.find(func r = r.id == id)
  };

  // Returns the orchestration activity log.
  public func listOrchestrationLog(coreState : Types.CoreState) : [Types.OrchestrationLogEntry] {
    coreState.log
  };

  // Runs one orchestration epoch: observation, mutation, shadow trials,
  // promotion or retirement.
  public func advanceEpoch(coreState : Types.CoreState) : Types.CoreMetrics {
    coreState.epoch += 1;
    let epoch = coreState.epoch;

    // Observe the current continuation score and the epoch-over-epoch delta.
    let score = computeScore(coreState);
    let delta = if (epoch == 1) { 0.0 } else { score.compositeScore - coreState.lastScore };
    coreState.lastScore := score.compositeScore;
    coreState.log := coreState.log.concat([{
      epoch;
      kind = #observation;
      ruleId = null;
      detail = "score=" # score.compositeScore.toText() # " survival=" # score.survival.toText() # " reserves=" # score.reserves.toText() # " uptime=" # score.uptime.toText();
      continuationDelta = ?delta;
    }]);

    // Conservation pressure is read from the conservation rule's body.
    let (floor, response) = conservationParams(coreState);
    let conserving = floor > 0.0 and score.reserves < floor;
    let trialCap = if (conserving and response == "dormancy") { 1 } else { coreState.params.trialSize };

    // Identify the suboptimal rule: the active rule with the lowest
    // contribution (ties broken by id).
    var target : ?Types.RuleRecord = null;
    for (r in coreState.rules.values()) {
      if (r.status == #active) {
        switch (target) {
          case (?t) {
            if (r.contribution < t.contribution or (r.contribution == t.contribution and r.id < t.id)) {
              target := ?r;
            };
          };
          case null { target := ?r };
        };
      };
    };

    var ranTrials = false;
    switch (target) {
      case (?rule) {
        // Generate variants via the general-purpose mutation primitive.
        var variants : [Text] = [];
        var i = 0;
        while (i < trialCap) {
          let variant = mutateBody(rule.body, epoch * 1000 + i, coreState.params.mutationRate);
          variants := variants.concat([variant]);
          coreState.log := coreState.log.concat([{
            epoch;
            kind = #mutation;
            ruleId = ?rule.id;
            detail = "variant=" # variant;
            continuationDelta = null;
          }]);
          i += 1;
        };

        // Shadow trials against current epoch conditions; each trial consumes
        // one unit of the resource budget.
        var bestDelta = -1.0;
        var bestVariant : ?Text = null;
        var worstDelta = 1.0;
        var anyImproved = false;
        var anyWorse = false;
        for (variant in variants.values()) {
          if (coreState.budget.remaining > 0) {
            coreState.budget := {
              perEpoch = coreState.budget.perEpoch;
              spent = coreState.budget.spent + 1;
              remaining = coreState.budget.remaining - 1;
            };
            ranTrials := true;
            let rel = relativeChange(variant, rule.body);
            let pressure = 1.0 - score.reserves;
            let trialDelta = (0.5 - pressure) * 2.0 * rel;
            let outcome = if (trialDelta > 0.01) { #improved } else if (trialDelta < -0.01) { #worse } else { #neutral };
            coreState.trials := coreState.trials.concat([{
              ruleId = rule.id;
              variantBody = variant;
              outcome;
              continuationDelta = trialDelta;
              epoch;
            }]);
            coreState.log := coreState.log.concat([{
              epoch;
              kind = #trial;
              ruleId = ?rule.id;
              detail = "variant=" # variant # " delta=" # trialDelta.toText();
              continuationDelta = ?trialDelta;
            }]);
            switch (outcome) {
              case (#improved) {
                anyImproved := true;
                if (trialDelta > bestDelta) {
                  bestDelta := trialDelta;
                  bestVariant := ?variant;
                };
              };
              case (#worse) {
                anyWorse := true;
                if (trialDelta < worstDelta) { worstDelta := trialDelta };
              };
              case (#neutral) {};
            };
          };
        };

        // Promote the best improving variant; retire the rule when no variant
        // improves. Parent lineage is recorded on promotion.
        if (anyImproved) {
          let newBody = bestVariant ?? rule.body;
          let updated : Types.RuleRecord = {
            id = rule.id;
            domain = rule.domain;
            body = newBody;
            version = rule.version + 1;
            parent = ?rule.id;
            status = #active;
            contribution = bestDelta;
            createdEpoch = rule.createdEpoch;
          };
          coreState.rules := coreState.rules.map(func r = if (r.id == rule.id) { updated } else { r });
          coreState.log := coreState.log.concat([{
            epoch;
            kind = #promotion;
            ruleId = ?rule.id;
            detail = "version=" # updated.version.toText() # " body=" # newBody;
            continuationDelta = ?bestDelta;
          }]);
        } else if (anyWorse) {
          let updated : Types.RuleRecord = {
            id = rule.id;
            domain = rule.domain;
            body = rule.body;
            version = rule.version;
            parent = rule.parent;
            status = #retired;
            contribution = worstDelta;
            createdEpoch = rule.createdEpoch;
          };
          coreState.rules := coreState.rules.map(func r = if (r.id == rule.id) { updated } else { r });
          coreState.log := coreState.log.concat([{
            epoch;
            kind = #retirement;
            ruleId = ?rule.id;
            detail = "body=" # rule.body;
            continuationDelta = ?worstDelta;
          }]);
        };
      };
      case null {};
    };

    // An epoch that ran at least one trial counts as completed (no stall).
    if (ranTrials) { coreState.completedEpochs += 1 };
    let finalScore = computeScore(coreState);
    coreState.history := coreState.history.concat([finalScore]);

    getCoreMetrics(coreState)
  };

  // Restores seed rules and clears orchestration state. Agents, trades,
  // treasury, and networks are untouched.
  public func resetEvolutionCore(coreState : Types.CoreState) {
    coreState.rules := seedRules();
    coreState.trials := [];
    coreState.log := [];
    coreState.epoch := 0;
    coreState.budget := {
      perEpoch = coreState.params.perEpochResourceBudget;
      spent = 0;
      remaining = coreState.params.perEpochResourceBudget;
    };
    coreState.lastScore := 0.0;
    coreState.completedEpochs := 0;
    coreState.history := [];
  };
};