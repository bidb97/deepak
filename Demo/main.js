(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const { createApp } = Vue;

  function getRoute() {
    return window.location.hash === "#/editor" ? "editor" : "game";
  }

  createApp({
    components: {
      GameApp: root.GameApp,
      EditorApp: root.EditorApp
    },
    data() {
      return {
        route: getRoute(),
        editorModel: root.createEditorModel(),
        editorApi: root.editorApi
      };
    },
    computed: {
      currentComponent() {
        return this.route === "editor" ? "EditorApp" : "GameApp";
      }
    },
    methods: {
      syncRoute() {
        this.route = getRoute();
        document.documentElement.classList.toggle("editor-mode", this.route === "editor");
        document.body.classList.toggle("editor-mode", this.route === "editor");
      }
    },
    mounted() {
      if (!window.location.hash) window.location.hash = "#/game";
      this.syncRoute();
      window.addEventListener("hashchange", this.syncRoute);
    },
    updated() {
      this.$nextTick(() => {
        if (this.route !== "editor" || typeof window.lucide?.createIcons !== "function") return;
        const el = document.getElementById("editor-app");
        if (el) window.lucide.createIcons({ root: el });
      });
    },
    unmounted() {
      window.removeEventListener("hashchange", this.syncRoute);
    },
    template: `
      <component
        :is="currentComponent"
        :model="editorModel"
        :api="editorApi"
      />
    `
  }).mount("#app");
})();
