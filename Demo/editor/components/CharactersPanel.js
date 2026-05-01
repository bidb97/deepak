(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  const inp =
    "mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  const trashRowDeleteSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none block" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

  root.CharactersPanel = {
    components: {
      SearchField: root.SearchField
    },
    props: ["model"],
    emits: ["add-character", "save-character", "delete-character", "select-character"],
    computed: {
      filteredCharacters() {
        const q = String(this.model.characterSearch || "").trim().toLowerCase();
        const list = Array.isArray(this.model.charactersData?.characters) ? this.model.charactersData.characters : [];
        let out = list;
        if (q)
          out = list.filter((ch) =>
            [ch.id, ch.name, ch.archetype, ch.notes].join(" ").toLowerCase().includes(q));
        const cid = this.model.selectedCharacterId;
        if (cid && !out.some((ch) => ch.id === cid)) {
          const cur = list.find((ch) => ch.id === cid);
          if (cur) out = [cur, ...out.filter((ch) => ch.id !== cid)];
        }
        return out;
      }
    },
    template: `
    <div class="ed-list-detail-grid">
      <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div class="min-w-0 max-w-[17rem] grow">
            <search-field v-model="model.characterSearch" variant="panel" placeholder="Персонажи…" class="w-full" />
          </div>
          <button type="button" class="shrink-0 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700" @click="$emit('add-character')">+ Новый персонаж</button>
        </div>
        <div class="ed-editor-scroll-list mt-4 space-y-2">
          <div v-for="character in filteredCharacters" :key="character.id" class="relative">
            <button type="button"
              :class="model.selectedCharacterId === character.id ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
              class="w-full rounded-lg border py-2.5 pl-3 pr-10 text-left text-sm"
              @click="$emit('select-character', character.id)">
              <span class="font-semibold text-slate-100">{{ character.name || character.id }}</span>
              <span v-if="character.archetype" class="mt-0.5 block text-xs text-slate-400">{{ character.archetype }}</span>
            </button>
            <button
              type="button"
              class="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-md border-0 bg-transparent p-1.5 text-slate-400 shadow-none hover:bg-slate-900/60 hover:text-red-400"
              title="Удалить"
              aria-label="Удалить персонажа"
              @click.stop="$emit('delete-character', character.id)"
            >
              ${trashRowDeleteSvg}
            </button>
          </div>
        </div>
      </section>
      <section v-if="model.selectedCharacter" class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <label class="block text-sm font-medium text-slate-300">ID<input v-model="model.selectedCharacter.id" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Имя<input v-model="model.selectedCharacter.name" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Архетип<input v-model="model.selectedCharacter.archetype" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Заметки<textarea v-model="model.selectedCharacter.notes" rows="4" class="${inp}"></textarea></label>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-character')">Сохранить персонажа</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500" @click="$emit('delete-character')">Удалить</button>
        </div>
      </section>
    </div>
  `
  };
})();
