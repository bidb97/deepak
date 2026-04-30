(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function createEditorModel() {
    return Vue.reactive({
      ...root.createEditorState(),
      allTokens: [],
      selectedToken: null,
      selectedTokenConcepts: "",
      selectedTokenTopics: "",
      selectedCharacter: null,
      selectedScenario: null,
      selectedTurn: null,
      selectedPath: null,
      selectedPathRequiresAnyText: "",
      selectedPathRequiresConcepts: "",
      selectedPathForbiddenConcepts: "",
      selectedPathMaxVerbCount: ""
    });
  }

  root.createEditorModel = createEditorModel;
})();
