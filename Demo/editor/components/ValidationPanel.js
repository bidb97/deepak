(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  root.ValidationPanel = {
  props: ["items"],
  template: `
    <section class="card stack">
      <div class="validation-list">
        <div v-if="!items.length" class="validation-item good"><strong>OK</strong><div>Связи выглядят корректно.</div></div>
        <div v-for="(item, idx) in items" :key="idx" class="validation-item" :class="item.type">
          <strong>{{ item.type === 'bad' ? 'Ошибка' : 'Предупреждение' }}</strong>
          <div>{{ item.text }}</div>
        </div>
      </div>
    </section>
  `
  };
})();
