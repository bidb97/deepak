window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.AddTokenModal = {
    components: {
        TokenFormsFields: window.ContentEditorComponents.TokenFormsFields
    },
    props: ['show', 'languages', 'tokenDraft'],
    emits: ['update-token-value', 'close', 'create'],
    data() {
        return {
            showForms: false
        };
    },
    methods: {
        getBaseValue(lang) {
            const raw = this.tokenDraft?.[lang];
            if (typeof raw === 'string') return raw;
            if (raw && typeof raw === 'object' && typeof raw.base === 'string') return raw.base;
            return '';
        },
        getFormValue(lang, formKey) {
            const raw = this.tokenDraft?.[lang];
            if (raw && typeof raw === 'object' && raw.forms && typeof raw.forms === 'object') {
                return raw.forms[formKey] || '';
            }
            return '';
        },
        getPluralizationValue(lang, pluralKey) {
            const raw = this.tokenDraft?.[lang];
            if (raw && typeof raw === 'object' && raw.pluralization && typeof raw.pluralization === 'object') {
                return raw.pluralization[pluralKey] || '';
            }
            return '';
        },
        updateBaseValue(lang, value) {
            this.$emit('update-token-value', { lang, value, field: 'base' });
        },
        updateForm(lang, _tokenId, formKey, value) {
            this.$emit('update-token-value', { lang, value, field: 'form', formKey });
        },
        updatePluralization(lang, _tokenId, pluralKey, value) {
            this.$emit('update-token-value', { lang, value, field: 'pluralization', pluralKey });
        },
        toggleForms() {
            this.showForms = !this.showForms;
        },
        getModalFormValue(lang, _tokenId, formKey) {
            return this.getFormValue(lang, formKey);
        },
        getModalPluralizationValue(lang, _tokenId, pluralKey) {
            return this.getPluralizationValue(lang, pluralKey);
        }
    },
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-xl rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">Добавить токен</h3>
                <p class="text-sm text-gray-500 mb-3">Заполни переводы для доступных языков.</p>
                <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    <div v-for="lang in languages" :key="lang" class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-400 uppercase w-8 text-right">{{ lang }}</span>
                        <input
                            type="text"
                            :value="getBaseValue(lang)"
                            @input="updateBaseValue(lang, $event.target.value)"
                            :placeholder="'Перевод (' + lang + ')'"
                            class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        >
                    </div>
                    <token-forms-fields
                        :languages="languages"
                        :token-id="'new'"
                        :is-open="showForms"
                        :toggle-handler="toggleForms"
                        :value-getter="getModalFormValue"
                        :update-handler="updateForm"
                        :pluralization-value-getter="getModalPluralizationValue"
                        :pluralization-update-handler="updatePluralization"
                    ></token-forms-fields>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Отмена</button>
                    <button @click="$emit('create')" class="px-4 py-2 rounded bg-green-600 text-white">Создать</button>
                </div>
            </div>
        </div>
    `
};
