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

  function formatRole(role) {
    return roleLabels[role] || role;
  }

  root.dictionaries = {
    roleLabels,
    formatRole
  };
})();
