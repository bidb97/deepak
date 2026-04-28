window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.TokenFormsFields = {
    props: [
        'languages',
        'isOpen',
        'tokenId',
        'valueGetter',
        'updateHandler',
        'pluralizationValueGetter',
        'pluralizationUpdateHandler',
        'toggleHandler'
    ],
    data() {
        return {
            formLanguages: {
                en: {
                    title: 'EN формы',
                    fields: [
                        { key: 'past', label: 'Past' },
                        { key: 'gerund', label: 'Gerund' },
                        { key: 'participle', label: 'Participle' },
                        { key: 'third_person', label: '3rd person' }
                    ]
                },
                ru: {
                    title: 'RU формы',
                    fields: [
                        { key: 'nom', label: 'И.п. (кто? что?)' },
                        { key: 'gen', label: 'Р.п. (кого? чего?)' },
                        { key: 'dat', label: 'Д.п. (кому? чему?)' },
                        { key: 'acc', label: 'В.п. (кого? что?)' },
                        { key: 'ins', label: 'Т.п. (кем? чем?)' },
                        { key: 'prep', label: 'П.п. (о ком? о чём?)' }
                    ]
                }
            }
        };
    },
    computed: {
        visibleFormLanguages() {
            return (this.languages || []).filter((lang) => !!this.formLanguages[lang]);
        },
        pluralizationByLanguage() {
            return {
                en: {
                    title: 'Множественные формы',
                    fields: [
                        { key: 'one', label: 'Ед. число (1)' },
                        { key: 'many', label: 'Мн. число (0, 2+)' }
                    ]
                },
                ru: {
                    title: 'Множественные формы',
                    fields: [
                        { key: 'one', label: 'Ед. число (1)' },
                        { key: 'few', label: 'Неск. (2-4)' },
                        { key: 'many', label: 'Мн. число (0, 5+)' }
                    ]
                }
            };
        }
    },
    methods: {
        getConfig(lang) {
            return this.formLanguages[lang];
        },
        getValue(lang, formKey) {
            if (typeof this.valueGetter !== 'function') return '';
            return this.valueGetter(lang, this.tokenId, formKey) || '';
        },
        updateValue(lang, formKey, value) {
            if (typeof this.updateHandler !== 'function') return;
            this.updateHandler(lang, this.tokenId, formKey, value);
        },
        getPluralizationConfig(lang) {
            return this.pluralizationByLanguage[lang] || null;
        },
        getPluralizationValue(lang, pluralKey) {
            if (typeof this.pluralizationValueGetter !== 'function') return '';
            return this.pluralizationValueGetter(lang, this.tokenId, pluralKey) || '';
        },
        updatePluralizationValue(lang, pluralKey, value) {
            if (typeof this.pluralizationUpdateHandler !== 'function') return;
            this.pluralizationUpdateHandler(lang, this.tokenId, pluralKey, value);
        }
    },
    template: `
        <div>
            <div v-if="visibleFormLanguages.length" class="pt-1">
                <button @click="toggleHandler(tokenId)" type="button" class="text-xs font-semibold text-gray-400 hover:text-gray-300 transition">
                    {{ isOpen ? 'Скрыть формы' : 'Показать формы' }}
                </button>
            </div>
            <fieldset
                v-for="lang in visibleFormLanguages"
                :key="'shared-forms-' + lang + '-' + (tokenId || 'new')"
                v-if="isOpen"
                class="pt-1 border border-gray-300 rounded px-2 pb-2 mt-1"
            >
                <legend class="text-[11px] tracking-wide text-gray-400 px-1">{{ getConfig(lang).title }}</legend>
                <div class="grid grid-cols-2 xl:grid-cols-3 gap-2 mt-1">
                    <label
                        v-for="field in getConfig(lang).fields"
                        :key="'shared-' + lang + '-' + (tokenId || 'new') + '-' + field.key"
                        class="text-[11px] text-gray-400 flex flex-col gap-1"
                    >{{ field.label }}<input :value="getValue(lang, field.key)" @input="updateValue(lang, field.key, $event.target.value)" type="text" class="border border-gray-300 rounded px-2 py-1 text-xs"></label>
                </div>
            </fieldset>
            <fieldset
                v-for="lang in visibleFormLanguages.filter((langCode) => !!getPluralizationConfig(langCode))"
                :key="'shared-pluralization-' + lang + '-' + (tokenId || 'new')"
                v-if="isOpen"
                class="pt-1 border border-gray-300 rounded px-2 pb-2 mt-2"
            >
                <legend class="text-[11px] tracking-wide text-gray-400 px-1">{{ lang.toUpperCase() }} {{ getPluralizationConfig(lang).title }}</legend>
                <div class="grid grid-cols-2 xl:grid-cols-3 gap-2 mt-1">
                    <label
                        v-for="field in getPluralizationConfig(lang).fields"
                        :key="'shared-pluralization-field-' + lang + '-' + (tokenId || 'new') + '-' + field.key"
                        class="text-[11px] text-gray-400 flex flex-col gap-1"
                    >{{ field.label }}<input :value="getPluralizationValue(lang, field.key)" @input="updatePluralizationValue(lang, field.key, $event.target.value)" type="text" class="border border-gray-300 rounded px-2 py-1 text-xs"></label>
                </div>
            </fieldset>
        </div>
    `
};
