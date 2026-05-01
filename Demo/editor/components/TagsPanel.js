(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  const inp =
    "mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  root.TagsPanel = {
    components: {
      SearchField: root.SearchField
    },
    props: ["model"],
    emits: ["add-tag", "save-tag", "delete-tag", "select-tag"],
    computed: {
      filteredTags() {
        const q = String(this.model.tagSearch || "").trim().toLowerCase();
        const list = Array.isArray(this.model.tagsData?.tags) ? this.model.tagsData.tags : [];
        let out = list;
        if (q) out = list.filter((tag) => [tag.id, tag.title].join(" ").toLowerCase().includes(q));
        const tid = this.model.selectedTagId;
        if (tid && !out.some((tag) => tag.id === tid)) {
          const cur = list.find((tag) => tag.id === tid);
          if (cur) out = [cur, ...out.filter((tag) => tag.id !== tid)];
        }
        return out;
      }
    },
    template: `
    <div class="ed-list-detail-grid">
      <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div class="min-w-0 max-w-[17rem] grow">
            <search-field v-model="model.tagSearch" variant="panel" placeholder="Поиск тегов" class="w-full" />
          </div>
          <button type="button" class="shrink-0 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-tag')">+ Новый тег</button>
        </div>
        <div class="mt-4 max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto pr-1">
          <button
            v-for="tag in filteredTags"
            :key="tag.id"
            type="button"
            :class="model.selectedTagId === tag.id ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
            class="w-full rounded-lg border px-3 py-2.5 text-left text-sm"
            @click="$emit('select-tag', tag.id)"
          >
            <span class="font-semibold text-slate-100">{{ tag.title || tag.id }}</span>
          </button>
        </div>
      </section>
      <section v-if="model.selectedTag" class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <label class="block text-sm font-medium text-slate-300">ID<input v-model="model.selectedTag.id" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Название<input v-model="model.selectedTag.title" class="${inp}" /></label>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-tag')">Сохранить тег</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500" @click="$emit('delete-tag')">Удалить</button>
        </div>
      </section>
    </div>
  `
  };
})();
