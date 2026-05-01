(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  function normalizeRequiresAny(value) {
    return (Array.isArray(value) ? value : [])
      .map((group) => normalizeStringArray(group))
      .filter((group) => group.length > 0);
  }

  function normalizeTokenList(list) {
    return (Array.isArray(list) ? list : []).map((token) => {
      const legacyTags = normalizeStringArray(token?.tags);
      const tagIds = normalizeStringArray(token?.tagIds);
      const mergedTagIds = legacyTags.length ? [...new Set([...tagIds, ...legacyTags])] : tagIds;
      return {
        id: String(token?.id || "").trim(),
        text: String(token?.text || ""),
        tagIds: mergedTagIds
      };
    });
  }

  function normalizeKeywordTokenRefs(list) {
    return (Array.isArray(list) ? list : []).map((item) => ({
      tokenId: String(item?.tokenId || "").trim(),
      role: String(item?.role || "object").trim() || "object",
      concepts: normalizeStringArray(item?.concepts)
    }));
  }

  function normalizeKeywords(list) {
    return (Array.isArray(list) ? list : []).map((keyword) => ({
      id: String(keyword?.id || "").trim(),
      text: String(keyword?.text || ""),
      tokens: normalizeKeywordTokenRefs(keyword?.tokens),
      tagIds: normalizeStringArray(keyword?.tagIds)
    }));
  }

  function normalizePaths(paths) {
    return (Array.isArray(paths) ? paths : []).map((path) => {
      const next = {
        id: String(path?.id || "").trim(),
        title: String(path?.title || ""),
        requiresAny: normalizeRequiresAny(path?.requiresAny),
        reaction: String(path?.reaction || "")
      };
      if (path?.requiresConcepts !== undefined) next.requiresConcepts = normalizeStringArray(path.requiresConcepts);
      if (path?.requiresRole !== undefined) next.requiresRole = normalizeStringArray(path.requiresRole);
      if (path?.forbiddenConcepts !== undefined) next.forbiddenConcepts = normalizeStringArray(path.forbiddenConcepts);
      if (typeof path?.maxVerbCount === "number") next.maxVerbCount = path.maxVerbCount;
      if (path?.delayedConsequence) next.delayedConsequence = String(path.delayedConsequence);
      return next;
    });
  }

  function normalizeTurns(scenario) {
    const turns = Array.isArray(scenario?.turns) ? scenario.turns : [];
    return turns.map((turn) => ({
      request: String(turn?.request || ""),
      keywords: normalizeKeywords(turn?.keywords),
      paths: normalizePaths(turn?.paths)
    }));
  }

  function normalizeTokensData(raw) {
    return {
      tokens: normalizeTokenList(raw?.tokens)
    };
  }

  function normalizeTagsData(raw) {
    const tags = (Array.isArray(raw?.tags) ? raw.tags : []).map((tag) => ({
      id: String(tag?.id || "").trim(),
      title: String(tag?.title || "").trim()
    }));
    return {
      tags: tags.filter((tag) => tag.id).sort((a, b) => a.id.localeCompare(b.id))
    };
  }

  function normalizeCharactersData(raw) {
    return {
      characters: (Array.isArray(raw?.characters) ? raw.characters : []).map((character) => ({
        id: String(character?.id || "").trim(),
        name: String(character?.name || ""),
        archetype: String(character?.archetype || "default").trim() || "default",
        notes: String(character?.notes || "")
      }))
    };
  }

  function normalizeScenariosData(raw) {
    return {
      scenarios: (Array.isArray(raw?.scenarios) ? raw.scenarios : []).map((scenario) => ({
        id: String(scenario?.id || "").trim(),
        title: String(scenario?.title || ""),
        characterId: String(scenario?.characterId || "").trim(),
        topic: String(scenario?.topic || ""),
        turns: normalizeTurns(scenario)
      }))
    };
  }

  root.schema = {
    normalizeStringArray,
    normalizeTokensData,
    normalizeTagsData,
    normalizeCharactersData,
    normalizeScenariosData
  };
})();
