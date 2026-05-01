(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  const inp =
    "mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  function parseCsv(value) {
    return [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))];
  }

  root.DialoguesPanel = {
    components: {
      SearchField: root.SearchField,
      MultiSelect: root.MultiSelect
    },
    props: ["model", "roles", "formatRole"],
    emits: [
      "add-scenario",
      "select-scenario",
      "save-scenario",
      "open-scenario",
      "delete-scenario",
      "add-turn",
      "select-turn",
      "save-turn",
      "delete-turn",
      "add-keyword",
      "select-keyword",
      "delete-keyword",
      "toggle-keyword-token"
    ],
    computed: {
      tagSelectOptions() {
        return (this.model.tagsData?.tags || []).map((tag) => ({
          value: tag.id,
          text: (tag.title && String(tag.title).trim()) || "—"
        }));
      },
      filteredScenarios() {
        const q = String(this.model.scenarioSearch || "").trim().toLowerCase();
        const list = Array.isArray(this.model.scenariosData?.scenarios) ? this.model.scenariosData.scenarios : [];
        const chars = this.model.charactersData?.characters || [];
        const charName = (cid) => chars.find((c) => c.id === cid)?.name || "";
        let out = list;
        if (q)
          out = list.filter((s) =>
            [s.id, s.title || "", s.topic || "", charName(s.characterId)].join(" ").toLowerCase().includes(q));
        const sid = this.model.selectedScenarioId;
        if (sid && !out.some((s) => s.id === sid)) {
          const cur = list.find((s) => s.id === sid);
          if (cur) out = [cur, ...out.filter((s) => s.id !== sid)];
        }
        return out;
      },
      filteredTurnEntries() {
        const turns = Array.isArray(this.model.selectedScenario?.turns) ? this.model.selectedScenario.turns : [];
        const q = String(this.model.turnChipSearch || "").trim().toLowerCase();
        let out = turns.map((turn, index) => ({ turn, index }));
        if (q)
          out = out.filter(
            ({ turn, index }) =>
              `${turn.request || ""}`.toLowerCase().includes(q) || `${index + 1}`.includes(q)
          );
        const ti = this.model.selectedTurnIndex;
        if (turns[ti] && !out.some((e) => e.index === ti)) {
          out = [{ turn: turns[ti], index: ti }, ...out.filter((e) => e.index !== ti)];
        }
        return out;
      },
      filteredKeywordEntries() {
        const keywords = Array.isArray(this.model.selectedTurn?.keywords) ? this.model.selectedTurn.keywords : [];
        const q = String(this.model.keywordListSearch || "").trim().toLowerCase();
        const tags = this.model.tagsData?.tags || [];
        const tagById = new Map(tags.map((t) => [t.id, t.title]));
        let out = keywords.map((keyword, index) => ({ keyword, index }));
        if (q)
          out = out.filter(({ keyword }) => {
            const tagLine = (keyword.tagIds || []).map((id) => tagById.get(id)).filter(Boolean).join(" ");
            return [keyword.text || "", tagLine].join(" ").toLowerCase().includes(q);
          });
        const ki = this.model.selectedKeywordIndex;
        if (keywords[ki] && !out.some((e) => e.index === ki)) {
          out = [{ keyword: keywords[ki], index: ki }, ...out.filter((e) => e.index !== ki)];
        }
        return out;
      },
      filteredKeywordTokens() {
        const query = this.model.keywordTokenSearch.trim().toLowerCase();
        const list = Array.isArray(this.model.allTokens) ? this.model.allTokens : [];
        const tags = this.model.tagsData?.tags || [];
        const tagTitleById = new Map(tags.map((t) => [t.id, t.title]));
        return list.filter((token) => {
          if (!query) return true;
          const tagTitles = (token.tagIds || []).map((id) => tagTitleById.get(id)).filter(Boolean);
          return [token.id, token.text, ...tagTitles]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
      },
      selectedKeywordTokenRefs() {
        return Array.isArray(this.model.selectedKeyword?.tokens) ? this.model.selectedKeyword.tokens : [];
      }
    },
    methods: {
      keywordHasToken(tokenId) {
        return this.selectedKeywordTokenRefs.some((tokenRef) => tokenRef.tokenId === tokenId);
      },
      tokenTitle(tokenId) {
        const token = this.model.allTokens.find((item) => item.id === tokenId);
        return token?.text || tokenId;
      },
      conceptsText(tokenRef) {
        return (tokenRef.concepts || []).join(", ");
      },
      setTokenRefConcepts(tokenRef, value) {
        tokenRef.concepts = parseCsv(value);
      },
      characterName(characterId) {
        const ch = this.model.charactersData?.characters?.find((c) => c.id === characterId);
        return ch?.name || "";
      },
      tagTitlesForIds(ids) {
        const tags = this.model.tagsData?.tags || [];
        const map = new Map(tags.map((t) => [t.id, t.title]));
        return (ids || []).map((id) => map.get(id)).filter(Boolean);
      },
      keywordSubtitle(keyword) {
        const nTok = (keyword.tokens || []).length;
        const titles = this.tagTitlesForIds(keyword.tagIds);
        const parts = [`токенов: ${nTok}`];
        if (titles.length) parts.push(titles.join(", "));
        return parts.join(" · ");
      }
    },
    template: `
    <div class="ed-list-detail-grid">
      <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div class="min-w-0 max-w-[17rem] grow">
            <search-field v-model="model.scenarioSearch" variant="panel" placeholder="Поиск сценариев" class="w-full" />
          </div>
          <button type="button" class="shrink-0 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-scenario')">+ Новый сценарий</button>
        </div>
        <div class="mt-4 max-h-[min(50vh,24rem)] space-y-2 overflow-y-auto pr-1">
          <button v-for="scenario in filteredScenarios" :key="scenario.id" type="button"
            :class="model.selectedScenarioId === scenario.id ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
            class="w-full rounded-lg border px-3 py-2.5 text-left text-sm"
            @click="$emit('select-scenario', scenario.id)">
            <span class="font-semibold text-slate-100">{{ scenario.title || scenario.id }}</span>
            <span class="mt-0.5 block text-xs text-slate-400"><template v-if="characterName(scenario.characterId)">{{ characterName(scenario.characterId) }} · </template>ходов: {{ scenario.turns.length }}</span>
          </button>
        </div>
      </section>
      <section v-if="model.selectedScenario" class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label class="block text-sm font-medium text-slate-300">ID<input v-model="model.selectedScenario.id" class="${inp}" /></label>
          <label class="block text-sm font-medium text-slate-300">Название<input v-model="model.selectedScenario.title" class="${inp}" /></label>
          <label class="block text-sm font-medium text-slate-300">Тема<input v-model="model.selectedScenario.topic" class="${inp}" /></label>
          <label class="block text-sm font-medium text-slate-300">Персонаж<select v-model="model.selectedScenario.characterId" class="${inp}"><option v-for="ch in model.charactersData.characters" :key="ch.id" :value="ch.id">{{ ch.name || ch.id }}</option></select></label>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-scenario')">Сохранить сценарий</button>
          <button type="button" class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500" @click="$emit('open-scenario')">Открыть в демке</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500" @click="$emit('delete-scenario')">Удалить сценарий</button>
        </div>

        <div class="my-6 h-px bg-slate-700"></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-turn')">+ Ход</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50" :disabled="!model.selectedTurn" @click="$emit('delete-turn')">Удалить ход</button>
        </div>
        <search-field v-model="model.turnChipSearch" variant="panel" placeholder="Поиск среди ходов" class="mt-3" />
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="entry in filteredTurnEntries"
            :key="entry.index"
            type="button"
            :class="entry.index === model.selectedTurnIndex ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
            class="rounded-lg border px-3 py-2 text-sm font-medium text-slate-200"
            @click="$emit('select-turn', entry.index)"
          >
            Ход {{ entry.index + 1 }}
          </button>
        </div>

        <div v-if="model.selectedTurn" class="mt-6 space-y-6">
          <label class="block text-sm font-medium text-slate-300">Реплика пользователя<textarea v-model="model.selectedTurn.request" rows="3" class="${inp}"></textarea></label>
          <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-turn')">Сохранить ход</button>

          <div class="ed-list-detail-grid">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-200">Ключевые слова</h3>
                <button type="button" class="rounded border-0 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-keyword')">+ Ключ</button>
                <button type="button" class="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50" :disabled="!model.selectedKeyword" @click="$emit('delete-keyword')">Удалить ключ</button>
              </div>
              <search-field v-model="model.keywordListSearch" variant="panel" placeholder="Поиск ключей" class="mt-2" />
              <div class="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                <button
                  v-for="kw in filteredKeywordEntries"
                  :key="kw.keyword.id || kw.index"
                  type="button"
                  :class="kw.index === model.selectedKeywordIndex ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
                  class="w-full rounded-lg border px-3 py-2 text-left text-sm"
                  @click="$emit('select-keyword', kw.index)"
                >
                  <span class="font-semibold text-slate-100">{{ kw.keyword.text || kw.keyword.id || "Без текста" }}</span>
                  <span class="mt-0.5 block text-xs text-slate-400">{{ keywordSubtitle(kw.keyword) }}</span>
                </button>
              </div>
              <div v-if="model.selectedKeyword" class="space-y-4">
                <label class="block text-sm font-medium text-slate-300">ID ключа<input v-model="model.selectedKeyword.id" class="${inp}" /></label>
                <label class="block text-sm font-medium text-slate-300">Текст в реплике<input v-model="model.selectedKeyword.text" class="${inp}" /></label>
                <div>
                  <p class="text-sm font-semibold text-slate-200">Токены ключа</p>
                  <search-field v-model="model.keywordTokenSearch" variant="panel" placeholder="Поиск токенов для ключа" class="mt-2" />
                  <div class="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                    <label v-for="token in filteredKeywordTokens" :key="'kw-' + token.id" class="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
                      <input type="checkbox" :checked="keywordHasToken(token.id)" @change="$emit('toggle-keyword-token', token.id, $event.target.checked)" class="mt-1 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                      <span>{{ token.text || token.id }}</span>
                    </label>
                  </div>
                </div>
                <div v-if="selectedKeywordTokenRefs.length">
                  <p class="text-sm font-semibold text-slate-200">Контекстные роли и смыслы</p>
                  <div class="mt-2 space-y-3">
                    <div v-for="tokenRef in selectedKeywordTokenRefs" :key="'ctx-' + tokenRef.tokenId" class="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p class="text-sm font-semibold text-slate-100">{{ tokenTitle(tokenRef.tokenId) }}</p>
                      <label class="mt-2 block text-xs font-medium text-slate-300">Роль
                        <select v-model="tokenRef.role" class="${inp}">
                          <option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option>
                        </select>
                      </label>
                      <label class="mt-2 block text-xs font-medium text-slate-300">Смыслы
                        <input :value="conceptsText(tokenRef)" @input="setTokenRefConcepts(tokenRef, $event.target.value)" class="${inp}" />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-200">Подгрузка по тегам</p>
                  <p class="mt-1 text-xs text-slate-500">Все токены с выбранным тегом добавляются к явным токенам (без дублей по id).</p>
                  <multi-select
                    :key="(model.selectedKeyword && model.selectedKeyword.id) + '-' + model.selectedKeywordIndex"
                    v-model="model.selectedKeyword.tagIds"
                    :options="tagSelectOptions"
                    placeholder="Выберите теги…"
                    class="mt-2"
                  />
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
              Контекст диалога собирается в игре автоматически: каждый раскрытый ключ добавляет токены в общее облако разговора.
            </div>
          </div>
        </div>
      </section>
    </div>
  `
  };
})();
