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
        cowAudio: null,
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
        demoDirectoryHandle: null,
        shiftStarted: false,
        conversations: [],
        activeConversationId: null,
        unreadBiminiTotal: 0,
        incomingConversationTimerId: null,
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
        return this.activeConversationScenario?.turns?.[this.activeConversation?.turnIndex || 0] || { request: "", contextTokens: [], memoryTokens: [], paths: [] };
      },
      currentCharacter() {
        return this.charactersById.get(this.activeConversationScenario?.characterId) || { name: "Ожидание диалога" };
      },
      musicLabel() {
        return this.isMusicEnabled ? "Выключить музыку" : "Включить музыку";
      },
      contextStateHtml() {
        const memoryTokens = this.memoryTokens;
        const memory = memoryTokens.length > 0
          ? `Память: ${memoryTokens.map((token) => `<span>${token.text}</span>`).join("")}`
          : "Память пока пустая.";
        return `Ход ${(this.activeConversation?.turnIndex || 0) + 1} из ${this.activeConversationScenario?.turns?.length || 0}. ${memory}`;
      },
      tokenGroups() {
        const commonTokens = getTokensByIds(this.tokenById, ["hello", "hi", "i", "you", "not", "can", "please", "thanks"]);
        const connectorTokens = getTokensByIds(this.tokenById, ["first", "then", "if", "and", "but", "because"]);
        const punctuationTokens = getTokensByIds(this.tokenById, ["comma", "period", "question"]);
        const contextTokens = getTokensByIds(this.tokenById, this.currentTurn.contextTokens || []);
        const contextSet = new Set(contextTokens.map((token) => token.id));
        const memoryTokens = this.memoryTokens.filter((token) => !contextSet.has(token.id));
        const groups = [
          ["Общие", commonTokens],
          ["Связки", connectorTokens],
          ["Знаки", punctuationTokens],
          ["Контекст сообщения", contextTokens]
        ].filter(([, tokens]) => tokens.length > 0);
        if (memoryTokens.length > 0) groups.push(["Память диалога", memoryTokens]);
        return groups.map(([title, tokens]) => ({ title, tokens }));
      },
      memoryTokens() {
        return getTokensByIds(this.tokenById, this.activeConversation?.memoryTokenIds || []);
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
        this.tokens = [...content.tokensData.common, ...content.tokensData.scenario];
        this.tokenById = new Map(this.tokens.map((token) => [token.id, token]));
        this.charactersById = new Map(content.charactersData.characters.map((character) => [character.id, character]));
        this.scenarios = content.scenariosData.scenarios;
        this.isContentReady = true;
        this.conversations = [];
        this.activeConversationId = null;
        this.unreadBiminiTotal = 0;
        this.$nextTick(this.initSortables);
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
        this.scheduleCowAmbient();
        this.ensureConversationExists();
        this.startIncomingConversationLoop();
      },
      scheduleCowAmbient() {
        if (!this.musicUnlocked) return;
        const delay = 25000 + Math.floor(Math.random() * 10000);
        window.setTimeout(() => {
          root.audio.playCowAmbient(this);
          this.scheduleCowAmbient();
        }, delay);
      },
      toggleMusic() {
        root.audio.toggleBackgroundMusic(this);
      },
      addToken(tokenId, insertIndex = null) {
        if (!this.activeConversation) return;
        const token = this.tokenById.get(tokenId);
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
        this.$nextTick(this.initAnswerSortable);
      },
      pushUserMessage(conversationId, text, delay = getRandomMessageDelay()) {
        const conversation = this.conversations.find((item) => item.id === conversationId);
        if (!conversation) return;
        conversation.isWaitingForUser = true;
        window.setTimeout(() => {
          const nextConversation = this.conversations.find((item) => item.id === conversationId);
          if (!nextConversation) return;
          const scenario = this.scenarios.find((item) => item.id === nextConversation.scenarioId);
          const speaker = this.getScenarioCharacter(scenario).name;
          nextConversation.chatHistory.push({ speaker, text, kind: "user" });
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
          return;
        }
        const features = root.scoring.collectFeatures(this.activeConversation.answer);
        const formResult = root.scoring.evaluateForm(this.activeConversation.answer, features);
        const pathResult = root.scoring.detectBestPath(features, this.currentTurn.paths, formResult);
        const score = root.scoring.calculateFinalScore(pathResult, formResult, features);
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
        const reaction = this.advanceDialogue(pathResult, answerText);
        if (reaction) this.pushUserMessage(this.activeConversation.id, reaction, getRandomMessageDelay());
      },
      advanceDialogue(pathResult, answerText) {
        if (!this.activeConversation) return "";
        const currentTurn = this.currentTurn;
        const reaction = pathResult.path?.reaction || "Пользователь не понял ответ.";
        const nextTurn = this.activeConversationScenario?.turns?.[this.activeConversation.turnIndex + 1];
        this.activeConversation.chatHistory.push({ speaker: "Дипак", text: answerText, kind: "deepak" });
        (currentTurn.memoryTokens || currentTurn.contextTokens || []).forEach((tokenId) => {
          if (!this.activeConversation.memoryTokenIds.includes(tokenId)) this.activeConversation.memoryTokenIds.push(tokenId);
        });
        if (nextTurn) this.activeConversation.turnIndex += 1;
        this.activeConversation.answer = [];
        return reaction;
      },
      createConversation() {
        const scenario = this.getRandomScenario();
        if (!scenario) return null;
        const id = `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const conversation = {
          id,
          scenarioId: scenario.id,
          turnIndex: 0,
          chatHistory: [],
          memoryTokenIds: [],
          answer: [],
          isWaitingForUser: false,
          unread: 0
        };
        this.conversations.push(conversation);
        if (!this.activeConversationId) this.activeConversationId = conversation.id;
        this.$nextTick(this.initSortables);
        return conversation;
      },
      ensureConversationExists() {
        if (this.conversations.length > 0) return;
        const conversation = this.createConversation();
        if (!conversation) return;
        this.activeConversationId = conversation.id;
        const scenario = this.scenarios.find((item) => item.id === conversation.scenarioId);
        const firstTurn = scenario?.turns?.[0];
        if (firstTurn?.request) this.pushUserMessage(conversation.id, firstTurn.request, 350);
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
      startIncomingConversationLoop() {
        const schedule = () => {
          const delay = randomInt(9000, 18000);
          this.incomingConversationTimerId = window.setTimeout(() => {
            const conversation = this.createConversation();
            if (conversation) {
              const scenario = this.scenarios.find((item) => item.id === conversation.scenarioId);
              const firstTurn = scenario?.turns?.[0];
              if (firstTurn?.request) this.pushUserMessage(conversation.id, firstTurn.request, getRandomMessageDelay());
            }
            schedule();
          }, delay);
        };
        if (!this.incomingConversationTimerId) schedule();
      },
      resetUnreadCounter() {
        this.unreadBiminiTotal = 0;
        this.conversations.forEach((conversation) => { conversation.unread = 0; });
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
    },
    unmounted() {
      this.answerSortable?.destroy();
      this.tokenSortables.forEach((sortable) => sortable.destroy());
      if (this.snakeLoopId) window.clearInterval(this.snakeLoopId);
      if (this.riceTimerId) window.clearInterval(this.riceTimerId);
      if (this.riceLoopId) window.clearInterval(this.riceLoopId);
      if (this.flyTimerId) window.clearInterval(this.flyTimerId);
      if (this.flyLoopId) window.clearInterval(this.flyLoopId);
      if (this.incomingConversationTimerId) window.clearTimeout(this.incomingConversationTimerId);
      window.removeEventListener("keydown", this.handleSnakeKeydown);
      window.removeEventListener("keydown", this.handleRiceKeydown);
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
              <section class="panel chat-panel window">
                <div class="title-bar inactive">
                  <div class="title-bar-text">Чат Bemini</div>
                </div>
                <div class="window-body">
                  <div class="chat-card">
                    <div class="chat-history">
                      <div v-for="(message, index) in (activeConversation?.chatHistory || [])" :key="index" class="message" :class="message.kind === 'deepak' ? 'message-deepak' : 'message-user'">
                        <span class="message-meta">{{ message.speaker }}</span>
                        {{ message.text }}
                      </div>
                      <div v-if="!activeConversation" class="empty-result">Ожидание новых диалогов...</div>
                    </div>
                  </div>

                  <div class="answer-box">
                    <div class="answer-title">Введите ответ</div>
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

              <section class="side-stack">
                <section class="panel tokens-panel window">
                  <div class="title-bar inactive">
                    <div class="title-bar-text">Облако токенов</div>
                  </div>
                  <div class="window-body">
                    <div class="context-state" v-html="contextStateHtml"></div>
                    <div ref="tokenGroups">
                      <div v-for="group in tokenGroups" :key="group.title" class="token-group">
                        <h3>{{ group.title }}</h3>
                        <div class="token-list">
                          <button
                            v-for="token in group.tokens"
                            :key="token.id"
                            type="button"
                            class="token-button"
                            :class="['role-' + token.role, { 'token-highlighted': highlightedTokenIds.has(token.id) }]"
                            draggable="true"
                            :data-token-id="token.id"
                            @click="addToken(token.id)"
                          >
                            {{ token.text }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="panel result-panel window">
                  <div class="title-bar inactive">
                    <div class="title-bar-text">Разбор ответа</div>
                  </div>
                  <div class="window-body" v-html="resultHtml"></div>
                </section>
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
            <p class="mini-meta">Счёт: {{ snake.score }} | Рекорд: {{ snakeBestScore }} | WASD / стрелки</p>
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
              <div class="rice-bag rice-bag-good">A / ← Хороший</div>
              <div class="rice-bag rice-bag-bad">D / → Плохой</div>
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
