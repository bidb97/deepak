(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  const inp =
    "box-border mt-1 block h-9 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-0 text-sm leading-9 text-slate-100 placeholder:text-slate-500 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  root.TokensPanel = {
    components: {
      SearchField: root.SearchField,
      MultiSelect: root.MultiSelect
    },
    props: ["model"],
    emits: ["add-token", "save-token", "delete-token", "select-token"],
    computed: {
      tagSelectOptions() {
        return (this.model.tagsData?.tags || []).map((tag) => ({
          value: tag.id,
          text: (tag.title && String(tag.title).trim()) || "—"
        }));
      },
      filteredTokens() {
        const query = this.model.tokenSearch.trim().toLowerCase();
        const filterTagIds = Array.isArray(this.model.tokenTagFilter) ? this.model.tokenTagFilter : [];
        const filterSet = new Set(filterTagIds.map(String));
        const list = Array.isArray(this.model.allTokens) ? this.model.allTokens : [];
        const tags = this.model.tagsData?.tags || [];
        const tagTitleById = new Map(tags.map((t) => [t.id, t.title]));
        let out = list.filter((token) => {
          if (filterSet.size === 0) return true;
          const tids = new Set((token.tagIds || []).map(String));
          for (const fid of filterSet) {
            if (tids.has(fid)) return true;
          }
          return false;
        });
        out = out.filter((token) => {
          if (!query) return true;
          const tagTitles = (token.tagIds || []).map((id) => tagTitleById.get(id)).filter(Boolean);
          return [token.id, token.text, ...(token.tagIds || []), ...tagTitles]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
        const sid = this.model.selectedTokenId;
        if (sid && !out.some((t) => t.id === sid)) {
          const cur = list.find((t) => t.id === sid);
          if (cur) {
            return [cur, ...out.filter((t) => t.id !== sid)];
          }
        }
        return out;
      }
    },
    methods: {
      tokenTagTitlesLine(token) {
        const map = new Map((this.model.tagsData?.tags || []).map((t) => [t.id, t.title]));
        return (token.tagIds || []).map((id) => map.get(id)).filter(Boolean).join(", ");
      }
    },
    template: `
    <div class="ed-list-detail-grid">
      <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <div class="ed-token-toolbar-row">
          <search-field v-model="model.tokenSearch" variant="toolbar" placeholder="Текст токена или тег…" class="w-full min-w-0" />
          <multi-select
            v-model="model.tokenTagFilter"
            :options="tagSelectOptions"
            placeholder="Фильтр по тегам"
            class="!mt-0 min-w-0"
          />
          <button type="button" class="shrink-0 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-token')">+ Новый токен</button>
        </div>
        <div class="mt-4 max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto pr-1">
          <button v-for="token in filteredTokens" :key="token.id" type="button"
            :class="model.selectedTokenId === token.id ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
            class="w-full rounded-lg border px-3 py-2.5 text-left text-sm"
            @click="$emit('select-token', token.id)">
            <span class="font-semibold text-slate-100">{{ token.text || token.id }}</span>
            <span v-if="tokenTagTitlesLine(token)" class="mt-0.5 block text-xs text-slate-500">теги: {{ tokenTagTitlesLine(token) }}</span>
          </button>
        </div>
      </section>
      <section v-if="model.selectedToken" class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <label class="block text-sm font-medium text-slate-300">ID<input v-model="model.selectedToken.id" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Текст<input v-model="model.selectedToken.text" class="${inp}" /></label>
        <label class="mt-4 block text-sm font-medium text-slate-300">Теги</label>
        <multi-select
          :key="model.selectedTokenId"
          v-model="model.selectedToken.tagIds"
          :options="tagSelectOptions"
          placeholder="Выберите теги…"
          class="mt-1"
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-token')">Сохранить токен</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500" @click="$emit('delete-token')">Удалить</button>
        </div>
      </section>
    </div>
  `
  };
})();
