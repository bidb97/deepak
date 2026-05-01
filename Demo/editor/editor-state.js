(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function createEditorState() {
    return {
      tab: "characters",
      demoHandle: null,
      tokensData: { tokens: [] },
      tagsData: { tags: [] },
      charactersData: { characters: [] },
      scenariosData: { scenarios: [] },
      allTokens: [],
      selectedTokenId: "",
      selectedTagId: "",
      selectedCharacterId: "",
      selectedScenarioId: "",
      selectedTurnIndex: 0,
      selectedPathIndex: 0,
      selectedKeywordIndex: 0,
      tokenSearch: "",
      tokenTagFilter: [],
      keywordTokenSearch: "",
      tagSearch: "",
      characterSearch: "",
      scenarioSearch: "",
      turnChipSearch: "",
      keywordListSearch: "",
      branchScenarioSearch: "",
      branchTurnSearch: "",
      branchPathSearch: "",
      validationSearch: "",
      validationItems: [],
      deletionUndoStack: [],
      dirty: false,
      statusText: "Папка не выбрана. Можно загрузить текущие JSON через fetch.",
      message: null
    };
  }

  root.createEditorState = createEditorState;
})();
