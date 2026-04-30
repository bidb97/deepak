(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  root.BranchesPanel = {
  props: ["model", "roles", "formatRole"],
  emits: ["select-branch-scenario", "select-branch-turn", "select-path", "add-path", "delete-path", "save-path"],
  template: `
    <div class="grid-2">
      <section class="card stack">
        <label>Сценарий
          <select :value="model.selectedScenarioId" @change="$emit('select-branch-scenario', $event.target.value)">
            <option v-for="scenario in model.scenariosData.scenarios" :key="scenario.id" :value="scenario.id">{{ scenario.title || scenario.id }}</option>
          </select>
        </label>
        <label>Ход
          <select :value="String(model.selectedTurnIndex)" @change="$emit('select-branch-turn', Number($event.target.value))">
            <option v-for="(turn, index) in (model.selectedScenario?.turns || [])" :key="index" :value="index">Ход {{ index + 1 }}: {{ (turn.request || '').slice(0, 32) }}</option>
          </select>
        </label>
        <div class="action-row">
          <button type="button" :disabled="!model.selectedTurn" @click="$emit('add-path')">+ Ветка</button>
          <button type="button" class="danger" :disabled="!model.selectedPath" @click="$emit('delete-path')">Удалить ветку</button>
        </div>
        <div class="list">
          <button
            v-for="(path, index) in (model.selectedTurn?.paths || [])"
            :key="path.id || index"
            type="button"
            class="list-item"
            :class="{ active: index === model.selectedPathIndex }"
            @click="$emit('select-path', index)"
          >
            <strong>{{ path.title || path.id || "Без названия" }}</strong>
            <span class="small muted">{{ path.reaction || "Нет реакции" }}</span>
          </button>
        </div>
      </section>
      <section class="card stack" v-if="model.selectedPath">
        <div class="action-row">
          <button type="button" class="success" @click="$emit('save-path')">Применить ветку</button>
        </div>
        <label>ID<input v-model="model.selectedPath.id" /></label>
        <label>Название<input v-model="model.selectedPath.title" /></label>
        <label>Любой из смыслов (по строкам, внутри через запятую)<textarea v-model="model.selectedPathRequiresAnyText"></textarea></label>
        <label>Обязательные смыслы<input v-model="model.selectedPathRequiresConcepts" /></label>
        <label>Обязательные роли
          <select v-model="model.selectedPath.requiresRole" multiple>
            <option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option>
          </select>
        </label>
        <label>Запрещенные смыслы<input v-model="model.selectedPathForbiddenConcepts" /></label>
        <label>Максимум действий<input type="number" min="0" v-model="model.selectedPathMaxVerbCount" /></label>
        <label>Реакция<textarea v-model="model.selectedPath.reaction"></textarea></label>
        <label>Отложенное последствие<textarea v-model="model.selectedPath.delayedConsequence"></textarea></label>
      </section>
      <section class="card stack" v-else>
        <div class="empty-state">Выбери сценарий, ход и ветку.</div>
      </section>
    </div>
  `
  };
})();
