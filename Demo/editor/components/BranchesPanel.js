(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  function optsValueKey(options) {
    if (!Array.isArray(options)) return "";
    return options.map((o) => String(o.value)).sort().join("|");
  }

  const inp =
    "mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
  const mono = inp + " font-mono";

  root.BranchesPanel = {
    components: {
      MultiSelect: root.MultiSelect,
      SearchField: root.SearchField
    },
    props: ["model", "roles", "formatRole"],
    emits: ["select-branch-scenario", "select-branch-turn", "select-path", "add-path", "delete-path", "save-path"],
    computed: {
      roleSelectOptions() {
        const fromTokens = (this.roles || []).map((role) => ({ value: role, text: this.formatRole(role) }));
        const seen = new Set(fromTokens.map((o) => String(o.value)));
        const out = [...fromTokens];
        const extra = this.model.selectedPath?.requiresRole;
        if (Array.isArray(extra)) {
          for (const r of extra) {
            const s = String(r);
            if (!seen.has(s)) {
              seen.add(s);
              out.push({ value: s, text: this.formatRole(s) });
            }
          }
        }
        return out;
      },
      branchRolesMultiKey() {
        const id = this.model.selectedPath?.id || "none";
        return id + "|" + optsValueKey(this.roleSelectOptions);
      },
      filteredBranchScenarios() {
        const list = Array.isArray(this.model.scenariosData?.scenarios) ? this.model.scenariosData.scenarios : [];
        const q = String(this.model.branchScenarioSearch || "").trim().toLowerCase();
        const chars = this.model.charactersData?.characters || [];
        const charName = (cid) => chars.find((c) => c.id === cid)?.name || "";
        let out = list;
        if (q)
          out = list.filter((s) =>
            [s.id, s.title || "", charName(s.characterId)].join(" ").toLowerCase().includes(q));
        const sid = this.model.selectedScenarioId;
        if (sid && !out.some((s) => s.id === sid)) {
          const cur = list.find((s) => s.id === sid);
          if (cur) out = [cur, ...out.filter((s) => s.id !== sid)];
        }
        return out;
      },
      filteredBranchPathEntries() {
        const paths = Array.isArray(this.model.selectedTurn?.paths) ? this.model.selectedTurn.paths : [];
        const q = String(this.model.branchPathSearch || "").trim().toLowerCase();
        const base = paths.map((path, index) => ({ path, index }));
        let out = base;
        if (q)
          out = base.filter(({ path }) =>
            [path.id || "", path.title || "", path.reaction || ""].join(" ").toLowerCase().includes(q));
        const pi = this.model.selectedPathIndex;
        if (paths[pi] && !out.some((e) => e.index === pi)) {
          out = [{ path: paths[pi], index: pi }, ...out.filter((e) => e.index !== pi)];
        }
        return out;
      }
    },
    template: `
    <div class="ed-list-detail-grid">
      <section class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <search-field v-model="model.branchScenarioSearch" variant="panel" placeholder="Поиск сценариев" />
        <label class="mt-3 block text-sm font-medium text-slate-300">Сценарий
          <select :value="model.selectedScenarioId" @change="$emit('select-branch-scenario', $event.target.value)" class="${inp}">
            <option v-for="scenario in filteredBranchScenarios" :key="scenario.id" :value="scenario.id">{{ scenario.title || scenario.id }}</option>
          </select>
        </label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Ход
          <select :value="String(model.selectedTurnIndex)" @change="$emit('select-branch-turn', Number($event.target.value))" class="${inp}">
            <option v-for="(turn, index) in (model.selectedScenario?.turns || [])" :key="index" :value="index">Ход {{ index + 1 }}: {{ (turn.request || '').slice(0, 32) }}</option>
          </select>
        </label>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 shadow-none hover:bg-slate-700 disabled:opacity-50" :disabled="!model.selectedTurn" @click="$emit('add-path')">+ Ветка</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50" :disabled="!model.selectedPath" @click="$emit('delete-path')">Удалить ветку</button>
        </div>
        <search-field v-model="model.branchPathSearch" variant="panel" placeholder="Поиск веток" class="mt-3" />
        <div class="mt-3 max-h-[min(50vh,24rem)] space-y-2 overflow-y-auto pr-1">
          <button
            v-for="ent in filteredBranchPathEntries"
            :key="ent.path.id || ent.index"
            type="button"
            :class="ent.index === model.selectedPathIndex ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500/80' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
            class="w-full rounded-lg border px-3 py-2.5 text-left text-sm"
            @click="$emit('select-path', ent.index)"
          >
            <span class="font-semibold text-slate-100">{{ ent.path.title || ent.path.id || "Без названия" }}</span>
            <span class="mt-0.5 block text-xs text-slate-400">{{ ent.path.reaction || "Нет реакции" }}</span>
          </button>
        </div>
      </section>
      <section v-if="model.selectedPath" class="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30">
        <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500" @click="$emit('save-path')">Сохранить ветку</button>
        <label class="mt-4 block text-sm font-medium text-slate-300">ID<input v-model="model.selectedPath.id" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Название<input v-model="model.selectedPath.title" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Любой из смыслов (по строкам, внутри через запятую)<textarea v-model="model.selectedPathRequiresAnyText" rows="5" class="${mono}"></textarea></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Обязательные смыслы<input v-model="model.selectedPathRequiresConcepts" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Обязательные роли
          <multi-select
            :key="'br-' + branchRolesMultiKey"
            v-model="model.selectedPath.requiresRole"
            :options="roleSelectOptions"
            placeholder="Выберите роли…"
            class="mt-1 block w-full"
          />
        </label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Запрещенные смыслы<input v-model="model.selectedPathForbiddenConcepts" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Максимум действий<input type="number" min="0" v-model="model.selectedPathMaxVerbCount" class="${inp}" /></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Реакция<textarea v-model="model.selectedPath.reaction" rows="3" class="${inp}"></textarea></label>
        <label class="mt-3 block text-sm font-medium text-slate-300">Отложенное последствие<textarea v-model="model.selectedPath.delayedConsequence" rows="2" class="${inp}"></textarea></label>
      </section>
      <section v-else class="rounded-xl border border-dashed border-slate-600 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        Выбери сценарий, ход и ветку.
      </section>
    </div>
  `
  };
})();
