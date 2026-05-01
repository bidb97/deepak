(function () {
  const root = (window.DeepakDemo = window.DeepakDemo || {});

  root.ValidationPanel = {
    components: {
      SearchField: root.SearchField
    },
    props: ["model", "items"],
    computed: {
      filteredItems() {
        const list = Array.isArray(this.items) ? this.items : [];
        const q = String(this.model?.validationSearch || "").trim().toLowerCase();
        if (!q) return list;
        return list.filter((item) => String(item.text || "").toLowerCase().includes(q));
      }
    },
    template: `
    <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
      <search-field v-model="model.validationSearch" variant="panel" placeholder="Фильтр сообщений проверки" />
      <div class="mt-4 grid gap-3">
        <div v-if="!items.length" class="rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          <strong class="block text-emerald-200">OK</strong>
          <div class="mt-1 text-emerald-100/90">Связи выглядят корректно.</div>
        </div>
        <div v-else-if="filteredItems.length === 0" class="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-300">
          Нет сообщений под запрос фильтра.
        </div>
        <div v-for="(item, idx) in filteredItems" :key="idx" class="rounded-lg border px-4 py-3 text-sm"
          :class="item.type === 'bad' ? 'border-red-700/70 bg-red-950/50 text-red-100' : 'border-amber-700/60 bg-amber-950/40 text-amber-100'">
          <strong class="block" :class="item.type === 'bad' ? 'text-red-200' : 'text-amber-200'">{{ item.type === 'bad' ? 'Ошибка' : 'Предупреждение' }}</strong>
          <div class="mt-1">{{ item.text }}</div>
        </div>
      </div>
    </section>
  `
  };
})();
