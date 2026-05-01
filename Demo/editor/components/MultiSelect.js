(function () {
  const root = (window.DeepakDemo = window.DeepakDemo || {});

  function sortedSig(arr) {
    return JSON.stringify([...(arr || [])].map(String).sort());
  }

  root.MultiSelect = {
    name: "MultiSelect",
    props: {
      modelValue: { type: Array, default: () => [] },
      options: { type: Array, required: true },
      placeholder: { type: String, default: "" },
      disabled: { type: Boolean, default: false }
    },
    emits: ["update:modelValue"],
    data() {
      return { nativeFallback: false };
    },
    template: `
      <div class="ed-tom-native-host ed-tom-multi relative mt-1 block min-h-9 w-full" :class="{ 'ed-tom-native-fallback': nativeFallback }">
        <select ref="tsRoot" multiple autocomplete="off" class="ed-tom-select-native" :disabled="disabled" @change="onNativeMultiChange">
          <option v-for="opt in (nativeFallback ? options : [])" :key="'o-' + String(opt.value)" :value="opt.value">{{ opt.text }}</option>
        </select>
      </div>
    `,
    methods: {
      tomOptionList() {
        return (this.options || []).map((o) => ({
          value: String(o.value),
          text: String(o.text != null ? o.text : o.value)
        }));
      },
      sanitizeValue(v) {
        if (!Array.isArray(v)) return [];
        return v.map(String);
      },
      onNativeMultiChange(e) {
        if (this.tom) return;
        const sel = Array.from(e.target.selectedOptions).map((o) => String(o.value));
        this.$emit("update:modelValue", sel);
      },
      initTom() {
        const Tom = window.TomSelect;
        if (typeof Tom === "undefined") {
          this.nativeFallback = true;
          return;
        }
        this.destroyTom();
        const el = this.$refs.tsRoot;
        if (!el) return;
        const initial = this.sanitizeValue(this.modelValue);
        const tomOptions = this.tomOptionList();
        this.nativeFallback = false;
        try {
          this.tom = new Tom(el, {
            plugins: ["remove_button"],
            persist: false,
            maxItems: null,
            placeholder: this.placeholder,
            options: tomOptions,
            items: initial,
            hideSelected: true,
            onChange: (val) => {
              if (val === undefined || val === null || val === "")
                this.$emit("update:modelValue", []);
              else this.$emit("update:modelValue", Array.isArray(val) ? val.map(String) : [String(val)]);
            }
          });
          if (this.disabled) this.tom.disable();
        } catch (_e) {
          this.tom = null;
          this.nativeFallback = true;
        }
      },
      destroyTom() {
        if (this.tom) {
          this.tom.destroy();
          this.tom = null;
        }
      }
    },
    mounted() {
      this._optionsSig = sortedSig((this.options || []).map((o) => o.value));
      this.$nextTick(() => {
        this.$nextTick(() => this.initTom());
      });
    },
    beforeUnmount() {
      this.destroyTom();
    },
    watch: {
      modelValue: {
        deep: true,
        handler(next) {
          if (this.tom) {
            const want = this.sanitizeValue(next);
            const have = this.tom.getValue();
            const haveArr = Array.isArray(have) ? have.map(String) : have ? [String(have)] : [];
            if (sortedSig(want) !== sortedSig(haveArr)) this.tom.setValue(want, true);
            return;
          }
          if (!this.nativeFallback || !this.$refs.tsRoot) return;
          const el = this.$refs.tsRoot;
          const want = new Set(this.sanitizeValue(next));
          for (let i = 0; i < el.options.length; i++) {
            const opt = el.options[i];
            opt.selected = want.has(String(opt.value));
          }
        }
      },
      disabled(d) {
        if (!this.tom) return;
        if (d) this.tom.disable();
        else this.tom.enable();
      },
      options: {
        deep: true,
        flush: "post",
        handler(newOpts) {
          const nextSig = sortedSig((newOpts || []).map((o) => o.value));
          if (nextSig === this._optionsSig) return;
          this._optionsSig = nextSig;
          this.destroyTom();
          this.$nextTick(() => {
            this.$nextTick(() => this.initTom());
          });
        }
      }
    }
  };

  root.TomSelectSingle = {
    name: "TomSelectSingle",
    props: {
      modelValue: { type: String, default: "" },
      options: { type: Array, required: true },
      placeholder: { type: String, default: "" },
      disabled: { type: Boolean, default: false }
    },
    emits: ["update:modelValue"],
    data() {
      return { nativeFallback: false };
    },
    template: `
      <div class="ed-tom-native-host relative min-h-9 w-full" :class="{ 'ed-tom-native-fallback': nativeFallback }">
        <select ref="tsRoot" autocomplete="off" class="ed-tom-select-native" :disabled="disabled" @change="onNativeSingleChange">
          <option v-for="opt in options" :key="'s-' + String(opt.value)" :value="opt.value">{{ opt.text }}</option>
        </select>
      </div>
    `,
    methods: {
      onNativeSingleChange(e) {
        if (this.tom) return;
        const v = e.target.value;
        this.$emit("update:modelValue", v === undefined || v === null ? "" : String(v));
      },
      initTom() {
        const Tom = window.TomSelect;
        if (typeof Tom === "undefined") {
          this.nativeFallback = true;
          return;
        }
        this.destroyTom();
        const el = this.$refs.tsRoot;
        if (!el) return;
        const v = this.modelValue != null ? String(this.modelValue) : "";
        this.nativeFallback = false;
        try {
          this.tom = new Tom(el, {
            maxItems: 1,
            persist: false,
            create: false,
            allowEmptyOption: true,
            placeholder: this.placeholder,
            items: v !== "" ? [v] : [],
            onChange: (val) => {
              const raw = Array.isArray(val) ? val[0] : val;
              this.$emit(
                "update:modelValue",
                raw === undefined || raw === null ? "" : String(raw)
              );
            }
          });
          if (this.disabled) this.tom.disable();
        } catch (_e) {
          this.tom = null;
          this.nativeFallback = true;
        }
      },
      destroyTom() {
        if (this.tom) {
          this.tom.destroy();
          this.tom = null;
        }
      }
    },
    mounted() {
      this._optionsSig = sortedSig((this.options || []).map((o) => o.value));
      this.$nextTick(() => this.initTom());
    },
    beforeUnmount() {
      this.destroyTom();
    },
    watch: {
      modelValue(next) {
        if (this.tom) {
          const want = next != null ? String(next) : "";
          let have = this.tom.getValue();
          have = Array.isArray(have) ? have[0] : have;
          const hs = have === undefined || have === null ? "" : String(have);
          if (want !== hs) this.tom.setValue(want, true);
          return;
        }
        if (!this.nativeFallback || !this.$refs.tsRoot) return;
        const want = next != null ? String(next) : "";
        const el = this.$refs.tsRoot;
        if (String(el.value) !== want) el.value = want;
      },
      disabled(d) {
        if (!this.tom) return;
        if (d) this.tom.disable();
        else this.tom.enable();
      },
      options: {
        deep: true,
        flush: "post",
        handler(newOpts) {
          const nextSig = sortedSig((newOpts || []).map((o) => o.value));
          if (nextSig === this._optionsSig) return;
          this._optionsSig = nextSig;
          this.destroyTom();
          this.$nextTick(() => this.initTom());
        }
      }
    }
  };
})();
