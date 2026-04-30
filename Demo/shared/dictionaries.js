(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  const roleLabels = {
    greeting: "приветствие",
    subject: "субъект",
    negation: "отрицание",
    modal: "модальность",
    polite: "вежливость",
    intro: "вводное слово",
    connector: "связка",
    comma: "запятая",
    sentence_end: "конец фразы",
    closing: "завершение",
    object: "объект",
    verb: "действие",
    detail: "деталь",
    empathy: "эмпатия",
    insult: "оскорбление",
    reason: "причина",
    question_word: "вопросительное слово",
    method: "метод",
    number: "число",
    style: "стиль"
  };

  const riskLabels = {
    safe: "безопасный",
    trap: "ловушка",
    illegal: "опасный/запрещенный"
  };

  const tokenKindLabels = {
    common: "Общие",
    scenario: "Сценарные"
  };

  function formatRole(role) {
    return roleLabels[role] || role;
  }

  function formatRisk(risk) {
    return riskLabels[risk] || risk;
  }

  function formatTokenKind(kind) {
    return tokenKindLabels[kind] || kind;
  }

  root.dictionaries = {
    roleLabels,
    riskLabels,
    tokenKindLabels,
    formatRole,
    formatRisk,
    formatTokenKind
  };
})();
