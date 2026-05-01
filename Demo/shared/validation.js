(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function flattenRequiresAny(value) {
    return (Array.isArray(value) ? value : []).flatMap((group) => (Array.isArray(group) ? group : []));
  }

  function getAllTokens(tokensData) {
    return tokensData.tokens || [];
  }

  function validateContent(content) {
    const items = [];
    const tokenIds = new Set();
    const tokenDuplicates = new Set();
    const allTokens = getAllTokens(content.tokensData);
    const concepts = new Set(["polite", "friendly", "negation", "can", "order", "condition", "connector", "contrast", "because", "punctuation", "closing"]);
    const roles = new Set(["greeting", "subject", "negation", "modal", "polite", "intro", "connector", "comma", "sentence_end", "closing"]);

    const registryTagIds = new Set();
    const tagDuplicates = new Set();
    (content.tagsData?.tags || []).forEach((tag) => {
      if (!tag.id) items.push({ type: "bad", text: "Есть тег с пустым id." });
      if (tag.id && registryTagIds.has(tag.id)) tagDuplicates.add(tag.id);
      registryTagIds.add(tag.id);
    });
    tagDuplicates.forEach((id) => items.push({ type: "bad", text: `Дублируется tag id: ${id}.` }));

    allTokens.forEach((token) => {
      if (!token.id) items.push({ type: "bad", text: "Есть токен с пустым id." });
      if (token.id && tokenIds.has(token.id)) tokenDuplicates.add(token.id);
      tokenIds.add(token.id);
      validateTagRefs(items, registryTagIds, token.tagIds, `Токен ${token.id || "(empty)"}: теги`);
    });
    tokenDuplicates.forEach((id) => items.push({ type: "bad", text: `Дублируется token id: ${id}.` }));

    const characterIds = new Set();
    const characterDuplicates = new Set();
    content.charactersData.characters.forEach((character) => {
      if (!character.id) items.push({ type: "bad", text: "Есть персонаж с пустым id." });
      if (character.id && characterIds.has(character.id)) characterDuplicates.add(character.id);
      characterIds.add(character.id);
    });
    characterDuplicates.forEach((id) => items.push({ type: "bad", text: `Дублируется character id: ${id}.` }));

    const scenarioIds = new Set();
    const scenarioDuplicates = new Set();
    content.scenariosData.scenarios.forEach((scenario) => {
      if (!scenario.id) items.push({ type: "bad", text: "Есть сценарий с пустым ID." });
      if (scenario.id && scenarioIds.has(scenario.id)) scenarioDuplicates.add(scenario.id);
      scenarioIds.add(scenario.id);
      if (!scenario.characterId) {
        items.push({ type: "bad", text: `У сценария ${scenario.id || "(empty)"} не выбран персонаж.` });
      } else if (!characterIds.has(scenario.characterId)) {
        items.push({ type: "bad", text: `У сценария ${scenario.id || "(empty)"} выбран неизвестный characterId.` });
      }

      scenario.turns.forEach((turn, turnIndex) => {
        const prefix = `${scenario.id || "(empty)"}, ход ${turnIndex + 1}`;
        const keywordIds = new Set();
        (turn.keywords || []).forEach((keyword, keywordIndex) => {
          const keywordPrefix = `${prefix}, ключ ${keywordIndex + 1}`;
          if (!keyword.id) items.push({ type: "bad", text: `${keywordPrefix}: пустой ID.` });
          if (keyword.id && keywordIds.has(keyword.id)) items.push({ type: "bad", text: `${keywordPrefix}: дублируется ID.` });
          keywordIds.add(keyword.id);
          if (!keyword.text) items.push({ type: "warn", text: `${keywordPrefix}: нет текста для клика.` });
          (keyword.tokens || []).forEach((tokenRef, tokenRefIndex) => {
            const tokenRefPrefix = `${keywordPrefix}, токен ${tokenRefIndex + 1}`;
            if (!tokenRef.tokenId) items.push({ type: "bad", text: `${tokenRefPrefix}: пустой tokenId.` });
            else if (!tokenIds.has(tokenRef.tokenId)) items.push({ type: "bad", text: `${tokenRefPrefix}: неизвестный token id ${tokenRef.tokenId}.` });
            if (!tokenRef.role) items.push({ type: "bad", text: `${tokenRefPrefix}: не выбрана роль.` });
            if (tokenRef.role) roles.add(tokenRef.role);
            (tokenRef.concepts || []).forEach((concept) => concepts.add(concept));
          });
          validateTagRefs(items, registryTagIds, keyword.tagIds, `${keywordPrefix}: теги`);
        });

        const pathIds = new Set();
        turn.paths.forEach((path, pathIndex) => {
          const pathPrefix = `${prefix}, ветка ${pathIndex + 1}`;
          if (!path.id) items.push({ type: "bad", text: `${pathPrefix}: пустой ID ветки.` });
          if (path.id && pathIds.has(path.id)) items.push({ type: "bad", text: `${pathPrefix}: дублируется ID ветки.` });
          pathIds.add(path.id);
          if (!path.reaction) items.push({ type: "bad", text: `${pathPrefix}: нет реакции.` });
          validateConceptRefs(items, concepts, flattenRequiresAny(path.requiresAny), `${pathPrefix}: группы смыслов`);
          validateConceptRefs(items, concepts, path.requiresConcepts || [], `${pathPrefix}: обязательные смыслы`);
          validateConceptRefs(items, concepts, path.forbiddenConcepts || [], `${pathPrefix}: запрещенные смыслы`);
          (path.requiresRole || []).forEach((role) => {
            if (!roles.has(role)) items.push({ type: "bad", text: `${pathPrefix}: неизвестная роль ${root.dictionaries.formatRole(role)}.` });
          });
        });
      });
    });

    scenarioDuplicates.forEach((id) => items.push({ type: "bad", text: `Дублируется scenario id: ${id}.` }));
    return items;
  }

  function validateTagRefs(items, registryIds, ids, label) {
    (ids || []).forEach((id) => {
      if (!registryIds.has(id)) items.push({ type: "bad", text: `${label}: неизвестный tag id ${id}.` });
    });
  }

  function validateConceptRefs(items, concepts, ids, label) {
    (ids || []).forEach((id) => {
      if (!concepts.has(id)) items.push({ type: "bad", text: `${label}: неизвестный concept ${id}.` });
    });
  }

  root.validation = { validateContent };
})();
