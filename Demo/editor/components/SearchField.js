(function () {
  const root = (window.DeepakDemo = window.DeepakDemo || {});

  root.SearchField = {
    name: "SearchField",
    props: {
      modelValue: { type: String, default: "" },
      placeholder: { type: String, default: "" },
      /** panel = список слева; toolbar = строка с том-селектами */
      variant: { type: String, default: "panel" }
    },
    emits: ["update:modelValue"],
    computed: {
      variantClass() {
        return this.variant === "toolbar" ? "ed-search--toolbar" : "ed-search--panel";
      }
    },
    template: `
      <input
        type="text"
        inputmode="search"
        autocomplete="off"
        class="ed-search"
        :class="variantClass"
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `
  };
})();
