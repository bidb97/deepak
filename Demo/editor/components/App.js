(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const { formatRisk, formatRole, formatTokenKind } = root.dictionaries;
  const { validateContent } = root.validation;

function parseCsv(value) {
  return [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))];
}

function textToRequiresAny(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map(parseCsv)
    .filter((group) => group.length > 0);
}

function requiresAnyToText(value) {
  return (Array.isArray(value) ? value : [])
    .map((group) => (Array.isArray(group) ? group.join(", ") : ""))
    .filter(Boolean)
    .join("\n");
}

  root.EditorApp = {
  components: {
    TokensPanel: root.TokensPanel,
    CharactersPanel: root.CharactersPanel,
    DialoguesPanel: root.DialoguesPanel,
    BranchesPanel: root.BranchesPanel,
    ValidationPanel: root.ValidationPanel
  },
  props: ["model", "api"],
  computed: {
    roles() { return [...new Set(this.model.allTokens.map(({ token }) => token.role).filter(Boolean))].sort(); },
    risks() { return [...new Set(this.model.allTokens.map(({ token }) => token.risk).filter(Boolean))].sort(); },
    currentComponent() {
      const map = { tokens: "TokensPanel", characters: "CharactersPanel", dialogues: "DialoguesPanel", branches: "BranchesPanel", validation: "ValidationPanel" };
      return map[this.model.tab] || "TokensPanel";
    }
  },
  methods: {
    formatRole, formatRisk, formatKind: formatTokenKind,
    setMessage(text, type = "good") { this.model.message = { text, type }; },
    refreshValidation() { this.model.validationItems = validateContent(this.model); },
    async openDemoFolder() {
      const handle = await this.api.pickDemoHandle();
      if (!handle) return;
      this.model.demoHandle = handle;
      await this.api.rememberDemoHandle(handle);
      await this.reload();
    },
    async reload() {
      try {
        const content = await this.api.loadEditorContent(this.model.demoHandle);
        this.model.tokensData = content.tokensData;
        this.model.charactersData = content.charactersData;
        this.model.scenariosData = content.scenariosData;
        this.model.allTokens = [...this.model.tokensData.common.map((token) => ({ token, kind: "common" })), ...this.model.tokensData.scenario.map((token) => ({ token, kind: "scenario" }))];
        this.model.selectedTokenId = this.model.allTokens[0]?.token.id || "";
        this.model.selectedTokenKind = this.model.allTokens[0]?.kind || "common";
        this.model.selectedCharacterId = this.model.charactersData.characters[0]?.id || "";
        this.model.selectedScenarioId = this.model.scenariosData.scenarios[0]?.id || "";
        this.updateSelections();
        this.refreshValidation();
        this.model.statusText = this.model.demoHandle
          ? `Подключено: ${this.model.demoHandle.name}/data`
          : (window.location.protocol === "file:" ? "Режим file://: открой папку Demo." : "Источник: fetch");
      } catch (error) {
        if (error?.message === "FILE_PROTOCOL_REQUIRES_DEMO_FOLDER") {
          this.model.statusText = "Режим file://: открой папку Demo.";
          this.setMessage("Для file:// сначала открой папку Demo.", "warn");
          return;
        }
        this.setMessage("Не удалось загрузить данные.", "bad");
      }
    },
    async save() {
      if (!this.model.demoHandle) return this.setMessage("Сначала открой папку Demo.", "bad");
      this.refreshValidation();
      if (this.model.validationItems.some((item) => item.type === "bad")) return this.setMessage("Есть ошибки валидации.", "bad");
      await this.api.saveEditorContent(this.model.demoHandle, this.model);
      this.model.dirty = false;
      this.setMessage("Сохранено: tokens.json, characters.json, scenarios.json.", "good");
    },
    updateSelections() {
      this.model.selectedToken = this.model.allTokens.find(({ token, kind }) => token.id === this.model.selectedTokenId && kind === this.model.selectedTokenKind)?.token || null;
      this.model.selectedTokenConcepts = (this.model.selectedToken?.concepts || []).join(", ");
      this.model.selectedTokenTopics = (this.model.selectedToken?.topics || []).join(", ");
      this.model.selectedCharacter = this.model.charactersData.characters.find((item) => item.id === this.model.selectedCharacterId) || null;
      this.model.selectedScenario = this.model.scenariosData.scenarios.find((item) => item.id === this.model.selectedScenarioId) || null;
      this.model.selectedTurn = this.model.selectedScenario?.turns[this.model.selectedTurnIndex] || null;
      this.model.selectedPath = this.model.selectedTurn?.paths[this.model.selectedPathIndex] || null;
      if (this.model.selectedTurn && this.model.selectedPathIndex >= this.model.selectedTurn.paths.length) {
        this.model.selectedPathIndex = Math.max(0, this.model.selectedTurn.paths.length - 1);
        this.model.selectedPath = this.model.selectedTurn.paths[this.model.selectedPathIndex] || null;
      }
      this.model.selectedPathRequiresAnyText = requiresAnyToText(this.model.selectedPath?.requiresAny || []);
      this.model.selectedPathRequiresConcepts = (this.model.selectedPath?.requiresConcepts || []).join(", ");
      this.model.selectedPathForbiddenConcepts = (this.model.selectedPath?.forbiddenConcepts || []).join(", ");
      this.model.selectedPathMaxVerbCount = this.model.selectedPath?.maxVerbCount ?? "";
    },
    selectToken(kind, id) { this.model.selectedTokenKind = kind; this.model.selectedTokenId = id; this.updateSelections(); },
    addToken() {
      const id = `tok_${Date.now()}`;
      const next = { id, text: "новый токен", role: "object", concepts: [], risk: "safe", topics: [] };
      this.model.tokensData.common.push(next);
      this.model.selectedTokenKind = "common";
      this.model.selectedTokenId = id;
      this.model.allTokens.push({ token: next, kind: "common" });
      this.updateSelections();
    },
    saveToken() {
      if (!this.model.selectedToken) return;
      this.model.selectedToken.concepts = parseCsv(this.model.selectedTokenConcepts);
      this.model.selectedToken.topics = parseCsv(this.model.selectedTokenTopics);
      const updatedId = this.model.selectedToken.id;
      const list = this.model.selectedTokenKind === "common" ? this.model.tokensData.common : this.model.tokensData.scenario;
      if (!list.includes(this.model.selectedToken)) {
        this.model.tokensData.common = this.model.tokensData.common.filter((item) => item !== this.model.selectedToken);
        this.model.tokensData.scenario = this.model.tokensData.scenario.filter((item) => item !== this.model.selectedToken);
        list.push(this.model.selectedToken);
      }
      this.model.allTokens = [...this.model.tokensData.common.map((token) => ({ token, kind: "common" })), ...this.model.tokensData.scenario.map((token) => ({ token, kind: "scenario" }))];
      this.model.selectedTokenId = updatedId;
      this.updateSelections();
    },
    deleteToken() {
      if (!this.model.selectedToken) return;
      this.model.tokensData.common = this.model.tokensData.common.filter((item) => item !== this.model.selectedToken);
      this.model.tokensData.scenario = this.model.tokensData.scenario.filter((item) => item !== this.model.selectedToken);
      this.model.allTokens = [...this.model.tokensData.common.map((token) => ({ token, kind: "common" })), ...this.model.tokensData.scenario.map((token) => ({ token, kind: "scenario" }))];
      this.model.selectedTokenId = this.model.allTokens[0]?.token.id || "";
      this.model.selectedTokenKind = this.model.allTokens[0]?.kind || "common";
      this.updateSelections();
    },
    addCharacter() {
      const character = { id: `character_${Date.now()}`, name: "Новый персонаж", archetype: "default", notes: "" };
      this.model.charactersData.characters.push(character);
      this.model.selectedCharacterId = character.id;
      this.updateSelections();
    },
    saveCharacter() {
      if (this.model.selectedCharacter) this.model.selectedCharacterId = this.model.selectedCharacter.id;
      this.updateSelections();
    },
    deleteCharacter() {
      if (!this.model.selectedCharacter) return;
      const used = this.model.scenariosData.scenarios.some((scenario) => scenario.characterId === this.model.selectedCharacter.id);
      if (used) return this.setMessage("Нельзя удалить персонажа, пока есть сценарии с его characterId.", "bad");
      this.model.charactersData.characters = this.model.charactersData.characters.filter((item) => item !== this.model.selectedCharacter);
      this.model.selectedCharacterId = this.model.charactersData.characters[0]?.id || "";
      this.updateSelections();
    },
    addScenario() {
      this.model.scenariosData.scenarios.push({ id: `scenario_${Date.now()}`, title: "Новый сценарий", characterId: this.model.selectedCharacterId || "", topic: "", turns: [{ request: "Новая реплика пользователя", contextTokens: [], memoryTokens: [], paths: [] }] });
      this.model.selectedScenarioId = this.model.scenariosData.scenarios.at(-1)?.id || "";
      this.model.selectedTurnIndex = 0;
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    selectScenario(id) { this.model.selectedScenarioId = id; this.model.selectedTurnIndex = 0; this.model.selectedPathIndex = 0; this.updateSelections(); },
    saveScenario() {
      if (this.model.selectedScenario) this.model.selectedScenarioId = this.model.selectedScenario.id;
      this.updateSelections();
    },
    deleteScenario() { this.model.scenariosData.scenarios = this.model.scenariosData.scenarios.filter((item) => item !== this.model.selectedScenario); this.model.selectedScenarioId = this.model.scenariosData.scenarios[0]?.id || ""; this.updateSelections(); },
    addTurn() {
      if (!this.model.selectedScenario) return;
      this.model.selectedScenario.turns.push({ request: "Новая реплика пользователя", contextTokens: [], memoryTokens: [], paths: [] });
      this.model.selectedTurnIndex = this.model.selectedScenario.turns.length - 1;
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    selectTurn(index) {
      this.model.selectedTurnIndex = Number(index) || 0;
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    saveTurn() { this.updateSelections(); },
    deleteTurn() {
      if (!this.model.selectedScenario || !this.model.selectedTurn) return;
      this.model.selectedScenario.turns.splice(this.model.selectedTurnIndex, 1);
      this.model.selectedTurnIndex = Math.max(0, this.model.selectedTurnIndex - 1);
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    selectBranchScenario(id) {
      this.model.selectedScenarioId = id;
      this.model.selectedTurnIndex = 0;
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    selectBranchTurn(index) {
      this.model.selectedTurnIndex = Number(index) || 0;
      this.model.selectedPathIndex = 0;
      this.updateSelections();
    },
    selectPath(index) {
      this.model.selectedPathIndex = Number(index) || 0;
      this.updateSelections();
    },
    addPath() { if (!this.model.selectedTurn) return; this.model.selectedTurn.paths.push({ id: `path_${Date.now()}`, title: "Новая ветка", requiresAny: [], reaction: "" }); this.model.selectedPathIndex = this.model.selectedTurn.paths.length - 1; this.updateSelections(); },
    deletePath() { if (!this.model.selectedTurn || !this.model.selectedPath) return; this.model.selectedTurn.paths = this.model.selectedTurn.paths.filter((item) => item !== this.model.selectedPath); this.model.selectedPathIndex = 0; this.updateSelections(); },
    savePath() {
      if (!this.model.selectedPath) return;
      this.model.selectedPath.requiresAny = textToRequiresAny(this.model.selectedPathRequiresAnyText);
      this.model.selectedPath.requiresConcepts = parseCsv(this.model.selectedPathRequiresConcepts);
      this.model.selectedPath.forbiddenConcepts = parseCsv(this.model.selectedPathForbiddenConcepts);
      const maxVerbCount = String(this.model.selectedPathMaxVerbCount ?? "").trim();
      if (maxVerbCount === "") delete this.model.selectedPath.maxVerbCount;
      else this.model.selectedPath.maxVerbCount = Number(maxVerbCount);
      this.updateSelections();
    }
  },
  async mounted() {
    this.model.demoHandle = await this.api.restoreDemoHandle();
    await this.reload();
  },
  template: `
    <div class="editor-shell">
      <aside class="sidebar window">
        <div class="title-bar">
          <div class="title-bar-text">Demo Content Editor</div>
        </div>
        <div class="window-body stack">
          <div class="brand"><span class="eyebrow">I Am Deepak</span><h1>Demo Content Editor</h1></div>
          <button type="button" class="default" @click="openDemoFolder">Открыть папку Demo</button>
          <button type="button" :disabled="!model.demoHandle" @click="save">Сохранить JSON</button>
          <a class="demo-link" href="#/game">Открыть демку</a>
          <menu role="tablist" class="tabs">
            <li role="tab" :aria-selected="model.tab === 'tokens'"><a href="#/editor" @click.prevent="model.tab = 'tokens'">Токены</a></li>
            <li role="tab" :aria-selected="model.tab === 'characters'"><a href="#/editor" @click.prevent="model.tab = 'characters'">Персонажи</a></li>
            <li role="tab" :aria-selected="model.tab === 'dialogues'"><a href="#/editor" @click.prevent="model.tab = 'dialogues'">Диалоги</a></li>
            <li role="tab" :aria-selected="model.tab === 'branches'"><a href="#/editor" @click.prevent="model.tab = 'branches'">Ветки</a></li>
            <li role="tab" :aria-selected="model.tab === 'validation'"><a href="#/editor" @click.prevent="model.tab = 'validation'; refreshValidation();">Проверка</a></li>
          </menu>
          <div class="connection-card status-bar">
            <p class="status-bar-field">Статус</p>
            <p class="status-bar-field">{{ model.statusText }}</p>
          </div>
        </div>
      </aside>
      <main class="workspace window">
        <div class="title-bar">
          <div class="title-bar-text">Источник контента - {{ model.tab }}</div>
          <div class="title-bar-controls">
            <button aria-label="Help"></button>
          </div>
        </div>
        <div class="window-body">
          <header class="toolbar">
            <div class="toolbar-actions">
              <button type="button" @click="reload">Перезагрузить</button>
              <button type="button" @click="refreshValidation(); model.tab='validation'">Проверить связи</button>
            </div>
          </header>
          <section class="messages" v-if="model.message"><div class="message" :class="model.message.type">{{ model.message.text }}</div></section>
          <section class="view">
            <component :is="currentComponent" :model="model" :roles="roles" :risks="risks" :format-role="formatRole" :format-risk="formatRisk" :format-kind="formatKind" :items="model.validationItems" @add-token="addToken" @save-token="saveToken" @delete-token="deleteToken" @select-token="selectToken" @add-character="addCharacter" @save-character="saveCharacter" @delete-character="deleteCharacter" @select-character="(id) => { model.selectedCharacterId = id; updateSelections(); }" @add-scenario="addScenario" @select-scenario="selectScenario" @save-scenario="saveScenario" @delete-scenario="deleteScenario" @add-turn="addTurn" @select-turn="selectTurn" @save-turn="saveTurn" @delete-turn="deleteTurn" @select-branch-scenario="selectBranchScenario" @select-branch-turn="selectBranchTurn" @select-path="selectPath" @add-path="addPath" @delete-path="deletePath" @save-path="savePath" />
          </section>
        </div>
      </main>
    </div>
  `
  };
})();
