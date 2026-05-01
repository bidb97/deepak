(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function collectFeatures(tokens) {
    const concepts = new Set();
    const roles = new Set();
    const roleCounts = {};
    const conceptCounts = {};

    tokens.forEach((token) => {
      roles.add(token.role);
      roleCounts[token.role] = (roleCounts[token.role] || 0) + 1;
      (token.concepts || []).forEach((concept) => {
        concepts.add(concept);
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
      });
    });

    return { concepts, roles, roleCounts, conceptCounts };
  }

  function scorePath(features, path) {
    let score = 20;
    const notes = [];
    let matchedSlots = 0;

    (path.requiresConcepts || []).forEach((concept) => {
      if (features.concepts.has(concept)) {
        score += 15;
        matchedSlots += 1;
        notes.push({ type: "good", text: `Есть обязательный смысл: ${concept}.` });
      } else {
        score -= 15;
        notes.push({ type: "bad", text: `Нет обязательного смысла: ${concept}.` });
      }
    });

    (path.requiresRole || []).forEach((role) => {
      if (features.roles.has(role)) {
        score += 12;
        matchedSlots += 1;
        notes.push({ type: "good", text: `Есть нужная роль: ${root.dictionaries.formatRole(role)}.` });
      } else {
        score -= 12;
        notes.push({ type: "bad", text: `Нет нужной роли: ${root.dictionaries.formatRole(role)}.` });
      }
    });

    (path.requiresAny || []).forEach((group) => {
      const matched = group.filter((concept) => features.concepts.has(concept));
      if (matched.length > 0) {
        score += 15;
        matchedSlots += 1;
        notes.push({ type: "good", text: `Закрыт смысловой слот: ${matched.join(", ")}.` });
      } else {
        score -= 15;
        notes.push({ type: "bad", text: `Не закрыт смысловой слот: ${group.join(", ")}.` });
      }
    });

    (path.forbiddenConcepts || []).forEach((concept) => {
      if (features.concepts.has(concept)) {
        score -= 30;
        notes.push({ type: "bad", text: `Использован запрещённый смысл: ${concept}.` });
      }
    });

    if (typeof path.maxVerbCount === "number" && (features.roleCounts.verb || 0) > path.maxVerbCount) {
      score -= 25;
      notes.push({ type: "bad", text: "Для этого пути не должно быть действий, но глагол есть." });
    }

    return { path, score: clamp(score, 0, 75), matchedSlots, notes };
  }

  function createPartialPathResult(bestPathResult) {
    return {
      path: { title: "Частичный ответ", reaction: "Часть смысла есть, но запрос не закрыт полностью." },
      score: Math.min(bestPathResult.score + 15, 45),
      isPartial: true,
      notes: [
        { type: "warn", text: `Ближайший путь: ${bestPathResult.path.title}.` },
        { type: "bad", text: "Не хватает обязательных смыслов для полного ответа." },
        ...bestPathResult.notes
      ]
    };
  }

  function createBrokenPathResult(bestPathResult, formResult) {
    return {
      path: { title: "Обрывок ответа", reaction: "Я понял отдельные слова, но это не похоже на нормальный ответ." },
      score: Math.min(bestPathResult.score, 35),
      isBroken: true,
      notes: [
        { type: "warn", text: `Ближайший путь: ${bestPathResult.path.title}.` },
        { type: "bad", text: "Путь не засчитан полностью, потому что форма ответа слишком слабая." },
        ...bestPathResult.notes.filter((note) => note.type === "good").slice(0, 3),
        ...formResult.notes.filter((note) => note.type === "bad").slice(0, 3)
      ]
    };
  }

  function createGarbagePathResult() {
    return {
      path: { title: "Мусорный ответ", reaction: "Я не понял, это ответ или набор случайных слов?" },
      score: 5,
      isGarbage: true,
      notes: [{ type: "bad", text: "Сценарный путь не выбирается, потому что форма ответа развалилась." }]
    };
  }

  function detectBestPath(features, paths, formResult) {
    if (formResult.isGarbage) return createGarbagePathResult();
    const results = (paths || []).map((path) => scorePath(features, path)).sort((a, b) => b.score - a.score);
    const best = results[0];
    if (!best || best.matchedSlots === 0) {
      return { path: null, score: 0, isUnknown: true, notes: [{ type: "bad", text: "Ответ не похож ни на один путь сценария." }] };
    }
    if (best.score < 35) return createPartialPathResult(best);
    if (formResult.isBroken) return createBrokenPathResult(best, formResult);
    return best;
  }

  function startsWithBadPunctuation(tokens) { return ["comma", "sentence_end"].includes(tokens[0]?.role); }
  function hasGreetingInMiddle(tokens) { return tokens.some((token, index) => token.role === "greeting" && index > 1); }
  function isPeriodToken(token) { return token?.role === "sentence_end" && token.text === "."; }
  function hasPunctuationSpam(tokens) {
    let punctuationRun = [];
    for (const token of tokens) {
      if (token.role === "comma" || token.role === "sentence_end") {
        punctuationRun.push(token);
        if (punctuationRun.length >= 2 && !punctuationRun.every(isPeriodToken)) return true;
      } else {
        punctuationRun = [];
      }
    }
    return false;
  }
  function hasLongNounStack(tokens) {
    let stack = 0;
    const stackRoles = new Set(["object", "detail", "method", "reason"]);
    for (const token of tokens) {
      if (stackRoles.has(token.role)) { stack += 1; if (stack >= 3) return true; }
      else if (token.role !== "comma") stack = 0;
    }
    return false;
  }
  function hasBrokenIntroSentence(tokens) { return tokens.some((token, index) => token.role === "intro" && tokens[index + 1]?.role === "sentence_end"); }
  function hasDanglingConnector(tokens) {
    return tokens.some((token, index) => token.role === "connector" && (index === 0 || index === tokens.length - 1 || tokens[index + 1]?.role === "sentence_end"));
  }
  function hasVerbWithoutTarget(tokens) {
    return tokens.some((token, index) => {
      if (token.role !== "verb") return false;
      const nextMeaningful = tokens.slice(index + 1, index + 4).filter((nextToken) => !["comma", "connector", "intro"].includes(nextToken.role));
      return !nextMeaningful.some((nextToken) => ["object", "detail", "method", "reason"].includes(nextToken.role));
    });
  }
  function hasEarlyObjectBeforeAction(tokens) {
    const firstVerbIndex = tokens.findIndex((token) => token.role === "verb");
    if (firstVerbIndex <= 0) return false;
    return tokens.slice(0, firstVerbIndex).some((token, index) => ["object", "detail", "method", "reason"].includes(token.role) && !["connector", "intro"].includes(tokens[index - 1]?.role));
  }

  function evaluateForm(tokens, features) {
    let score = 30;
    const notes = [];
    const lastToken = tokens[tokens.length - 1];
    let hardFailures = 0;
    let softFailures = 0;
    const addProblem = (type, text, penalty, isHard = false) => {
      score -= penalty;
      if (isHard) hardFailures += 1; else softFailures += 1;
      notes.push({ type, text });
    };
    if (features.roles.has("verb")) notes.push({ type: "good", text: "В ответе есть действие." });
    else addProblem("bad", "Нет действия: ответ похож на список слов.", 12, true);
    if (lastToken?.role === "sentence_end") notes.push({ type: "good", text: "Ответ завершён знаком препинания." });
    else if (tokens.some((token) => token.role === "sentence_end")) addProblem("warn", "Финальный знак стоит не в конце ответа.", 4);
    else addProblem("bad", "Нет нормального финального знака.", 10, true);
    if (startsWithBadPunctuation(tokens)) addProblem("bad", "Ответ начинается с мусорной пунктуации.", 14, true);
    if (hasPunctuationSpam(tokens)) addProblem("bad", "Слишком много знаков препинания подряд.", 12, true);
    if (hasGreetingInMiddle(tokens)) addProblem("bad", "Приветствие стоит не в начале ответа.", 12, true);
    if (hasLongNounStack(tokens)) addProblem("bad", "Слишком много объектов/деталей подряд: это похоже на keyword-spam.", 12);
    if (hasBrokenIntroSentence(tokens)) addProblem("bad", "Вводное слово оборвано точкой.", 10, true);
    if (hasDanglingConnector(tokens)) addProblem("bad", "Связка стоит в плохом месте.", 8);
    if (hasVerbWithoutTarget(tokens)) addProblem("bad", "Есть действие, но рядом нет понятного объекта или детали.", 10);
    if (hasEarlyObjectBeforeAction(tokens)) addProblem("bad", "Объект стоит до действия и ломает порядок фразы.", 8);
    return {
      score: clamp(score, -50, 30),
      hardFailures,
      softFailures,
      isBroken: !hardFailures && softFailures >= 2,
      isGarbage: hardFailures >= 2 || (hardFailures >= 1 && softFailures >= 2),
      notes
    };
  }

  function calculateFinalScore(pathResult, formResult) {
    let score = pathResult.score + formResult.score;
    if (pathResult.isUnknown || formResult.hardFailures >= 1 || formResult.isBroken) score = Math.min(score, 45);
    if (formResult.isGarbage) score = Math.min(score, 28);
    return clamp(score, 0, 100);
  }

  root.scoring = {
    collectFeatures,
    scorePath,
    detectBestPath,
    evaluateForm,
    calculateFinalScore
  };
})();
