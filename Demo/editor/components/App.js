(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const { formatRole } = root.dictionaries;
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

  /** Сколько последних удалений хранить в стеке и в localStorage (очередь с отсечением с конца). */
  const EDITOR_DELETION_UNDO_LIMIT = 10;

  const EDITOR_DELETION_STACK_KEY = "deepakDemo.editorDeletionUndoStack";

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  root.EditorApp = {
  components: {
    TokensPanel: root.TokensPanel,
    TagsPanel: root.TagsPanel,
    CharactersPanel: root.CharactersPanel,
    DialoguesPanel: root.DialoguesPanel,
    BranchesPanel: root.BranchesPanel,
    ValidationPanel: root.ValidationPanel
  },
  props: ["model", "api"],
  data() {
    return {
      deletionModalOpen: false,
      deletionUndoMax: EDITOR_DELETION_UNDO_LIMIT
    };
  },
  computed: {
    roles() {
      const roles = new Set(Object.keys(root.dictionaries.roleLabels || {}));
      (this.model.scenariosData?.scenarios || []).forEach((scenario) => {
        (scenario.turns || []).forEach((turn) => {
          (turn.keywords || []).forEach((keyword) => {
            (keyword.tokens || []).forEach((tokenRef) => {
              if (tokenRef.role) roles.add(tokenRef.role);
            });
          });
          (turn.paths || []).forEach((path) => {
            (path.requiresRole || []).forEach((role) => roles.add(role));
          });
        });
      });
      return [...roles].sort();
    },
    currentComponent() {
      const map = {
        tokens: "TokensPanel",
        tags: "TagsPanel",
        characters: "CharactersPanel",
        dialogues: "DialoguesPanel",
        branches: "BranchesPanel",
        validation: "ValidationPanel"
      };
      return map[this.model.tab] || "TokensPanel";
    }
  },
  methods: {
    formatRole,
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
        this.model.tagsData = content.tagsData;
        this.model.charactersData = content.charactersData;
        this.model.scenariosData = content.scenariosData;
        this.model.allTokens = this.model.tokensData.tokens;
        this.model.selectedTokenId = this.model.allTokens[0]?.id || "";
        this.model.selectedTagId = this.model.tagsData.tags[0]?.id || "";
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
    async persistEditorToDisk() {
      if (!this.model.demoHandle) return { ok: false, reason: "no-handle" };
      this.refreshValidation();
      if (this.model.validationItems.some((item) => item.type === "bad")) return { ok: false, reason: "validation" };
      try {
        await this.api.saveEditorContent(this.model.demoHandle, this.model);
        this.model.dirty = false;
        return { ok: true };
      } catch (_e) {
        return { ok: false, reason: "write" };
      }
    },
    /** Одна JSON-таблица в data/ по имени файла. Без полной валидации всего проекта. quiet — без зелёного сообщения. */
    async writeSingleDataFile(fileName, successMessage, quiet) {
      if (!this.model.demoHandle) {
        if (!quiet) this.setMessage("Изменения в памяти. Открой папку Demo, чтобы писать файлы.", "warn");
        return false;
      }
      const slice = {
        "tokens.json": this.model.tokensData,
        "tags.json": this.model.tagsData,
        "characters.json": this.model.charactersData,
        "scenarios.json": this.model.scenariosData
      }[fileName];
      if (!slice) return false;
      try {
        await this.api.saveEditorDataFile(this.model.demoHandle, fileName, slice);
        if (successMessage && !quiet) this.setMessage(successMessage, "good");
        return true;
      } catch (_e) {
        this.setMessage("Не удалось записать файл.", "bad");
        return false;
      }
    },
    persistDeletionStackToStorage() {
      try {
        const arr = Array.isArray(this.model.deletionUndoStack) ? this.model.deletionUndoStack : [];
        localStorage.setItem(EDITOR_DELETION_STACK_KEY, JSON.stringify(arr));
      } catch (_e) {}
    },
    restoreDeletionStackFromStorage() {
      try {
        const raw = localStorage.getItem(EDITOR_DELETION_STACK_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        const cleaned = parsed.filter(
          (r) => r && typeof r === "object" && r.key && r.kind && r.fileName && r.title && r.data != null
        );
        this.model.deletionUndoStack = cleaned.slice(0, EDITOR_DELETION_UNDO_LIMIT);
        if (cleaned.length > EDITOR_DELETION_UNDO_LIMIT) this.persistDeletionStackToStorage();
      } catch (_e) {
        this.model.deletionUndoStack = [];
      }
    },
    pushDeletionRecord(record) {
      if (!Array.isArray(this.model.deletionUndoStack)) this.model.deletionUndoStack = [];
      const rec = {
        key: `del_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        kind: record.kind,
        fileName: record.fileName,
        title: record.title,
        data: record.data
      };
      this.model.deletionUndoStack.unshift(rec);
      while (this.model.deletionUndoStack.length > EDITOR_DELETION_UNDO_LIMIT) this.model.deletionUndoStack.pop();
      this.persistDeletionStackToStorage();
      return rec.key;
    },
    scenarioById(scenarioId) {
      return this.model.scenariosData.scenarios.find((s) => s.id === scenarioId) || null;
    },
    async undoDeletion(rec) {
      if (!rec || !rec.kind || !rec.data) return;
      const stack = this.model.deletionUndoStack || [];
      const ix = stack.findIndex((r) => r.key === rec.key);
      if (ix < 0) return;
      stack.splice(ix, 1);
      const d = rec.data;
      try {
        switch (rec.kind) {
          case "token": {
            const arr = this.model.tokensData.tokens;
            arr.splice(Math.min(d.index, arr.length), 0, deepClone(d.item));
            this.model.allTokens = arr;
            this.model.selectedTokenId = d.item.id;
            break;
          }
          case "tag": {
            const arr = this.model.tagsData.tags;
            arr.splice(Math.min(d.index, arr.length), 0, deepClone(d.item));
            this.model.selectedTagId = d.item.id;
            break;
          }
          case "character": {
            const arr = this.model.charactersData.characters;
            arr.splice(Math.min(d.index, arr.length), 0, deepClone(d.item));
            this.model.selectedCharacterId = d.item.id;
            break;
          }
          case "scenario": {
            const arr = this.model.scenariosData.scenarios;
            arr.splice(Math.min(d.index, arr.length), 0, deepClone(d.item));
            this.model.selectedScenarioId = d.item.id;
            this.model.selectedTurnIndex = 0;
            this.model.selectedPathIndex = 0;
            this.model.selectedKeywordIndex = 0;
            break;
          }
          case "turn": {
            const scen = this.scenarioById(d.scenarioId);
            if (!scen) throw new Error("scenario");
            scen.turns.splice(Math.min(d.turnIndex, scen.turns.length), 0, deepClone(d.item));
            this.model.selectedScenarioId = d.scenarioId;
            this.model.selectedTurnIndex = d.turnIndex;
            this.model.selectedPathIndex = 0;
            this.model.selectedKeywordIndex = 0;
            break;
          }
          case "keyword": {
            const scen = this.scenarioById(d.scenarioId);
            if (!scen || !scen.turns[d.turnIndex]) throw new Error("turn");
            const kwArr = scen.turns[d.turnIndex].keywords;
            kwArr.splice(Math.min(d.keywordIndex, kwArr.length), 0, deepClone(d.item));
            this.model.selectedScenarioId = d.scenarioId;
            this.model.selectedTurnIndex = d.turnIndex;
            this.model.selectedKeywordIndex = d.keywordIndex;
            break;
          }
          case "path": {
            const scen = this.scenarioById(d.scenarioId);
            if (!scen || !scen.turns[d.turnIndex]) throw new Error("turn");
            const paths = scen.turns[d.turnIndex].paths;
            paths.splice(Math.min(d.pathIndex, paths.length), 0, deepClone(d.item));
            this.model.selectedScenarioId = d.scenarioId;
            this.model.selectedTurnIndex = d.turnIndex;
            this.model.selectedPathIndex = d.pathIndex;
            break;
          }
          default:
            return;
        }
      } catch (_e) {
        stack.splice(ix, 0, rec);
        this.setMessage("Не удалось восстановить запись.", "bad");
        this.persistDeletionStackToStorage();
        return;
      }
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile(rec.fileName, "Восстановлено и сохранено.", false);
      else this.setMessage("Восстановлено в памяти. Открой папку Demo для записи на диск.", "warn");
      this.refreshValidation();
      this.persistDeletionStackToStorage();
    },
    async save() {
      const r = await this.persistEditorToDisk();
      if (!r.ok) {
        if (r.reason === "no-handle") return this.setMessage("Сначала открой папку Demo.", "bad");
        if (r.reason === "validation") return this.setMessage("Есть ошибки валидации.", "bad");
        return this.setMessage("Не удалось записать файлы.", "bad");
      }
      this.setMessage("Сохранено: tokens.json, tags.json, characters.json, scenarios.json.", "good");
    },
    updateSelections() {
      this.model.selectedToken = this.model.allTokens.find((token) => token.id === this.model.selectedTokenId) || null;
      if (this.model.selectedToken && !Array.isArray(this.model.selectedToken.tagIds)) this.model.selectedToken.tagIds = [];
      this.model.selectedTag = this.model.tagsData.tags.find((tag) => tag.id === this.model.selectedTagId) || null;
      this.model.selectedCharacter = this.model.charactersData.characters.find((item) => item.id === this.model.selectedCharacterId) || null;
      this.model.selectedScenario = this.model.scenariosData.scenarios.find((item) => item.id === this.model.selectedScenarioId) || null;
      this.model.selectedTurn = this.model.selectedScenario?.turns[this.model.selectedTurnIndex] || null;
      this.model.selectedKeyword = this.model.selectedTurn?.keywords?.[this.model.selectedKeywordIndex] || null;
      if (this.model.selectedKeyword && !Array.isArray(this.model.selectedKeyword.tagIds)) this.model.selectedKeyword.tagIds = [];
      if (this.model.selectedTurn && this.model.selectedKeywordIndex >= this.model.selectedTurn.keywords.length) {
        this.model.selectedKeywordIndex = Math.max(0, this.model.selectedTurn.keywords.length - 1);
        this.model.selectedKeyword = this.model.selectedTurn.keywords[this.model.selectedKeywordIndex] || null;
      }
      this.model.selectedPath = this.model.selectedTurn?.paths[this.model.selectedPathIndex] || null;
      if (this.model.selectedTurn && this.model.selectedPathIndex >= this.model.selectedTurn.paths.length) {
        this.model.selectedPathIndex = Math.max(0, this.model.selectedTurn.paths.length - 1);
        this.model.selectedPath = this.model.selectedTurn.paths[this.model.selectedPathIndex] || null;
      }
      this.model.selectedPathRequiresAnyText = requiresAnyToText(this.model.selectedPath?.requiresAny || []);
      this.model.selectedPathRequiresConcepts = (this.model.selectedPath?.requiresConcepts || []).join(", ");
      this.model.selectedPathForbiddenConcepts = (this.model.selectedPath?.forbiddenConcepts || []).join(", ");
      this.model.selectedPathMaxVerbCount = this.model.selectedPath?.maxVerbCount ?? "";
      if (this.model.selectedPath) {
        const rr = this.model.selectedPath.requiresRole;
        if (!Array.isArray(rr))
          this.model.selectedPath.requiresRole =
            rr == null || rr === "" ? [] : Array.isArray(rr) ? [...rr] : [rr];
      }
    },
    selectToken(id) { this.model.selectedTokenId = id; this.updateSelections(); },
    selectTag(id) { this.model.selectedTagId = id; this.updateSelections(); },
    addTag() {
      const tag = { id: `tag_${Date.now()}`, title: "Новый тег" };
      this.model.tagsData.tags.push(tag);
      this.model.selectedTagId = tag.id;
      this.updateSelections();
    },
    async saveTag() {
      if (this.model.selectedTag) this.model.selectedTagId = this.model.selectedTag.id;
      this.updateSelections();
      await this.writeSingleDataFile("tags.json", "Сохранено: tags.json");
    },
    async deleteTag() {
      if (!this.model.selectedTag) return;
      const tags = this.model.tagsData.tags;
      const idx = tags.indexOf(this.model.selectedTag);
      if (idx < 0) return;
      const item = deepClone(tags[idx]);
      tags.splice(idx, 1);
      this.model.selectedTagId = tags[0]?.id || "";
      this.pushDeletionRecord({
        kind: "tag",
        fileName: "tags.json",
        title: `Тег «${item.title || item.id}»`,
        data: { index: idx, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("tags.json", "", true);
    },
    addToken() {
      const id = `tok_${Date.now()}`;
      const next = { id, text: "новый токен", tagIds: [] };
      this.model.tokensData.tokens.push(next);
      this.model.selectedTokenId = id;
      this.model.allTokens = this.model.tokensData.tokens;
      this.updateSelections();
    },
    async saveToken() {
      if (!this.model.selectedToken) return;
      if (!Array.isArray(this.model.selectedToken.tagIds)) this.model.selectedToken.tagIds = [];
      const updatedId = this.model.selectedToken.id;
      this.model.allTokens = this.model.tokensData.tokens;
      this.model.selectedTokenId = updatedId;
      this.updateSelections();
      await this.writeSingleDataFile("tokens.json", "Сохранено: tokens.json");
    },
    async deleteToken() {
      if (!this.model.selectedToken) return;
      const arr = this.model.tokensData.tokens;
      const idx = arr.indexOf(this.model.selectedToken);
      if (idx < 0) return;
      const item = deepClone(arr[idx]);
      arr.splice(idx, 1);
      this.model.allTokens = arr;
      this.model.selectedTokenId = this.model.allTokens[0]?.id || "";
      this.pushDeletionRecord({
        kind: "token",
        fileName: "tokens.json",
        title: `Токен «${item.text || item.id}»`,
        data: { index: idx, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("tokens.json", "", true);
    },
    addCharacter() {
      const character = { id: `character_${Date.now()}`, name: "Новый персонаж", archetype: "default", notes: "" };
      this.model.charactersData.characters.push(character);
      this.model.selectedCharacterId = character.id;
      this.updateSelections();
    },
    async saveCharacter() {
      if (this.model.selectedCharacter) this.model.selectedCharacterId = this.model.selectedCharacter.id;
      this.updateSelections();
      await this.writeSingleDataFile("characters.json", "Сохранено: characters.json");
    },
    async deleteCharacter() {
      if (!this.model.selectedCharacter) return;
      const used = this.model.scenariosData.scenarios.some((scenario) => scenario.characterId === this.model.selectedCharacter.id);
      if (used) return this.setMessage("Нельзя удалить персонажа, пока есть сценарии с его characterId.", "bad");
      const chars = this.model.charactersData.characters;
      const idx = chars.indexOf(this.model.selectedCharacter);
      if (idx < 0) return;
      const item = deepClone(chars[idx]);
      chars.splice(idx, 1);
      this.model.selectedCharacterId = chars[0]?.id || "";
      this.pushDeletionRecord({
        kind: "character",
        fileName: "characters.json",
        title: `Персонаж «${item.name || item.id}»`,
        data: { index: idx, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("characters.json", "", true);
    },
    addScenario() {
      this.model.scenariosData.scenarios.push({ id: `scenario_${Date.now()}`, title: "Новый сценарий", characterId: this.model.selectedCharacterId || "", topic: "", turns: [{ request: "Новая реплика пользователя", keywords: [], paths: [] }] });
      this.model.selectedScenarioId = this.model.scenariosData.scenarios.at(-1)?.id || "";
      this.model.selectedTurnIndex = 0;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.updateSelections();
    },
    selectScenario(id) { this.model.selectedScenarioId = id; this.model.selectedTurnIndex = 0; this.model.selectedPathIndex = 0; this.model.selectedKeywordIndex = 0; this.updateSelections(); },
    async saveScenario() {
      if (this.model.selectedScenario) this.model.selectedScenarioId = this.model.selectedScenario.id;
      this.updateSelections();
      await this.writeSingleDataFile("scenarios.json", "Сохранено: scenarios.json");
    },
    openScenario() {
      if (!this.model.selectedScenario?.id) return;
      window.location.hash = `#/game?scenario=${encodeURIComponent(this.model.selectedScenario.id)}`;
    },
    async deleteScenario() {
      if (!this.model.selectedScenario) return;
      const list = this.model.scenariosData.scenarios;
      const idx = list.indexOf(this.model.selectedScenario);
      if (idx < 0) return;
      const item = deepClone(list[idx]);
      list.splice(idx, 1);
      this.model.selectedScenarioId = list[0]?.id || "";
      this.model.selectedTurnIndex = 0;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.pushDeletionRecord({
        kind: "scenario",
        fileName: "scenarios.json",
        title: `Сценарий «${item.title || item.id}»`,
        data: { index: idx, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("scenarios.json", "", true);
    },
    addTurn() {
      if (!this.model.selectedScenario) return;
      this.model.selectedScenario.turns.push({ request: "Новая реплика пользователя", keywords: [], paths: [] });
      this.model.selectedTurnIndex = this.model.selectedScenario.turns.length - 1;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.updateSelections();
    },
    selectTurn(index) {
      this.model.selectedTurnIndex = Number(index) || 0;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.updateSelections();
    },
    async saveTurn() {
      this.updateSelections();
      await this.writeSingleDataFile("scenarios.json", "Сохранено: scenarios.json");
    },
    addKeyword() {
      if (!this.model.selectedTurn) return;
      const keyword = { id: `kw_${Date.now()}`, text: "ключевое слово", tokens: [], tagIds: [] };
      this.model.selectedTurn.keywords.push(keyword);
      this.model.selectedKeywordIndex = this.model.selectedTurn.keywords.length - 1;
      this.updateSelections();
    },
    toggleKeywordToken(tokenId, checked) {
      if (!this.model.selectedKeyword) return;
      if (!Array.isArray(this.model.selectedKeyword.tokens)) this.model.selectedKeyword.tokens = [];
      const existingIndex = this.model.selectedKeyword.tokens.findIndex((tokenRef) => tokenRef.tokenId === tokenId);
      if (checked && existingIndex < 0) {
        this.model.selectedKeyword.tokens.push({ tokenId, role: "object", concepts: [] });
      } else if (!checked && existingIndex >= 0) {
        this.model.selectedKeyword.tokens.splice(existingIndex, 1);
      }
      this.updateSelections();
    },
    selectKeyword(index) {
      this.model.selectedKeywordIndex = Number(index) || 0;
      this.updateSelections();
    },
    async deleteKeyword() {
      if (!this.model.selectedScenario || !this.model.selectedTurn || !this.model.selectedKeyword) return;
      const scenarioId = this.model.selectedScenario.id;
      const turnIndex = this.model.selectedTurnIndex;
      const keywordIndex = this.model.selectedKeywordIndex;
      const kwArr = this.model.selectedTurn.keywords;
      const item = deepClone(kwArr[keywordIndex]);
      if (!item) return;
      kwArr.splice(keywordIndex, 1);
      this.model.selectedKeywordIndex = Math.max(0, keywordIndex - 1);
      this.pushDeletionRecord({
        kind: "keyword",
        fileName: "scenarios.json",
        title: `Ключ «${item.text || item.id}»`,
        data: { scenarioId, turnIndex, keywordIndex, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("scenarios.json", "", true);
    },
    async deleteTurn() {
      if (!this.model.selectedScenario || !this.model.selectedTurn) return;
      const scenarioId = this.model.selectedScenario.id;
      const turnIndex = this.model.selectedTurnIndex;
      const turns = this.model.selectedScenario.turns;
      const item = deepClone(turns[turnIndex]);
      if (!item) return;
      turns.splice(turnIndex, 1);
      this.model.selectedTurnIndex = Math.max(0, turnIndex - 1);
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.pushDeletionRecord({
        kind: "turn",
        fileName: "scenarios.json",
        title: `Ход ${turnIndex + 1} (сценарий «${this.model.selectedScenario.title || scenarioId}»)`,
        data: { scenarioId, turnIndex, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("scenarios.json", "", true);
    },
    selectBranchScenario(id) {
      this.model.selectedScenarioId = id;
      this.model.selectedTurnIndex = 0;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.updateSelections();
    },
    selectBranchTurn(index) {
      this.model.selectedTurnIndex = Number(index) || 0;
      this.model.selectedPathIndex = 0;
      this.model.selectedKeywordIndex = 0;
      this.updateSelections();
    },
    selectPath(index) {
      this.model.selectedPathIndex = Number(index) || 0;
      this.updateSelections();
    },
    addPath() { if (!this.model.selectedTurn) return; this.model.selectedTurn.paths.push({ id: `path_${Date.now()}`, title: "Новая ветка", requiresAny: [], reaction: "" }); this.model.selectedPathIndex = this.model.selectedTurn.paths.length - 1; this.updateSelections(); },
    async deletePath() {
      if (!this.model.selectedScenario || !this.model.selectedTurn || !this.model.selectedPath) return;
      const scenarioId = this.model.selectedScenario.id;
      const turnIndex = this.model.selectedTurnIndex;
      const pi = this.model.selectedPathIndex;
      const paths = this.model.selectedTurn.paths;
      const item = deepClone(paths[pi]);
      if (!item) return;
      paths.splice(pi, 1);
      this.model.selectedPathIndex = 0;
      this.pushDeletionRecord({
        kind: "path",
        fileName: "scenarios.json",
        title: `Ветка «${item.title || item.id}»`,
        data: { scenarioId, turnIndex, pathIndex: pi, item }
      });
      this.updateSelections();
      if (this.model.demoHandle) await this.writeSingleDataFile("scenarios.json", "", true);
    },
    async savePath() {
      if (!this.model.selectedPath) return;
      this.model.selectedPath.requiresAny = textToRequiresAny(this.model.selectedPathRequiresAnyText);
      this.model.selectedPath.requiresConcepts = parseCsv(this.model.selectedPathRequiresConcepts);
      this.model.selectedPath.forbiddenConcepts = parseCsv(this.model.selectedPathForbiddenConcepts);
      const maxVerbCount = String(this.model.selectedPathMaxVerbCount ?? "").trim();
      if (maxVerbCount === "") delete this.model.selectedPath.maxVerbCount;
      else this.model.selectedPath.maxVerbCount = Number(maxVerbCount);
      this.updateSelections();
      await this.writeSingleDataFile("scenarios.json", "Сохранено: scenarios.json");
    }
  },
  async mounted() {
    this.model.demoHandle = await this.api.restoreDemoHandle();
    await this.reload();
    this.restoreDeletionStackFromStorage();
  },
  template: `
    <div id="editor-app" class="flex h-screen min-h-0 flex-row flex-nowrap items-stretch bg-slate-950 text-slate-100 antialiased [color-scheme:dark]">
      <aside class="flex w-52 shrink-0 flex-col border-r border-slate-700 bg-slate-900 shadow-lg shadow-black/20">
        <div class="border-b border-slate-700 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">I Am Deepak</p>
          <h1 class="mt-1 text-lg font-semibold leading-tight text-white">Редактор контента</h1>
        </div>
        <div class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <button type="button" class="rounded-lg border-0 bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-none hover:bg-blue-500" @click="openDemoFolder">Открыть папку Demo</button>
          <button type="button" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!model.demoHandle" @click="save">Сохранить JSON</button>
          <a class="text-center text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline" href="#/game">Открыть демку</a>
          <nav class="flex flex-col gap-1 border-t border-slate-700 pt-4" role="tablist">
            <button type="button" role="tab" :aria-selected="model.tab === 'tokens'" :class="model.tab === 'tokens' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'tokens'">Токены</button>
            <button type="button" role="tab" :aria-selected="model.tab === 'tags'" :class="model.tab === 'tags' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'tags'">Теги</button>
            <button type="button" role="tab" :aria-selected="model.tab === 'characters'" :class="model.tab === 'characters' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'characters'">Персонажи</button>
            <button type="button" role="tab" :aria-selected="model.tab === 'dialogues'" :class="model.tab === 'dialogues' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'dialogues'">Диалоги</button>
            <button type="button" role="tab" :aria-selected="model.tab === 'branches'" :class="model.tab === 'branches' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'branches'">Ветки</button>
            <button type="button" role="tab" :aria-selected="model.tab === 'validation'" :class="model.tab === 'validation' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'" class="w-full rounded-lg border-0 px-3 py-2 text-left text-sm font-medium shadow-none ring-0" @click="model.tab = 'validation'; refreshValidation();">Проверка</button>
          </nav>
          <div class="mt-auto shrink-0 flex flex-col gap-2">
            <button type="button" class="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-700" @click="deletionModalOpen = true">
              Удалённые записи<span v-if="model.deletionUndoStack && model.deletionUndoStack.length" class="ml-1.5 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-300">{{ model.deletionUndoStack.length }}</span>
            </button>
            <div class="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-400">
              <p class="font-semibold text-slate-300">Статус</p>
              <p class="mt-1 break-words text-slate-400">{{ model.statusText }}</p>
            </div>
          </div>
        </div>
      </aside>
      <main class="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950">
        <header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Раздел</p>
            <p class="text-base font-semibold text-white">{{ model.tab }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="reload">Перезагрузить</button>
            <button type="button" class="rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="refreshValidation(); model.tab='validation'">Проверить связи</button>
          </div>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <section v-if="model.message" class="mb-4 rounded-lg border px-4 py-3 text-sm"
            :class="model.message.type === 'bad' ? 'border-red-700/70 bg-red-950/50 text-red-100' : model.message.type === 'warn' ? 'border-amber-700/60 bg-amber-950/40 text-amber-100' : 'border-emerald-700/60 bg-emerald-950/40 text-emerald-100'">
            {{ model.message.text }}
          </section>
          <component :key="model.tab" :is="currentComponent" :model="model" :roles="roles" :format-role="formatRole" :items="model.validationItems" @add-token="addToken" @save-token="saveToken" @delete-token="deleteToken" @select-token="selectToken" @add-tag="addTag" @save-tag="saveTag" @delete-tag="deleteTag" @select-tag="selectTag" @add-character="addCharacter" @save-character="saveCharacter" @delete-character="deleteCharacter" @select-character="(id) => { model.selectedCharacterId = id; updateSelections(); }" @add-scenario="addScenario" @select-scenario="selectScenario" @save-scenario="saveScenario" @open-scenario="openScenario" @delete-scenario="deleteScenario" @add-turn="addTurn" @select-turn="selectTurn" @save-turn="saveTurn" @delete-turn="deleteTurn" @add-keyword="addKeyword" @select-keyword="selectKeyword" @delete-keyword="deleteKeyword" @toggle-keyword-token="toggleKeywordToken" @select-branch-scenario="selectBranchScenario" @select-branch-turn="selectBranchTurn" @select-path="selectPath" @add-path="addPath" @delete-path="deletePath" @save-path="savePath" />
        </div>
      </main>
      <div
        v-if="deletionModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deletion-modal-title"
        @click.self="deletionModalOpen = false"
      >
        <div class="flex max-h-[min(80vh,560px)] w-full max-w-lg flex-col rounded-xl border border-slate-600 bg-slate-900 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <h2 id="deletion-modal-title" class="text-base font-semibold text-white">Удалённые записи</h2>
            <button type="button" class="rounded border-0 bg-slate-800 px-2 py-1 text-sm text-slate-300 hover:bg-slate-700" @click="deletionModalOpen = false">Закрыть</button>
          </div>
          <p class="border-b border-slate-700 px-4 py-2 text-xs leading-snug text-slate-400">Последние {{ deletionUndoMax }} удалений в браузере (после F5 не теряются). «Отменить» пишет JSON на диск при открытой папке Demo. Размер очереди — константа в начале App.js.</p>
          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <ul v-if="model.deletionUndoStack && model.deletionUndoStack.length" class="space-y-2">
              <li v-for="rec in model.deletionUndoStack" :key="rec.key" class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm">
                <span class="min-w-0 flex-1 text-slate-200">{{ rec.title }}</span>
                <button type="button" class="shrink-0 rounded-md bg-amber-700 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600" @click="undoDeletion(rec)">Отменить</button>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-500">Пока нет записей для отката.</p>
          </div>
        </div>
      </div>
    </div>
  `
  };
})();
