(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function createEditorState() {
    return {
      tab: "tokens",
      demoHandle: null,
      tokensData: { common: [], scenario: [] },
      charactersData: { characters: [] },
      scenariosData: { scenarios: [] },
      selectedTokenKind: "common",
      selectedTokenId: "",
      selectedCharacterId: "",
      selectedScenarioId: "",
      selectedTurnIndex: 0,
      selectedPathIndex: 0,
      tokenSearch: "",
      tokenRoleFilter: "all",
      tokenRiskFilter: "all",
      tokenKindFilter: "all",
      validationItems: [],
      dirty: false,
      statusText: "Папка не выбрана. Можно загрузить текущие JSON через fetch.",
      message: null
    };
  }

  root.createEditorState = createEditorState;
})();
