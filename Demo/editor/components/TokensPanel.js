(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  root.TokensPanel = {
  props: ["model", "roles", "risks", "formatRole", "formatRisk", "formatKind"],
  emits: ["add-token", "save-token", "delete-token", "select-token"],
  computed: {
    filteredTokens() {
      const query = this.model.tokenSearch.trim().toLowerCase();
      return this.model.allTokens.filter(({ token, kind }) => {
        if (this.model.tokenKindFilter !== "all" && kind !== this.model.tokenKindFilter) return false;
        if (this.model.tokenRoleFilter !== "all" && token.role !== this.model.tokenRoleFilter) return false;
        if (this.model.tokenRiskFilter !== "all" && token.risk !== this.model.tokenRiskFilter) return false;
        if (!query) return true;
        return [token.id, token.text, ...(token.concepts || []), ...(token.topics || [])].join(" ").toLowerCase().includes(query);
      });
    }
  },
  template: `
    <div class="grid-2">
      <section class="card stack">
        <div class="filters">
          <input v-model="model.tokenSearch" type="search" placeholder="Поиск токенов" />
          <select v-model="model.tokenKindFilter"><option value="all">Все</option><option value="common">Общие</option><option value="scenario">Сценарные</option></select>
          <select v-model="model.tokenRoleFilter"><option value="all">Все роли</option><option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option></select>
          <select v-model="model.tokenRiskFilter"><option value="all">Все риски</option><option v-for="risk in risks" :key="risk" :value="risk">{{ formatRisk(risk) }}</option></select>
        </div>
        <div class="action-row"><button type="button" @click="$emit('add-token')">+ Новый токен</button></div>
        <div class="list">
          <button v-for="item in filteredTokens" :key="item.kind + ':' + item.token.id" type="button" class="list-item" :class="{ active: model.selectedTokenId === item.token.id && model.selectedTokenKind === item.kind }" @click="$emit('select-token', item.kind, item.token.id)">
            <strong>{{ item.token.text || item.token.id }}</strong>
            <span class="small muted">{{ formatKind(item.kind) }} / {{ formatRole(item.token.role) }} / {{ formatRisk(item.token.risk) }}</span>
          </button>
        </div>
      </section>
      <section class="card stack" v-if="model.selectedToken">
        <label>Группа<select v-model="model.selectedTokenKind"><option value="common">Общие</option><option value="scenario">Сценарные</option></select></label>
        <label>ID<input v-model="model.selectedToken.id" /></label>
        <label>Текст<input v-model="model.selectedToken.text" /></label>
        <label>Роль<select v-model="model.selectedToken.role"><option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option></select></label>
        <label>Риск<select v-model="model.selectedToken.risk"><option v-for="risk in risks" :key="risk" :value="risk">{{ formatRisk(risk) }}</option></select></label>
        <label>Смыслы<input v-model="model.selectedTokenConcepts" /></label>
        <label>Темы<input v-model="model.selectedTokenTopics" /></label>
        <div class="action-row">
          <button type="button" class="success" @click="$emit('save-token')">Применить токен</button>
          <button type="button" class="danger" @click="$emit('delete-token')">Удалить</button>
        </div>
      </section>
    </div>
  `
  };
})();
