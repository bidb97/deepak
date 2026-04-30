(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  root.CharactersPanel = {
  props: ["model"],
  emits: ["add-character", "save-character", "delete-character", "select-character"],
  template: `
    <div class="grid-2">
      <section class="card stack">
        <div class="action-row"><button type="button" @click="$emit('add-character')">+ Новый персонаж</button></div>
        <div class="list">
          <button v-for="character in model.charactersData.characters" :key="character.id" type="button" class="list-item" :class="{ active: model.selectedCharacterId === character.id }" @click="$emit('select-character', character.id)">
            <strong>{{ character.name || character.id }}</strong>
            <span class="small muted">{{ character.id }}</span>
          </button>
        </div>
      </section>
      <section class="card stack" v-if="model.selectedCharacter">
        <label>ID<input v-model="model.selectedCharacter.id" /></label>
        <label>Имя<input v-model="model.selectedCharacter.name" /></label>
        <label>Архетип<input v-model="model.selectedCharacter.archetype" /></label>
        <label>Заметки<textarea v-model="model.selectedCharacter.notes"></textarea></label>
        <div class="action-row">
          <button type="button" class="success" @click="$emit('save-character')">Применить персонажа</button>
          <button type="button" class="danger" @click="$emit('delete-character')">Удалить</button>
        </div>
      </section>
    </div>
  `
  };
})();
