window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.TokensPanel = {
    components: {
        IconActionButton: window.ContentEditorComponents.IconActionButton,
        TokenFormsFields: window.ContentEditorComponents.TokenFormsFields
    },
    props: [
        'tokenFiles', 'selectedFile', 'saveMessage', 'visualDataEntries', 'fileHasSubcategories',
        'translations', 'visibleLanguageList', 'subcategoryMeta', 'primaryLanguage'
    ],
    data() {
        return {
            activeSubcategoryByCategory: {},
            formsVisibilityByToken: {},
            searchQuery: '',
            filterGroupType: 'all',
            searchGroupQuery: ''
        };
    },
    computed: {
        filteredTokenFiles() {
            let list = this.tokenFiles || [];
            if (this.filterGroupType === 'common') {
                list = list.filter(f => (f.tokenScope || 'common') === 'common');
            } else if (this.filterGroupType === 'context') {
                list = list.filter(f => (f.tokenScope || 'common') === 'context');
            }

            if (this.searchGroupQuery.trim()) {
                const q = this.searchGroupQuery.toLowerCase();
                list = list.filter(f => 
                    f.displayName.toLowerCase().includes(q) || 
                    f.name.toLowerCase().includes(q)
                );
            }
            return list;
        }
    },
    methods: {
        getFormsVisibilityKey(tokenId) {
            return `${tokenId}::forms`;
        },
        isFormsBlockOpen(tokenId) {
            const key = this.getFormsVisibilityKey(tokenId);
            return this.formsVisibilityByToken[key] === true;
        },
        toggleFormsBlock(tokenId) {
            const key = this.getFormsVisibilityKey(tokenId);
            this.formsVisibilityByToken = {
                ...this.formsVisibilityByToken,
                [key]: !this.formsVisibilityByToken[key]
            };
        },
        normalizeTranslationEntry(lang, tokenId) {
            this.translations[lang] = this.translations[lang] || {};
            const raw = this.translations[lang][tokenId];
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                return {
                    base: typeof raw.base === 'string' ? raw.base : '',
                    forms: (raw.forms && typeof raw.forms === 'object') ? { ...raw.forms } : {},
                    pluralization: (raw.pluralization && typeof raw.pluralization === 'object') ? { ...raw.pluralization } : {}
                };
            }
            if (typeof raw === 'string') {
                return { base: raw, forms: {}, pluralization: {} };
            }
            return { base: '', forms: {}, pluralization: {} };
        },
        getTokenBaseValue(lang, tokenId) {
            return this.normalizeTranslationEntry(lang, tokenId).base || '';
        },
        updateTokenBaseValue(lang, tokenId, value) {
            this.translations[lang] = this.translations[lang] || {};
            const entry = this.normalizeTranslationEntry(lang, tokenId);
            this.translations[lang][tokenId] = { ...entry, base: value };
        },
        getFormValue(lang, tokenId, formKey) {
            return this.normalizeTranslationEntry(lang, tokenId).forms?.[formKey] || '';
        },
        updateFormValue(lang, tokenId, formKey, value) {
            this.translations[lang] = this.translations[lang] || {};
            const entry = this.normalizeTranslationEntry(lang, tokenId);
            this.translations[lang][tokenId] = {
                ...entry,
                forms: {
                    ...(entry.forms || {}),
                    [formKey]: value
                }
            };
        },
        getPluralizationValue(lang, tokenId, pluralKey) {
            return this.normalizeTranslationEntry(lang, tokenId).pluralization?.[pluralKey] || '';
        },
        updatePluralizationValue(lang, tokenId, pluralKey, value) {
            this.translations[lang] = this.translations[lang] || {};
            const entry = this.normalizeTranslationEntry(lang, tokenId);
            this.translations[lang][tokenId] = {
                ...entry,
                pluralization: {
                    ...(entry.pluralization || {}),
                    [pluralKey]: value
                }
            };
        },
        getTokenBadgeValue(tokenId) {
            const ruValue = this.getTokenBaseValue('ru', tokenId);
            if (typeof ruValue === 'string' && ruValue.trim()) return ruValue;
            const enValue = this.getTokenBaseValue('en', tokenId);
            if (typeof enValue === 'string' && enValue.trim()) return enValue;
            return '—';
        },
        getSubcategoryTitle(subcategoryName) {
            const titleKey = this.subcategoryMeta?.[subcategoryName]?.title;
            if (!titleKey) return subcategoryName;
            const raw = this.translations?.[this.primaryLanguage]?.[titleKey];
            if (typeof raw === 'string' && raw.trim()) return raw;
            if (raw && typeof raw === 'object' && typeof raw.base === 'string' && raw.base.trim()) return raw.base;
            return titleKey;
        },
        isFileActive(file) {
            return file?.active !== false;
        },
        isSubcategoryActive(subcategoryName) {
            return this.subcategoryMeta?.[subcategoryName]?.active !== false;
        },
        isSelectedFileActive() {
            return this.selectedFile?.active !== false;
        },
        getActiveSubcategory(categoryName, subcategories) {
            const keys = Object.keys(subcategories || {});
            if (!keys.length) return '';
            const active = this.activeSubcategoryByCategory[categoryName];
            if (active && keys.includes(active)) return active;
            this.activeSubcategoryByCategory[categoryName] = keys[0];
            return keys[0];
        },
        setActiveSubcategory(categoryName, subcategoryName) {
            this.activeSubcategoryByCategory[categoryName] = subcategoryName;
        },
        getTokenFormValue(lang, tokenId, formKey) {
            return this.getFormValue(lang, tokenId, formKey);
        },
        updateTokenFormValue(lang, tokenId, formKey, value) {
            this.updateFormValue(lang, tokenId, formKey, value);
        },
        getTokenPluralizationValue(lang, tokenId, pluralKey) {
            return this.getPluralizationValue(lang, tokenId, pluralKey);
        },
        updateTokenPluralizationValue(lang, tokenId, pluralKey, value) {
            this.updatePluralizationValue(lang, tokenId, pluralKey, value);
        },
        normalizeSearchText(value) {
            return String(value || '').trim().toLowerCase();
        },
        getTokenSearchText(token) {
            if (!token || typeof token.id !== 'string') return '';
            const chunks = [token.id];
            const langs = Object.keys(this.translations || {});
            for (const lang of langs) {
                const raw = this.translations?.[lang]?.[token.id];
                if (typeof raw === 'string') {
                    chunks.push(raw);
                    continue;
                }
                if (raw && typeof raw === 'object') {
                    if (typeof raw.base === 'string') chunks.push(raw.base);
                    if (raw.forms && typeof raw.forms === 'object') {
                        chunks.push(...Object.values(raw.forms));
                    }
                    if (raw.pluralization && typeof raw.pluralization === 'object') {
                        chunks.push(...Object.values(raw.pluralization));
                    }
                }
            }
            return this.normalizeSearchText(chunks.join(' '));
        },
        getFilteredTokenEntries(tokenList) {
            const list = Array.isArray(tokenList) ? tokenList : [];
            const query = this.normalizeSearchText(this.searchQuery);
            const indexed = list.map((token, index) => ({ token, index }));
            if (!query) return indexed;
            return indexed.filter(({ token }) => this.getTokenSearchText(token).includes(query));
        }
    },
    template: `
        <div class="h-full flex flex-col">
            <div class="flex justify-between mb-4 items-center shrink-0">
                <h2 class="text-lg font-semibold">Структура токенов (Content/Tokens/*.json)</h2>
                <span v-if="saveMessage" class="text-sm text-green-600 font-medium transition-opacity duration-300">
                    {{ saveMessage }}
                </span>
            </div>
            <div class="flex-1 flex gap-4 overflow-hidden">
                <!-- Левая колонка -->
                <div class="w-1/3 bg-white p-4 rounded shadow border border-gray-200 flex flex-col">
                    <div class="flex gap-2 mb-3 shrink-0 border-b border-gray-100 pb-3">
                        <button @click="filterGroupType = 'all'" :class="{'bg-gray-800 text-white': filterGroupType === 'all', 'bg-gray-100 text-gray-700': filterGroupType !== 'all'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Все</button>
                        <button @click="filterGroupType = 'common'" :class="{'bg-[#6a5cff] text-white': filterGroupType === 'common', 'bg-gray-100 text-gray-700': filterGroupType !== 'common'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Общие</button>
                        <button @click="filterGroupType = 'context'" :class="{'bg-[#f59e0b] text-white': filterGroupType === 'context', 'bg-gray-100 text-gray-700': filterGroupType !== 'context'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Контекст</button>
                    </div>
                    
                    <div class="mb-3 shrink-0">
                        <input type="text" v-model="searchGroupQuery" placeholder="Поиск группы или файла..." class="w-full text-sm p-2 rounded border focus:outline-none transition">
                    </div>
                    
                    <ul class="space-y-2 flex-1 overflow-y-auto pr-1">
                        <li 
                            v-for="file in filteredTokenFiles" 
                            :key="file.name" 
                            @click="$emit('select-file', file)"
                            :class="{'border-[#6a5cff] bg-[#6a5cff] bg-opacity-10': selectedFile?.name === file.name, 'border-gray-200 hover:border-gray-300': selectedFile?.name !== file.name, 'opacity-50': !isFileActive(file)}"
                            class="p-2 bg-gray-50 rounded border cursor-pointer transition flex flex-col"
                        >
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-semibold text-sm truncate" :title="file.displayName">
                                    {{ file.displayName }}
                                </span>
                                <span class="text-[10px] mb-1 uppercase font-bold px-1.5 py-0.5 rounded shrink-0" :class="(file.tokenScope || 'common') === 'common' ? 'bg-[rgba(106,92,255,0.16)] text-[#6a5cff] border border-[rgba(106,92,255,0.42)]' : 'bg-[rgba(245,158,11,0.16)] text-[#f59e0b] border border-[rgba(245,158,11,0.42)]'">
                                    {{ (file.tokenScope || 'common') === 'common' ? 'ОБЩИЕ' : 'КОНТЕКСТ' }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400 truncate max-w-[100px]" :title="file.name">{{ file.name }}</span>
                                <div class="flex items-center gap-1 shrink-0">
                                    <icon-action-button
                                        :icon="isFileActive(file) ? 'eye' : 'eye-off'"
                                        :title="isFileActive(file) ? 'Скрыть' : 'Сделать активной'"
                                        variant="neutral"
                                        @click="$emit('toggle-file-active', file)"
                                    ></icon-action-button>
                                    <icon-action-button
                                        icon="edit"
                                        title="Заголовок"
                                        variant="primary"
                                        @click="$emit('open-edit-group-title', file)"
                                    ></icon-action-button>
                                    <icon-action-button
                                        icon="clear"
                                        title="Очистить"
                                        variant="warning"
                                        @click="$emit('clear-file', file)"
                                    ></icon-action-button>
                                    <icon-action-button
                                        icon="trash"
                                        title="Удалить"
                                        variant="danger"
                                        @click="$emit('delete-file', file)"
                                    ></icon-action-button>
                                </div>
                            </div>
                        </li>
                        <li v-if="filteredTokenFiles.length === 0" class="text-sm text-gray-400 italic text-center py-4">Группы не найдены.</li>
                    </ul>
                    
                    <div class="mt-4 shrink-0 pt-3 border-t border-gray-100">
                        <button @click="$emit('open-create-group')" class="w-full py-2 bg-gray-800 text-white font-medium rounded text-sm hover:bg-gray-700 transition flex items-center justify-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Новая группа
                        </button>
                    </div>
                </div>
                
                <!-- Правая колонка -->
                <div class="w-2/3 bg-white p-5 rounded shadow border border-gray-200 flex flex-col overflow-hidden">
                    <div v-if="selectedFile" class="h-full flex flex-col">
                        <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
                            <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">
                                Группа: 
                                <span class="text-sm font-normal text-gray-500">{{ selectedFile.displayName }}</span>
                            </h3>
                            <div class="flex gap-2 items-center">
                                <div class="relative w-48 mr-2">
                                    <input
                                        type="text"
                                        :value="searchQuery"
                                        @input="searchQuery = $event.target.value"
                                        placeholder="Поиск токена..."
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 pr-8 text-sm focus:outline-none focus:border-[#6a5cff]"
                                    >
                                    <button
                                        v-if="searchQuery"
                                        @click="searchQuery = ''"
                                        type="button"
                                        title="Очистить поиск"
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold transition"
                                    >
                                        ×
                                    </button>
                                </div>
                                <button @click="$emit('open-import')" class="px-3 py-1.5 bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition">Импорт</button>
                                <button @click="$emit('save-file')" class="bg-[#6a5cff] hover:bg-[#7f73ff] text-white text-sm font-medium px-4 py-1.5 rounded transition shadow-sm flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                    Сохранить
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto pr-2 space-y-6">
                            <div v-for="(subcategories, categoryName) in visualDataEntries" :key="categoryName" class="bg-gray-50 border rounded p-4">
                                <div v-if="fileHasSubcategories" class="mb-4 ml-4">
                                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                                        <div
                                            v-for="subName in Object.keys(subcategories)"
                                            :key="subName"
                                            class="inline-flex items-center gap-1 px-1 py-1 rounded border text-sm transition-colors"
                                            :class="[getActiveSubcategory(categoryName, subcategories) === subName ? 'subcategory-tab-active' : 'subcategory-tab-idle', { 'token-row-inactive': !isSubcategoryActive(subName) }]"
                                        >
                                            <button
                                                @click="setActiveSubcategory(categoryName, subName)"
                                                class="px-2 py-0.5 rounded"
                                            >{{ getSubcategoryTitle(subName) }}</button>
                                            <icon-action-button
                                                :icon="isSubcategoryActive(subName) ? 'eye' : 'eye-off'"
                                                :title="isSubcategoryActive(subName) ? 'Скрыть подгруппу в Unity (inactive)' : 'Сделать подгруппу активной'"
                                                variant="neutral"
                                                @click="$emit('toggle-subcategory-active', categoryName, subName)"
                                            ></icon-action-button>
                                            <icon-action-button
                                                icon="edit"
                                                title="Редактировать заголовок группы"
                                                variant="primary"
                                                @click="$emit('open-edit-subcategory-title', categoryName, subName)"
                                            ></icon-action-button>
                                            <icon-action-button
                                                icon="clear"
                                                title="Очистить токены подгруппы"
                                                variant="warning"
                                                @click="$emit('clear-subcategory', categoryName, subName)"
                                            ></icon-action-button>
                                            <icon-action-button
                                                icon="trash"
                                                title="Удалить группу"
                                                variant="danger"
                                                @click="$emit('delete-subcategory', categoryName, subName)"
                                            ></icon-action-button>
                                        </div>
                                        <button
                                            @click="$emit('open-create-subcategory', categoryName)"
                                            class="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition-colors"
                                        >
                                            + Добавить группу
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3 w-full">
                                        <div v-for="entry in getFilteredTokenEntries(subcategories[getActiveSubcategory(categoryName, subcategories)])" :key="entry.token.id + '-' + entry.index" :class="{ 'token-card-inactive': entry.token.active === false || !isSelectedFileActive() || !isSubcategoryActive(getActiveSubcategory(categoryName, subcategories)) }" class="bg-white border border-gray-200 shadow-sm rounded p-3 relative w-full">
                                            <div class="absolute top-2 right-2 flex items-center gap-1">
                                                <icon-action-button
                                                    :icon="entry.token.active === false ? 'eye-off' : 'eye'"
                                                    :title="entry.token.active === false ? 'Сделать активным' : 'Скрыть в Unity (inactive)'"
                                                    variant="neutral"
                                                    @click="$emit('toggle-token-active', categoryName, getActiveSubcategory(categoryName, subcategories), entry.index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="plus"
                                                    title="Добавить токен после"
                                                    variant="success"
                                                    @click="$emit('open-add-token', categoryName, getActiveSubcategory(categoryName, subcategories), entry.index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="up"
                                                    title="Вверх"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, getActiveSubcategory(categoryName, subcategories), entry.index, 'up')"
                                                    :disabled="entry.index === 0"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="down"
                                                    title="Вниз"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, getActiveSubcategory(categoryName, subcategories), entry.index, 'down')"
                                                    :disabled="entry.index === subcategories[getActiveSubcategory(categoryName, subcategories)].length - 1"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="trash"
                                                    title="Удалить токен"
                                                    variant="danger"
                                                    @click="$emit('remove-token', categoryName, getActiveSubcategory(categoryName, subcategories), entry.index)"
                                                ></icon-action-button>
                                            </div>
                                            <div class="mb-3 pr-6">
                                                <span class="token-badge font-bold text-sm px-2 py-1 rounded">{{ getTokenBadgeValue(entry.token.id) }}</span>
                                            </div>
                                            <div class="space-y-2">
                                                <div v-for="lang in visibleLanguageList" :key="lang" class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-gray-400 uppercase w-6 text-right">{{ lang }}</span>
                                                    <input
                                                        type="text"
                                                        :value="getTokenBaseValue(lang, entry.token.id)"
                                                        @input="updateTokenBaseValue(lang, entry.token.id, $event.target.value)"
                                                        :placeholder="'Перевод (' + lang + ')'"
                                                        class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-[#6a5cff]"
                                                    >
                                                </div>
                                                <token-forms-fields
                                                    :languages="visibleLanguageList"
                                                    :token-id="entry.token.id"
                                                    :is-open="isFormsBlockOpen(entry.token.id)"
                                                    :toggle-handler="toggleFormsBlock"
                                                    :value-getter="getTokenFormValue"
                                                    :update-handler="updateTokenFormValue"
                                                    :pluralization-value-getter="getTokenPluralizationValue"
                                                    :pluralization-update-handler="updateTokenPluralizationValue"
                                                ></token-forms-fields>
                                            </div>
                                        </div>
                                        <div
                                            v-if="(subcategories[getActiveSubcategory(categoryName, subcategories)] || []).length === 0"
                                            class="bg-white border border-gray-200 shadow-sm rounded p-3 w-full"
                                        >
                                            <button
                                                @click="$emit('open-add-token', categoryName, getActiveSubcategory(categoryName, subcategories), -1)"
                                                class="w-full px-3 py-2 rounded border border-dashed border-[#6a5cff] border-opacity-50 text-[#6a5cff] hover:bg-gray-100 transition-colors text-sm"
                                            >
                                                + Добавить первый токен
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="mb-4">
                                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3 w-full">
                                        <div v-for="entry in getFilteredTokenEntries(subcategories.__flat || [])" :key="entry.token.id + '-flat-' + entry.index" :class="{ 'token-card-inactive': entry.token.active === false || !isSelectedFileActive() }" class="bg-white border border-gray-200 shadow-sm rounded p-3 relative w-full">
                                            <div class="absolute top-2 right-2 flex items-center gap-1">
                                                <icon-action-button
                                                    :icon="entry.token.active === false ? 'eye-off' : 'eye'"
                                                    :title="entry.token.active === false ? 'Сделать активным' : 'Скрыть в Unity (inactive)'"
                                                    variant="neutral"
                                                    @click="$emit('toggle-token-active', categoryName, '__flat', entry.index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="plus"
                                                    title="Добавить токен после"
                                                    variant="success"
                                                    @click="$emit('open-add-token', categoryName, '__flat', entry.index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="up"
                                                    title="Вверх"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, '__flat', entry.index, 'up')"
                                                    :disabled="entry.index === 0"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="down"
                                                    title="Вниз"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, '__flat', entry.index, 'down')"
                                                    :disabled="entry.index === (subcategories.__flat || []).length - 1"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="trash"
                                                    title="Удалить токен"
                                                    variant="danger"
                                                    @click="$emit('remove-token', categoryName, '__flat', entry.index)"
                                                ></icon-action-button>
                                            </div>
                                            <div class="mb-3 pr-6">
                                                <span class="token-badge font-bold text-sm px-2 py-1 rounded">{{ getTokenBadgeValue(entry.token.id) }}</span>
                                            </div>
                                            <div class="space-y-2">
                                                <div v-for="lang in visibleLanguageList" :key="lang" class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-gray-400 uppercase w-6 text-right">{{ lang }}</span>
                                                    <input
                                                        type="text"
                                                        :value="getTokenBaseValue(lang, entry.token.id)"
                                                        @input="updateTokenBaseValue(lang, entry.token.id, $event.target.value)"
                                                        :placeholder="'Перевод (' + lang + ')'"
                                                        class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-[#6a5cff]"
                                                    >
                                                </div>
                                                <token-forms-fields
                                                    :languages="visibleLanguageList"
                                                    :token-id="entry.token.id"
                                                    :is-open="isFormsBlockOpen(entry.token.id)"
                                                    :toggle-handler="toggleFormsBlock"
                                                    :value-getter="getTokenFormValue"
                                                    :update-handler="updateTokenFormValue"
                                                    :pluralization-value-getter="getTokenPluralizationValue"
                                                    :pluralization-update-handler="updateTokenPluralizationValue"
                                                ></token-forms-fields>
                                            </div>
                                        </div>
                                        <div
                                            v-if="(subcategories.__flat || []).length === 0"
                                            class="bg-white border border-gray-200 shadow-sm rounded p-3 w-full"
                                        >
                                            <button
                                                @click="$emit('open-add-token', categoryName, '__flat', -1)"
                                                class="w-full px-3 py-2 rounded border border-dashed border-[#6a5cff] border-opacity-50 text-[#6a5cff] hover:bg-gray-100 transition-colors text-sm"
                                            >
                                                + Добавить первый токен
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <p class="text-lg font-medium">Выберите группу токенов слева</p>
                        <p class="text-sm mt-1">или создайте новую</p>
                    </div>
                </div>
            </div>
        </div>
    `
};
