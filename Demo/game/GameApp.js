(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const snakeBestScoreKey = "deepakDemoSnakeBestScore";
  const riceBestScoreKey = "deepakDemoRiceBestScore";

  function getRandomMessageDelay() {
    return Math.floor(Math.random() * 5000);
  }

  function getTokensByIds(tokenById, ids) {
    return [...new Set(ids || [])].map((id) => tokenById.get(id)).filter(Boolean);
  }

  const commonTokenRefs = {
    hello: { role: "greeting", concepts: ["polite"] },
    hi: { role: "greeting", concepts: ["friendly"] },
    i: { role: "subject", concepts: [] },
    you: { role: "subject", concepts: [] },
    not: { role: "negation", concepts: ["negation"] },
    can: { role: "modal", concepts: ["can"] },
    please: { role: "polite", concepts: ["polite"] },
    thanks: { role: "closing", concepts: ["closing"] },
    first: { role: "intro", concepts: ["order"] },
    then: { role: "intro", concepts: ["order"] },
    if: { role: "connector", concepts: ["condition"] },
    and: { role: "connector", concepts: ["connector"] },
    but: { role: "connector", concepts: ["contrast"] },
    because: { role: "connector", concepts: ["because"] },
    comma: { role: "comma", concepts: ["punctuation"] },
    period: { role: "sentence_end", concepts: ["punctuation"] },
    question: { role: "sentence_end", concepts: ["punctuation"] }
  };

  function createContextToken(tokenById, tokenRef) {
    const token = tokenById.get(tokenRef.tokenId);
    if (!token) return null;
    return {
      ...token,
      role: tokenRef.role || "object",
      concepts: Array.isArray(tokenRef.concepts) ? tokenRef.concepts : []
    };
  }

  function getContextTokensByIds(tokenById, ids) {
    return getTokensByIds(tokenById, ids)
      .map((token) => createContextToken(tokenById, { tokenId: token.id, ...(commonTokenRefs[token.id] || { role: "object", concepts: [] }) }))
      .filter(Boolean);
  }

  function mergeContextToken(out, seen, token) {
    if (!token) return;
    const existing = seen.get(token.id);
    if (existing) {
      existing.concepts = [...new Set([...(existing.concepts || []), ...(token.concepts || [])])];
      if (!existing.role && token.role) existing.role = token.role;
      return;
    }
    seen.set(token.id, token);
    out.push(token);
  }

  function mergeKeywordTokens(tokenById, allTokens, keyword) {
    const explicit = (keyword.tokens || []).map((tokenRef) => createContextToken(tokenById, tokenRef)).filter(Boolean);
    const tagSet = new Set(keyword.tagIds || []);
    const fromTags =
      tagSet.size > 0
        ? allTokens
            .filter((token) => (token.tagIds || []).some((id) => tagSet.has(id)))
            .map((token) => createContextToken(tokenById, { tokenId: token.id, role: "object", concepts: [] }))
            .filter(Boolean)
        : [];
    const seen = new Map();
    const out = [];
    for (const token of explicit) {
      mergeContextToken(out, seen, token);
    }
    for (const token of fromTags) {
      mergeContextToken(out, seen, token);
    }
    return out;
  }

  function renderNote(note) {
    return `<li class="${note.type}">${note.text}</li>`;
  }

  function createSnakeState() {
    return {
      size: 18,
      cell: 16,
      score: 0,
      isOver: false,
      snake: [{ x: 8, y: 8 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      food: { x: 12, y: 12 }
    };
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function readBestScore(key) {
    return Number(window.localStorage?.getItem(key) || 0);
  }

  function writeBestScore(key, score) {
    window.localStorage?.setItem(key, String(score));
  }

  function createRiceGrain(level = 1) {
    return {
      x: 170,
      y: 8,
      type: Math.random() < 0.7 ? "good" : "bad",
      speed: Math.min(2.2 + level * 0.18, 7)
    };
  }

  root.GameApp = {
    data() {
      return {
        tokens: [],
        tokenById: new Map(),
        charactersById: new Map(),
        scenarios: [],
        audio: null,
        userAudio: null,
        musicStarted: false,
        musicUnlocked: false,
        answerSortable: null,
        tokenSortables: [],
        isMusicEnabled: true,
        isContentReady: false,
        isBiminiOpen: false,
        isSnakeOpen: false,
        isRiceOpen: false,
        isFlyOpen: false,
        isSettingsOpen: false,
        isResultOpen: false,
        demoDirectoryHandle: null,
        shiftStarted: false,
        conversations: [],
        activeConversationId: null,
        unreadBiminiTotal: 0,
        characterPickerId: "",
        scenarioPickerId: "",
        accessMessage: "",
        resultHtml: `<div class="empty-result">Собери ответ и нажми «Отправить».</div>`,
        snake: createSnakeState(),
        snakeBestScore: readBestScore(snakeBestScoreKey),
        snakeLoopId: null,
        riceGrain: createRiceGrain(),
        riceLevel: 1,
        riceMessage: "Хороший рис в левый мешок, плохой в правый.",
        riceScore: 0,
        riceBestScore: readBestScore(riceBestScoreKey),
        riceTimeLeft: 30,
        riceFinished: false,
        riceIsSorting: false,
        riceSortTarget: "",
        riceTimerId: null,
        riceLoopId: null,
        flyScore: 0,
        flyTimeLeft: 30,
        flyFinished: false,
        flyTimerId: null,
        flyLoopId: null,
        flyHit: null,
        flies: []
      };
    },
    computed: {
      currentTurn() {
        return this.activeConversationScenario?.turns?.[this.activeConversation?.turnIndex || 0] || { request: "", keywords: [], paths: [] };
      },
      currentCharacter() {
        return this.charactersById.get(this.activeConversationScenario?.characterId) || { name: "Ожидание диалога" };
      },
      musicLabel() {
        return this.isMusicEnabled ? "Выключить музыку" : "Включить музыку";
      },
      questionProgressLabel() {
        if (!this.activeConversation || !this.activeConversationScenario) return "—";
        return `${this.activeConversation.turnIndex + 1} из ${this.activeConversationScenario.turns.length}`;
      },
      scenarioOptions() {
        return this.scenarios
          .filter((scenario) => !this.characterPickerId || scenario.characterId === this.characterPickerId)
          .map((scenario) => ({
          id: scenario.id,
          title: scenario.title || scenario.id,
          character: this.getScenarioCharacter(scenario).name
        }));
      },
      characterOptions() {
        const ids = [...new Set(this.scenarios.map((scenario) => scenario.characterId).filter(Boolean))];
        return ids.map((id) => {
          const character = this.charactersById.get(id) || { name: id };
          return { id, name: character.name || id };
        });
      },
      tokenGroups() {
        const commonTokens = getContextTokensByIds(this.tokenById, ["hello", "hi", "i", "you", "not", "can", "please", "thanks"]);
        const connectorTokens = getContextTokensByIds(this.tokenById, ["first", "then", "if", "and", "but", "because"]);
        const punctuationTokens = getContextTokensByIds(this.tokenById, ["comma", "period", "question"]);
        const revealedKeywordIds = new Set(this.activeConversation?.revealedKeywordIds || []);
        const turns = this.activeConversationScenario?.turns || [];
        const visibleTurns = turns.slice(0, (this.activeConversation?.turnIndex || 0) + 1);
        const visibleKeywords = visibleTurns.flatMap((turn) => turn.keywords || []);
        const revealedKeywords = visibleKeywords
          .map((keyword, index) => ({ keyword, sourceClass: `source-${index % 6}` }))
          .filter(({ keyword }) => revealedKeywordIds.has(keyword.id));
        const contextSeen = new Set();
        const contextTokens = [];
        revealedKeywords.forEach(({ keyword, sourceClass }) => {
          mergeKeywordTokens(this.tokenById, this.tokens, keyword).forEach((token) => {
            if (contextSeen.has(token.id)) return;
            contextSeen.add(token.id);
            contextTokens.push({ ...token, sourceClass, sourceLabel: keyword.text || keyword.id });
          });
        });
        const groups = [
          ["Общие", commonTokens],
          ["Связки", connectorTokens],
          ["Знаки", punctuationTokens],
          ["Контекст", contextTokens]
        ].filter(([, tokens]) => tokens.length > 0);
        return groups.map(([title, tokens]) => ({ title, tokens }));
      },
      contextTokens() {
        const coreGroupTitles = new Set(["Общие", "Связки", "Знаки"]);
        const seen = new Map();
        const out = [];
        this.tokenGroups
          .filter((group) => !coreGroupTitles.has(group.title))
          .flatMap((group) => group.tokens)
          .forEach((token) => mergeContextToken(out, seen, token));
        return out;
      },
      highlightedTokenIds() {
        const ids = new Set();
        (this.activeConversation?.answer || []).forEach((token) => ids.add(token.id));
        return ids;
      },
      activeConversation() {
        return this.conversations.find((item) => item.id === this.activeConversationId) || null;
      },
      activeConversationScenario() {
        return this.scenarios.find((scenario) => scenario.id === this.activeConversation?.scenarioId) || null;
      },
      isWaitingForUser() {
        return Boolean(this.activeConversation?.isWaitingForUser);
      }
    },
    watch: {
      isContentReady() {
        this.$nextTick(this.initSortables);
      },
      tokenGroups: {
        deep: true,
        handler() {
          this.$nextTick(this.initTokenSortables);
        }
      }
    },
    methods: {
      async init() {
        this.isMusicEnabled = localStorage.getItem(root.audio.musicEnabledStorageKey) !== "false";
        const isFileProtocol = window.location.protocol === "file:";
        if (!isFileProtocol) {
          try {
            const content = await root.contentService.loadContentFromFetch();
            this.applyContent(content);
            return;
          } catch (_error) {}
        }

        try {
          const handle = await root.storage.getStoredDemoDirectoryHandle();
          this.demoDirectoryHandle = handle;
          if (handle && await root.storage.ensureDemoFolderPermission(handle, "read")) {
            const content = await root.contentService.loadContentFromDirectory(handle);
            this.applyContent(content);
            return;
          }
        } catch (_error) {}

        this.accessMessage = "Выбери папку Demo один раз, чтобы демка читала JSON-файлы из data без сервера.";
        this.resultHtml = `<div class="result-card"><p class="score warn">Нужен доступ</p><p>${this.accessMessage}</p></div>`;
      },
      applyContent(content) {
        this.tokens = content.tokensData.tokens;
        this.tokenById = new Map(this.tokens.map((token) => [token.id, token]));
        this.charactersById = new Map(content.charactersData.characters.map((character) => [character.id, character]));
        this.scenarios = content.scenariosData.scenarios;
        this.isContentReady = true;
        this.conversations = [];
        this.activeConversationId = null;
        this.unreadBiminiTotal = 0;
        this.characterPickerId = this.scenarios[0]?.characterId || "";
        this.scenarioPickerId = this.scenarios[0]?.id || "";
        this.$nextTick(this.initSortables);
        this.$nextTick(this.openScenarioFromHash);
      },
      getRandomScenario() {
        return this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
      },
      async chooseDemoDirectoryAndLoad() {
        if (!window.showDirectoryPicker) {
          this.resultHtml = `<div class="result-card"><p class="score warn">Нужен доступ</p><p>Браузер не поддерживает доступ к папке. Открой демку в Chrome или Edge.</p></div>`;
          return;
        }
        try {
          const handle = this.demoDirectoryHandle || await window.showDirectoryPicker({ mode: "read", startIn: "desktop" });
          if (!await root.storage.ensureDemoFolderPermission(handle, "read")) {
            this.resultHtml = `<div class="result-card"><p class="score warn">Нужен доступ</p><p>Нет разрешения на чтение папки Demo.</p></div>`;
            return;
          }
          const content = await root.contentService.loadContentFromDirectory(handle);
          await root.storage.saveDemoDirectoryHandle(handle);
          this.demoDirectoryHandle = handle;
          this.applyContent(content);
        } catch (error) {
          if (error.name !== "AbortError") {
            this.resultHtml = `<div class="result-card"><p class="score warn">Нужен доступ</p><p>Не удалось прочитать JSON-файлы из Demo/data.</p></div>`;
          }
        }
      },
      getScenarioCharacter(scenario) {
        return this.charactersById.get(scenario?.characterId) || { name: `Unknown character: ${scenario?.characterId || ""}` };
      },
      async openBiminiApp() {
        if (!this.isContentReady) {
          await this.chooseDemoDirectoryAndLoad();
          if (!this.isContentReady) return;
        }
        this.isBiminiOpen = true;
        if (!this.activeConversationId && this.conversations[0]) this.activeConversationId = this.conversations[0].id;
        this.resetUnreadCounter();
        this.$nextTick(this.initSortables);
        if (!this.shiftStarted) this.startShift();
      },
      closeBiminiApp() {
        this.isBiminiOpen = false;
      },
      openEditorApp() {
        window.location.hash = "#/editor";
      },
      openSettings() {
        this.isSettingsOpen = true;
      },
      closeSettings() {
        this.isSettingsOpen = false;
      },
      startShift() {
        if (!this.isContentReady || this.shiftStarted) return;
        this.shiftStarted = true;
        this.musicUnlocked = true;
        root.audio.startMusic(this);
      },
      toggleMusic() {
        root.audio.toggleBackgroundMusic(this);
      },
      addToken(tokenId, insertIndex = null) {
        if (!this.activeConversation) return;
        const visibleTokens = this.tokenGroups.flatMap((group) => group.tokens);
        const token = [...visibleTokens].reverse().find((item) => item.id === tokenId);
        if (!token) return;
        if (insertIndex === null) this.activeConversation.answer.push(token);
        else this.activeConversation.answer.splice(insertIndex, 0, token);
        this.$nextTick(this.initAnswerSortable);
      },
      removeAnswerToken(index) {
        if (!this.activeConversation) return;
        this.activeConversation.answer.splice(index, 1);
        this.$nextTick(this.initAnswerSortable);
      },
      clearAnswer() {
        if (!this.activeConversation) return;
        this.activeConversation.answer = [];
        this.resultHtml = `<div class="empty-result">Собери ответ и нажми «Отправить».</div>`;
        this.isResultOpen = false;
        this.$nextTick(this.initAnswerSortable);
      },
      pushUserMessage(conversationId, text, delay = getRandomMessageDelay()) {
        const conversation = this.conversations.find((item) => item.id === conversationId);
        if (!conversation) return;
        const turnIndex = conversation.turnIndex;
        conversation.isWaitingForUser = true;
        window.setTimeout(() => {
          const nextConversation = this.conversations.find((item) => item.id === conversationId);
          if (!nextConversation) return;
          const scenario = this.scenarios.find((item) => item.id === nextConversation.scenarioId);
          const speaker = this.getScenarioCharacter(scenario).name;
          nextConversation.chatHistory.push({ speaker, text, kind: "user", turnIndex });
          nextConversation.isWaitingForUser = false;
          if (!this.isBiminiOpen || this.activeConversationId !== conversationId) {
            nextConversation.unread += 1;
            this.unreadBiminiTotal += 1;
          }
          root.audio.playUserMessageSound(this);
        }, delay);
      },
      evaluateAnswer() {
        if (!this.activeConversation || this.activeConversation.isWaitingForUser) return;
        if (this.activeConversation.answer.length === 0) {
          this.resultHtml = `<div class="result-card"><p class="score bad">0%</p><p>Дипак молчит. Пользователь злится.</p></div>`;
          this.isResultOpen = true;
          return;
        }
        const features = root.scoring.collectFeatures(this.activeConversation.answer);
        const formResult = root.scoring.evaluateForm(this.activeConversation.answer, features);
        const pathResult = root.scoring.detectBestPath(features, this.currentTurn.paths, formResult);
        const score = root.scoring.calculateFinalScore(pathResult, formResult);
        const tone = score >= 80 ? "good" : score >= 50 ? "warn" : "bad";
        const answerText = this.activeConversation.answer.map((token) => token.text).join(" ");
        this.resultHtml = `
          <div class="result-card">
            <p class="score ${tone}">${score}%</p>
            <p class="path">Путь: ${pathResult.path?.title || "мусорный ответ"}</p>
            <p>${pathResult.path?.reaction || "Пользователь не понял ответ."}</p>
            ${pathResult.path?.delayedConsequence ? `<p class="warn">${pathResult.path.delayedConsequence}</p>` : ""}
            <ul class="result-list">${pathResult.notes.map(renderNote).join("")}${formResult.notes.map(renderNote).join("")}</ul>
          </div>
        `;
        this.isResultOpen = true;
        const reaction = this.advanceDialogue(pathResult, answerText);
        if (reaction) this.pushUserMessage(this.activeConversation.id, reaction, getRandomMessageDelay());
      },
      advanceDialogue(pathResult, answerText) {
        if (!this.activeConversation) return "";
        const reaction = pathResult.path?.reaction || "Пользователь не понял ответ.";
        const nextTurn = this.activeConversationScenario?.turns?.[this.activeConversation.turnIndex + 1];
        this.activeConversation.chatHistory.push({ speaker: "Bemini", text: answerText, kind: "deepak" });
        if (nextTurn) {
          this.activeConversation.turnIndex += 1;
        }
        this.activeConversation.answer = [];
        return reaction;
      },
      getScenarioIdFromHash() {
        const hash = window.location.hash || "";
        const queryIndex = hash.indexOf("?");
        if (queryIndex < 0) return "";
        return new URLSearchParams(hash.slice(queryIndex + 1)).get("scenario") || "";
      },
      openScenarioFromHash() {
        const scenarioId = this.getScenarioIdFromHash();
        if (!scenarioId || !this.isContentReady) return;
        this.isBiminiOpen = true;
        this.startScenarioConversation(scenarioId);
        if (!this.shiftStarted) this.startShift();
      },
      selectScenarioCharacter() {
        const firstScenario = this.scenarioOptions[0];
        this.scenarioPickerId = firstScenario?.id || "";
      },
      startSelectedScenario() {
        this.startScenarioConversation(this.scenarioPickerId);
      },
      startScenarioConversation(scenarioId) {
        const conversation = this.createConversation(scenarioId);
        if (!conversation) {
          this.resultHtml = `<div class="result-card"><p class="score warn">Сценарий не найден.</p><p>Выбери другой сценарий для проверки.</p></div>`;
          this.isResultOpen = true;
          return null;
        }
        this.activeConversationId = conversation.id;
        this.scenarioPickerId = conversation.scenarioId;
        const scenario = this.scenarios.find((item) => item.id === conversation.scenarioId);
        this.characterPickerId = scenario?.characterId || "";
        const firstTurn = scenario?.turns?.[0];
        if (firstTurn?.request) this.pushUserMessage(conversation.id, firstTurn.request, 350);
        return conversation;
      },
      createConversation(scenarioId = "") {
        const scenario = scenarioId
          ? this.scenarios.find((item) => item.id === scenarioId)
          : this.getRandomScenario();
        if (!scenario) return null;
        const id = `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const conversation = {
          id,
          scenarioId: scenario.id,
          turnIndex: 0,
          chatHistory: [],
          revealedKeywordIds: [],
          answer: [],
          isWaitingForUser: false,
          unread: 0
        };
        this.conversations.push(conversation);
        if (!this.activeConversationId) this.activeConversationId = conversation.id;
        this.$nextTick(this.initSortables);
        return conversation;
      },
      selectConversation(conversationId) {
        this.activeConversationId = conversationId;
        const conversation = this.conversations.find((item) => item.id === conversationId);
        if (conversation && conversation.unread > 0) {
          this.unreadBiminiTotal = Math.max(0, this.unreadBiminiTotal - conversation.unread);
          conversation.unread = 0;
        }
        this.$nextTick(this.initSortables);
      },
      revealKeyword(keywordId) {
        if (!this.activeConversation || !keywordId) return;
        if (!this.activeConversation.revealedKeywordIds.includes(keywordId)) {
          this.activeConversation.revealedKeywordIds.push(keywordId);
          this.$nextTick(this.initTokenSortables);
        }
      },
      getMessageParts(message) {
        if (message.kind !== "user" || message.turnIndex !== this.activeConversation?.turnIndex) return [{ text: message.text }];
        const lowerText = message.text.toLowerCase();
        const matches = (this.currentTurn.keywords || [])
          .map((keyword) => {
            const text = String(keyword.text || "");
            const index = text ? lowerText.indexOf(text.toLowerCase()) : -1;
            return index >= 0 ? { keyword, index, end: index + text.length } : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.index - b.index);
        const parts = [];
        let cursor = 0;
        matches.forEach((match) => {
          if (match.index < cursor) return;
          if (match.index > cursor) parts.push({ text: message.text.slice(cursor, match.index) });
          parts.push({ text: message.text.slice(match.index, match.end), keyword: match.keyword });
          cursor = match.end;
        });
        if (cursor < message.text.length) parts.push({ text: message.text.slice(cursor) });
        return parts.length > 0 ? parts : [{ text: message.text }];
      },
      resetUnreadCounter() {
        this.unreadBiminiTotal = 0;
        this.conversations.forEach((conversation) => { conversation.unread = 0; });
      },
      getKeywordSourceClass(keyword) {
        const turns = this.activeConversationScenario?.turns || [];
        const visibleTurns = turns.slice(0, (this.activeConversation?.turnIndex || 0) + 1);
        const visibleKeywords = visibleTurns.flatMap((turn) => turn.keywords || []);
        const index = visibleKeywords.findIndex((item) => item.id === keyword?.id);
        return `source-${Math.max(0, index) % 6}`;
      },
      initSortables() {
        this.initAnswerSortable();
        this.initTokenSortables();
      },
      initAnswerSortable() {
        if (!window.Sortable || !this.$refs.answerLine || !this.activeConversation) return;
        this.answerSortable?.destroy();
        this.answerSortable = new Sortable(this.$refs.answerLine, {
          animation: 120,
          group: { name: "tokens", pull: false, put: true },
          draggable: ".answer-token",
          ghostClass: "sortable-ghost",
          chosenClass: "sortable-chosen",
          dragClass: "sortable-drag",
          onAdd: (event) => {
            const tokenId = event.item.dataset.tokenId;
            event.item.remove();
            this.addToken(tokenId, event.newIndex);
          },
          onEnd: (event) => {
            if (event.from !== this.$refs.answerLine || event.to !== this.$refs.answerLine) return;
            if (event.oldIndex === event.newIndex) return;
            const [token] = this.activeConversation.answer.splice(event.oldIndex, 1);
            this.activeConversation.answer.splice(event.newIndex, 0, token);
          }
        });
      },
      initTokenSortables() {
        if (!window.Sortable || !this.$refs.tokenGroups) return;
        this.tokenSortables.forEach((sortable) => sortable.destroy());
        this.tokenSortables = [];
        this.$refs.tokenGroups.querySelectorAll(".token-list").forEach((listElement) => {
          this.tokenSortables.push(new Sortable(listElement, {
            animation: 120,
            sort: false,
            group: { name: "tokens", pull: "clone", put: false },
            draggable: ".token-button",
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            dragClass: "sortable-drag"
          }));
        });
      },
      openSnakeGame() {
        this.isSnakeOpen = true;
        this.$nextTick(this.startSnakeGame);
      },
      closeSnakeGame() {
        this.isSnakeOpen = false;
        if (this.snakeLoopId) window.clearInterval(this.snakeLoopId);
        this.snakeLoopId = null;
      },
      startSnakeGame() {
        this.snake = createSnakeState();
        this.spawnSnakeFood();
        if (this.snakeLoopId) window.clearInterval(this.snakeLoopId);
        this.snakeLoopId = window.setInterval(() => {
          this.stepSnake();
          this.drawSnake();
        }, 130);
        this.drawSnake();
      },
      spawnSnakeFood() {
        const occupied = new Set(this.snake.snake.map((p) => `${p.x}:${p.y}`));
        let x = randomInt(0, this.snake.size - 1);
        let y = randomInt(0, this.snake.size - 1);
        while (occupied.has(`${x}:${y}`)) {
          x = randomInt(0, this.snake.size - 1);
          y = randomInt(0, this.snake.size - 1);
        }
        this.snake.food = { x, y };
      },
      handleSnakeKeydown(event) {
        if (!this.isSnakeOpen || this.snake.isOver) return;
        const key = event.key.toLowerCase();
        const dirs = {
          arrowup: { x: 0, y: -1 },
          w: { x: 0, y: -1 },
          arrowdown: { x: 0, y: 1 },
          s: { x: 0, y: 1 },
          arrowleft: { x: -1, y: 0 },
          a: { x: -1, y: 0 },
          arrowright: { x: 1, y: 0 },
          d: { x: 1, y: 0 }
        };
        const next = dirs[key];
        if (!next) return;
        if (next.x === -this.snake.direction.x && next.y === -this.snake.direction.y) return;
        this.snake.nextDirection = next;
      },
      stepSnake() {
        if (this.snake.isOver) return;
        this.snake.direction = this.snake.nextDirection;
        const head = this.snake.snake[0];
        const nextHead = {
          x: head.x + this.snake.direction.x,
          y: head.y + this.snake.direction.y
        };
        if (
          nextHead.x < 0 ||
          nextHead.y < 0 ||
          nextHead.x >= this.snake.size ||
          nextHead.y >= this.snake.size ||
          this.snake.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
        ) {
          this.snake.isOver = true;
          return;
        }
        this.snake.snake.unshift(nextHead);
        if (nextHead.x === this.snake.food.x && nextHead.y === this.snake.food.y) {
          this.snake.score += 1;
          this.saveSnakeBestScore();
          this.spawnSnakeFood();
        } else {
          this.snake.snake.pop();
        }
      },
      saveSnakeBestScore() {
        if (this.snake.score <= this.snakeBestScore) return;
        this.snakeBestScore = this.snake.score;
        writeBestScore(snakeBestScoreKey, this.snakeBestScore);
      },
      drawSnake() {
        const canvas = this.$refs.snakeCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const sizePx = this.snake.size * this.snake.cell;
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, sizePx, sizePx);
        ctx.strokeStyle = "#1d1d1d";
        ctx.lineWidth = 1;
        for (let line = 0; line <= this.snake.size; line += 1) {
          const pos = line * this.snake.cell + 0.5;
          ctx.beginPath();
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos, sizePx);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, pos);
          ctx.lineTo(sizePx, pos);
          ctx.stroke();
        }
        const foodX = this.snake.food.x * this.snake.cell;
        const foodY = this.snake.food.y * this.snake.cell;
        ctx.fillStyle = "#ff2f2f";
        ctx.fillRect(foodX + 3, foodY + 3, this.snake.cell - 6, this.snake.cell - 6);
        ctx.fillStyle = "#7f0000";
        ctx.fillRect(foodX + 6, foodY + 1, 4, 3);
        this.snake.snake.forEach((part, index) => {
          const x = part.x * this.snake.cell;
          const y = part.y * this.snake.cell;
          ctx.fillStyle = index === 0 ? "#73ff73" : "#00c800";
          ctx.fillRect(x + 2, y + 2, this.snake.cell - 4, this.snake.cell - 4);
          ctx.fillStyle = "#007f00";
          ctx.fillRect(x + 2, y + this.snake.cell - 5, this.snake.cell - 4, 3);
          if (index === 0) {
            ctx.fillStyle = "#000";
            ctx.fillRect(x + 5, y + 5, 2, 2);
            ctx.fillRect(x + 10, y + 5, 2, 2);
          }
        });
        if (this.snake.isOver) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(0, 0, sizePx, sizePx);
          ctx.fillStyle = "#fff";
          ctx.font = "16px 'Pixelated MS Sans Serif', Arial";
          ctx.fillText("GAME OVER", 92, 140);
        }
      },
      openRiceGame() {
        this.isRiceOpen = true;
        this.startRiceGame();
      },
      closeRiceGame() {
        this.isRiceOpen = false;
        if (this.riceTimerId) window.clearInterval(this.riceTimerId);
        if (this.riceLoopId) window.clearInterval(this.riceLoopId);
        this.riceTimerId = null;
        this.riceLoopId = null;
      },
      startRiceGame() {
        if (this.riceTimerId) window.clearInterval(this.riceTimerId);
        if (this.riceLoopId) window.clearInterval(this.riceLoopId);
        this.riceScore = 0;
        this.riceTimeLeft = 30;
        this.riceLevel = 1;
        this.riceMessage = "Хороший рис в левый мешок, плохой в правый.";
        this.riceGrain = createRiceGrain(this.riceLevel);
        this.riceFinished = false;
        this.riceIsSorting = false;
        this.riceSortTarget = "";
        this.riceTimerId = window.setInterval(() => {
          this.riceTimeLeft -= 1;
          if (this.riceTimeLeft <= 0) {
            this.riceTimeLeft = 0;
            this.finishRiceGame("Время вышло.");
          }
        }, 1000);
        this.riceLoopId = window.setInterval(() => this.stepRiceGame(), 40);
      },
      handleRiceKeydown(event) {
        if (!this.isRiceOpen || this.riceFinished) return;
        const key = event.key.toLowerCase();
        if (!["arrowleft", "a", "arrowright", "d"].includes(key)) return;
        event.preventDefault();
        this.sortRiceGrain(key === "arrowleft" || key === "a" ? "good" : "bad");
      },
      sortRiceGrain(target) {
        if (this.riceFinished || this.riceIsSorting) return;
        if (target !== this.riceGrain.type) {
          this.finishRiceGame("Мешок перепутан.");
          return;
        }
        this.riceScore += 1;
        this.saveRiceBestScore();
        this.riceIsSorting = true;
        this.riceSortTarget = target;
        this.riceMessage = target === "good" ? "В левый мешок." : "В правый мешок.";
        this.riceLevel += 1;
        window.setTimeout(() => {
          if (this.riceFinished) return;
          this.riceGrain = createRiceGrain(this.riceLevel);
          this.riceIsSorting = false;
          this.riceSortTarget = "";
          this.riceMessage = "Следующая рисинка быстрее.";
        }, 180);
      },
      saveRiceBestScore() {
        if (this.riceScore <= this.riceBestScore) return;
        this.riceBestScore = this.riceScore;
        writeBestScore(riceBestScoreKey, this.riceBestScore);
      },
      finishRiceGame(message) {
        if (this.riceFinished) return;
        this.riceFinished = true;
        this.riceIsSorting = false;
        this.riceSortTarget = "";
        this.riceMessage = message;
        if (this.riceTimerId) window.clearInterval(this.riceTimerId);
        if (this.riceLoopId) window.clearInterval(this.riceLoopId);
        this.riceTimerId = null;
        this.riceLoopId = null;
      },
      stepRiceGame() {
        if (this.riceFinished || this.riceIsSorting) return;
        this.riceGrain.y += this.riceGrain.speed;
        if (this.riceGrain.y >= 164) this.finishRiceGame("Рис упал мимо.");
      },
      openFlyGame() {
        this.isFlyOpen = true;
        this.$nextTick(this.startFlyGame);
      },
      closeFlyGame() {
        this.isFlyOpen = false;
        if (this.flyTimerId) window.clearInterval(this.flyTimerId);
        if (this.flyLoopId) window.clearInterval(this.flyLoopId);
        this.flyTimerId = null;
        this.flyLoopId = null;
      },
      startFlyGame() {
        if (this.flyTimerId) window.clearInterval(this.flyTimerId);
        if (this.flyLoopId) window.clearInterval(this.flyLoopId);
        this.flyScore = 0;
        this.flyTimeLeft = 30;
        this.flyFinished = false;
        this.flyHit = null;
        this.flies = Array.from({ length: 8 }, () => ({
          x: randomInt(20, 300),
          y: randomInt(20, 180),
          vx: (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 3),
          vy: (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 3),
          r: randomInt(7, 10)
        }));
        this.flyTimerId = window.setInterval(() => {
          this.flyTimeLeft -= 1;
          if (this.flyTimeLeft <= 0) {
            this.flyTimeLeft = 0;
            this.flyFinished = true;
            window.clearInterval(this.flyTimerId);
            window.clearInterval(this.flyLoopId);
            this.flyTimerId = null;
            this.flyLoopId = null;
            this.drawFlyGame();
          }
        }, 1000);
        this.flyLoopId = window.setInterval(() => {
          this.stepFlyGame();
          this.drawFlyGame();
        }, 50);
        this.drawFlyGame();
      },
      stepFlyGame() {
        const width = 320;
        const height = 220;
        this.flies.forEach((fly) => {
          fly.x += fly.vx;
          fly.y += fly.vy;
          if (fly.x < fly.r || fly.x > width - fly.r) fly.vx *= -1;
          if (fly.y < fly.r || fly.y > height - fly.r) fly.vy *= -1;
        });
      },
      drawFlyGame() {
        const canvas = this.$refs.flyCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#d7f6ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.flies.forEach((fly) => {
          this.drawPixelFly(ctx, fly);
        });
        if (this.flyHit) this.drawFlySwat(ctx, this.flyHit);
        if (this.flyFinished) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#fff";
          ctx.font = "18px Arial";
          ctx.fillText("Время вышло", 100, 110);
        }
      },
      drawPixelFly(ctx, fly) {
        const x = Math.round(fly.x);
        const y = Math.round(fly.y);
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(x - 8, y - 5, 6, 4);
        ctx.fillRect(x + 2, y - 5, 6, 4);
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 5, y - 3, 10, 8);
        ctx.fillRect(x - 8, y, 3, 3);
        ctx.fillRect(x + 5, y, 3, 3);
        ctx.fillRect(x - 2, y - 6, 4, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 1, y - 5, 1, 1);
        ctx.fillRect(x + 2, y - 5, 1, 1);
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 10, y + 6, 4, 1);
        ctx.fillRect(x + 6, y + 6, 4, 1);
      },
      drawFlySwat(ctx, hit) {
        ctx.strokeStyle = "#7f4f1f";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hit.x + 16, hit.y + 18);
        ctx.lineTo(hit.x + 46, hit.y + 48);
        ctx.stroke();
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(hit.x - 16, hit.y - 16, 28, 28);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        for (let offset = -12; offset <= 8; offset += 5) {
          ctx.beginPath();
          ctx.moveTo(hit.x + offset, hit.y - 16);
          ctx.lineTo(hit.x + offset, hit.y + 12);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(hit.x - 16, hit.y + offset);
          ctx.lineTo(hit.x + 12, hit.y + offset);
          ctx.stroke();
        }
      },
      swatFly(event) {
        if (this.flyFinished) return;
        const canvas = this.$refs.flyCanvas;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hitIndex = this.flies.findIndex((fly) => ((fly.x - x) ** 2 + (fly.y - y) ** 2) <= (fly.r + 5) ** 2);
        if (hitIndex === -1) return;
        this.flyScore += 1;
        this.flyHit = { x, y };
        this.flies[hitIndex] = {
          x: randomInt(20, 300),
          y: randomInt(20, 180),
          vx: (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 3),
          vy: (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 3),
          r: randomInt(7, 10)
        };
        this.drawFlyGame();
        window.setTimeout(() => {
          this.flyHit = null;
          this.drawFlyGame();
        }, 120);
      }
    },
    mounted() {
      this.init();
      window.addEventListener("keydown", this.handleSnakeKeydown);
      window.addEventListener("keydown", this.handleRiceKeydown);
      window.addEventListener("hashchange", this.openScenarioFromHash);
    },
    unmounted() {
      this.answerSortable?.destroy();
      this.tokenSortables.forEach((sortable) => sortable.destroy());
      if (this.snakeLoopId) window.clearInterval(this.snakeLoopId);
      if (this.riceTimerId) window.clearInterval(this.riceTimerId);
      if (this.riceLoopId) window.clearInterval(this.riceLoopId);
      if (this.flyTimerId) window.clearInterval(this.flyTimerId);
      if (this.flyLoopId) window.clearInterval(this.flyLoopId);
      window.removeEventListener("keydown", this.handleSnakeKeydown);
      window.removeEventListener("keydown", this.handleRiceKeydown);
      window.removeEventListener("hashchange", this.openScenarioFromHash);
    },
    template: `
      <div class="game-root">
        <div class="desktop">
          <div class="desktop-icons">
            <button type="button" class="desktop-icon desktop-icon-bemini" @click="openBiminiApp">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Bemini</span>
              <span v-if="unreadBiminiTotal > 0" class="desktop-icon-badge">{{ unreadBiminiTotal }}</span>
            </button>
            <button type="button" class="desktop-icon desktop-icon-editor" @click="openEditorApp">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Editor</span>
            </button>
            <button type="button" class="desktop-icon desktop-icon-snake" @click="openSnakeGame">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Snake</span>
            </button>
            <button type="button" class="desktop-icon desktop-icon-rice" @click="openRiceGame">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Rice Sort</span>
            </button>
            <button type="button" class="desktop-icon desktop-icon-fly" @click="openFlyGame">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Fly Swat</span>
            </button>
            <button type="button" class="desktop-icon desktop-icon-settings" @click="openSettings">
              <span class="desktop-icon-glyph" aria-hidden="true"></span>
              <span class="desktop-icon-label">Settings</span>
            </button>
          </div>
        </div>

        <main v-if="isBiminiOpen" class="monitor-shell window">
          <div class="title-bar">
            <div class="title-bar-text">Booble Bemini</div>
            <div class="title-bar-controls">
              <button aria-label="Help"></button>
              <button aria-label="Close" @click="closeBiminiApp"></button>
            </div>
          </div>
          <div class="window-body">
     <!--       <header class="topbar">
              <h1>Рабочий монитор Дипака</h1>
            </header>-->

            <menu role="tablist" class="conversation-tabs">
              <li v-if="conversations.length === 0" role="tab" aria-selected="true">
                <button type="button">Проверка сценария</button>
              </li>
              <li
                v-for="conversation in conversations"
                :key="conversation.id"
                role="tab"
                :aria-selected="activeConversationId === conversation.id"
              >
                <button type="button" @click="selectConversation(conversation.id)">
                  {{ getScenarioCharacter(scenarios.find((item) => item.id === conversation.scenarioId)).name }}
                  <span v-if="conversation.unread > 0" class="tab-badge">{{ conversation.unread }}</span>
                </button>
              </li>
            </menu>

            <section class="layout">
              <section class="workspace-row">
                <section class="panel chat-panel window">
                  <div class="title-bar inactive">
                    <div class="title-bar-text">Чат Bemini</div>
                  </div>
                  <div class="window-body">
                    <div class="chat-card">
                      <div class="chat-history">
                        <div v-if="!activeConversation" class="empty-result">Выбери сценарий в панели помощи.</div>
                        <div v-for="(message, index) in (activeConversation?.chatHistory || [])" :key="index" class="message" :class="message.kind === 'deepak' ? 'message-deepak' : 'message-user'">
                          <span class="message-meta">{{ message.speaker }}</span>
                          <template v-for="(part, partIndex) in getMessageParts(message)" :key="partIndex">
                            <button
                              v-if="part.keyword"
                              type="button"
                              class="keyword-chip"
                              :class="[getKeywordSourceClass(part.keyword), { active: activeConversation?.revealedKeywordIds.includes(part.keyword.id) }]"
                              @click="revealKeyword(part.keyword.id)"
                            >
                              {{ part.text }}
                            </button>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </div>
                      </div>
                    </div>

                    <div class="answer-box">
                      <div class="answer-title">Строка ответа</div>
                      <div class="answer-line field-border" ref="answerLine">
                        <span v-if="!activeConversation || activeConversation.answer.length === 0" class="empty-result"></span>
                        <span
                          v-for="(token, index) in (activeConversation?.answer || [])"
                          :key="token.id + '-' + index"
                          class="answer-token"
                          :class="'role-' + token.role"
                          :data-answer-index="index"
                          @dblclick="removeAnswerToken(index)"
                        >
                          {{ token.text }}
                        </span>
                      </div>
                      <div class="answer-actions answer-footer">
                        <button type="button" :disabled="!activeConversation" @click="clearAnswer">Очистить</button>
                        <button type="button" class="default" :disabled="!activeConversation || isWaitingForUser" @click="evaluateAnswer">Отправить</button>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="panel helper-panel window">
                  <div class="title-bar inactive">
                    <div class="title-bar-text">Помощь</div>
                  </div>
                  <div class="window-body">
                    <div class="help-grid">
                      <div class="help-row"><span>Bemini</span><strong>v1.3</strong></div>
                      <div class="help-row"><span>Вопрос</span><strong>{{ questionProgressLabel }}</strong></div>
                      <div class="help-row"><span>Таймер</span><strong>--</strong></div>
                      <div class="help-row"><span>Автоотправка</span><strong>--</strong></div>
                      <div class="help-row"><span>Контекст</span><strong>{{ contextTokens.length }} ток.</strong></div>
                    </div>
                    <details class="help-section" open>
                      <summary>Правила</summary>
                      <p>Отвечай как Bemini. Следи за формой ответа и запрещёнными токенами.</p>
                    </details>
                    <details class="help-section" open>
                      <summary>Профиль</summary>
                      <p>{{ currentCharacter.name }}</p>
                    </details>
                    <button type="button" class="default result-toggle" @click="isResultOpen = !isResultOpen">Разбор</button>
                    <section class="scenario-picker">
                      <p class="scenario-picker-title">Сценарий</p>
                      <label>
                        Персонаж
                        <select v-model="characterPickerId" @change="selectScenarioCharacter">
                          <option v-for="character in characterOptions" :key="character.id" :value="character.id">
                            {{ character.name }}
                          </option>
                        </select>
                      </label>
                      <label>
                        Сценарий
                      <select v-model="scenarioPickerId">
                        <option v-for="scenario in scenarioOptions" :key="scenario.id" :value="scenario.id">
                          {{ scenario.title }}
                        </option>
                      </select>
                      </label>
                      <button type="button" class="default" :disabled="!scenarioPickerId" @click="startSelectedScenario">Открыть сценарий</button>
                    </section>
                  </div>
                </section>
              </section>

              <section class="panel tokens-panel window">
                <div class="title-bar inactive">
                  <div class="title-bar-text">Облако токенов</div>
                </div>
                <div class="window-body">
                  <div class="token-groups" ref="tokenGroups">
                    <div v-for="group in tokenGroups" :key="group.title" class="token-group">
                      <h3>{{ group.title }} <span v-if="group.title === 'Контекст'">{{ group.tokens.length }} ток.</span></h3>
                      <div class="token-list">
                        <button
                          v-for="token in group.tokens"
                          :key="token.id"
                          type="button"
                          class="token-button"
                          :class="['role-' + token.role, token.sourceClass, { 'token-highlighted': highlightedTokenIds.has(token.id) }]"
                          draggable="true"
                          :data-token-id="token.id"
                          :title="token.sourceLabel ? 'Источник: ' + token.sourceLabel : ''"
                          @click="addToken(token.id)"
                        >
                          {{ token.text }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section v-if="isResultOpen" class="panel result-panel result-popover window">
                <div class="title-bar">
                  <div class="title-bar-text">Разбор ответа</div>
                  <div class="title-bar-controls">
                    <button aria-label="Close" @click="isResultOpen = false"></button>
                  </div>
                </div>
                <div class="window-body" v-html="resultHtml"></div>
              </section>
            </section>
          </div>
        </main>

        <section v-if="isSnakeOpen" class="mini-window window snake-window">
          <div class="title-bar">
            <div class="title-bar-text">Snake</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="closeSnakeGame"></button>
            </div>
          </div>
          <div class="window-body">
            <p class="mini-meta">Счёт: {{ snake.score }} | Рекорд: {{ snakeBestScore }} | WASD или стрелки</p>
            <canvas ref="snakeCanvas" class="mini-canvas" width="288" height="288"></canvas>
            <div class="mini-actions">
              <button type="button" @click="startSnakeGame">Новая игра</button>
            </div>
          </div>
        </section>

        <section v-if="isRiceOpen" class="mini-window window rice-window">
          <div class="title-bar">
            <div class="title-bar-text">Переборка риса</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="closeRiceGame"></button>
            </div>
          </div>
          <div class="window-body">
            <p class="mini-meta">Очки: {{ riceScore }} | Рекорд: {{ riceBestScore }} | Время: {{ riceTimeLeft }}с</p>
            <div class="rice-playfield field-border">
              <div
                v-if="!riceFinished"
                class="falling-rice"
                :class="['rice-' + riceGrain.type, riceIsSorting ? 'rice-sorting rice-sort-' + riceSortTarget : '']"
                :style="{ left: riceGrain.x + 'px', top: riceGrain.y + 'px' }"
              ></div>
              <div class="rice-bag rice-bag-good">A, влево — хороший</div>
              <div class="rice-bag rice-bag-bad">D, вправо — плохой</div>
              <div v-if="riceFinished" class="mini-game-over">{{ riceMessage }}</div>
            </div>
            <p class="mini-hint">{{ riceMessage }}</p>
            <div class="mini-actions">
              <button type="button" @click="startRiceGame">Новая игра</button>
            </div>
          </div>
        </section>

        <section v-if="isFlyOpen" class="mini-window window fly-window">
          <div class="title-bar">
            <div class="title-bar-text">Мухобойка</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="closeFlyGame"></button>
            </div>
          </div>
          <div class="window-body">
            <p class="mini-meta">Прибито мух: {{ flyScore }} | Время: {{ flyTimeLeft }}с</p>
            <canvas ref="flyCanvas" class="mini-canvas fly-canvas" width="320" height="220" @click="swatFly"></canvas>
            <div class="mini-actions">
              <button type="button" @click="startFlyGame">Новая игра</button>
            </div>
          </div>
        </section>

        <section v-if="isSettingsOpen" class="mini-window window settings-window">
          <div class="title-bar">
            <div class="title-bar-text">Настройки</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="closeSettings"></button>
            </div>
          </div>
          <div class="window-body">
            <p class="mini-meta">Звук</p>
            <div class="mini-actions">
              <button type="button" @click="toggleMusic">{{ musicLabel }}</button>
            </div>
          </div>
        </section>
      </div>
    `
  };
})();
