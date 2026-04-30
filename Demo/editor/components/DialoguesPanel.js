(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  root.DialoguesPanel = {
  props: ["model"],
  emits: ["add-scenario", "select-scenario", "save-scenario", "delete-scenario", "add-turn", "select-turn", "save-turn", "delete-turn"],
  template: `
    <div class="grid-2">
      <section class="card stack">
        <div class="action-row"><button type="button" @click="$emit('add-scenario')">+ Новый сценарий</button></div>
        <div class="list">
          <button v-for="scenario in model.scenariosData.scenarios" :key="scenario.id" type="button" class="list-item" :class="{ active: model.selectedScenarioId === scenario.id }" @click="$emit('select-scenario', scenario.id)">
            <strong>{{ scenario.title || scenario.id }}</strong>
            <span class="small muted">{{ scenario.characterId }} / ходов: {{ scenario.turns.length }}</span>
          </button>
        </div>
      </section>
      <section class="card stack" v-if="model.selectedScenario">
        <label>ID<input v-model="model.selectedScenario.id" /></label>
        <label>Название<input v-model="model.selectedScenario.title" /></label>
        <label>Тема<input v-model="model.selectedScenario.topic" /></label>
        <label>Персонаж<select v-model="model.selectedScenario.characterId"><option v-for="ch in model.charactersData.characters" :key="ch.id" :value="ch.id">{{ ch.name || ch.id }}</option></select></label>
        <div class="action-row">
          <button type="button" class="success" @click="$emit('save-scenario')">Применить сценарий</button>
          <button type="button" class="danger" @click="$emit('delete-scenario')">Удалить сценарий</button>
        </div>

        <div class="divider"></div>
        <div class="action-row">
          <button type="button" @click="$emit('add-turn')">+ Ход</button>
          <button type="button" class="danger" :disabled="!model.selectedTurn" @click="$emit('delete-turn')">Удалить ход</button>
        </div>
        <div class="pill-row">
          <button
            v-for="(turn, index) in model.selectedScenario.turns"
            :key="index"
            type="button"
            :class="{ primary: index === model.selectedTurnIndex }"
            @click="$emit('select-turn', index)"
          >
            Ход {{ index + 1 }}
          </button>
        </div>

        <div v-if="model.selectedTurn" class="stack">
          <label>Реплика пользователя
            <textarea v-model="model.selectedTurn.request"></textarea>
          </label>
          <div class="action-row">
            <button type="button" class="success" @click="$emit('save-turn')">Применить ход</button>
          </div>
          <div class="grid-2">
            <div class="stack">
              <h3>Токены контекста</h3>
              <div class="token-picker">
                <label class="token-check" v-for="item in model.allTokens" :key="'ctx-' + item.token.id">
                  <input type="checkbox" :value="item.token.id" v-model="model.selectedTurn.contextTokens" />
                  <span>{{ item.token.text || item.token.id }}</span>
                </label>
              </div>
            </div>
            <div class="stack">
              <h3>Токены памяти</h3>
              <div class="token-picker">
                <label class="token-check" v-for="item in model.allTokens" :key="'mem-' + item.token.id">
                  <input type="checkbox" :value="item.token.id" v-model="model.selectedTurn.memoryTokens" />
                  <span>{{ item.token.text || item.token.id }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
  };
})();
