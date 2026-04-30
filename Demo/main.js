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
