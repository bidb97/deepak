window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.TokensPanel = {
    components: {
        IconActionButton: window.ContentEditorComponents.IconActionButton
    },
    props: [
        'tokenFiles', 'selectedFile', 'saveMessage', 'visualDataEntries', 'fileHasSubcategories',
        'translations', 'visibleLanguageList', 'subcategoryMeta', 'primaryLanguage'
    ],
    data() {
        return {
            activeSubcategoryByCategory: {}
        };
    },
    computed: {
        commonTokenFiles() {
            return (this.tokenFiles || []).filter((file) => (file.tokenScope || 'common') === 'common');
        },
        contextTokenFiles() {
            return (this.tokenFiles || []).filter((file) => (file.tokenScope || 'common') === 'context');
        }
    },
    methods: {
        getTokenBadgeValue(tokenId) {
            const ruValue = this.translations?.ru?.[tokenId];
            if (typeof ruValue === 'string' && ruValue.trim()) return ruValue;
            const enValue = this.translations?.en?.[tokenId];
            if (typeof enValue === 'string' && enValue.trim()) return enValue;
            return '—';
        },
        getSubcategoryTitle(subcategoryName) {
            const titleKey = this.subcategoryMeta?.[subcategoryName]?.title;
            if (!titleKey) return subcategoryName;
            return this.translations?.[this.primaryLanguage]?.[titleKey] || titleKey;
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
        }
    },
    template: `
        <div class="h-full flex flex-col">
            <div class="flex justify-between mb-4">
                <h2 class="text-lg font-semibold">Структура токенов (Content/Tokens/)</h2>
                <button @click="$emit('open-create-group')" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm shadow">
                    + Создать новую группу
                </button>
            </div>
            <div class="grid grid-cols-3 gap-6 flex-1">
                <div class="col-span-1 bg-white p-4 rounded shadow border border-gray-200">
                    <h3 class="font-bold text-gray-700 mb-3 border-b pb-2">Группы токенов</h3>
                    <div class="text-xs uppercase tracking-wide text-gray-400 mt-2 mb-2">Общие</div>
                    <ul class="space-y-1 mb-3">
                        <li
                            v-for="file in commonTokenFiles"
                            :key="file.name"
                            @click="$emit('select-file', file)"
                            :class="[selectedFile?.name === file.name ? 'token-file-row-active' : 'token-file-row-idle', { 'token-row-inactive': !isFileActive(file) }]"
                            class="p-2 rounded border cursor-pointer flex justify-between items-center transition-colors token-file-row"
                        >
                            <span class="text-sm text-gray-700">{{ file.displayName }}</span>
                            <div class="flex items-center gap-1">
                                <icon-action-button
                                    :icon="isFileActive(file) ? 'eye' : 'eye-off'"
                                    :title="isFileActive(file) ? 'Скрыть группу в Unity (inactive)' : 'Сделать группу активной'"
                                    variant="neutral"
                                    @click="$emit('toggle-file-active', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="edit"
                                    title="Редактировать заголовок"
                                    variant="primary"
                                    @click="$emit('open-edit-group-title', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="clear"
                                    title="Очистить токены группы"
                                    variant="warning"
                                    @click="$emit('clear-file', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="trash"
                                    title="Удалить файл"
                                    variant="danger"
                                    @click="$emit('delete-file', file)"
                                ></icon-action-button>
                            </div>
                        </li>
                        <li v-if="commonTokenFiles.length === 0" class="text-xs text-gray-400 italic p-2">Пусто</li>
                    </ul>
                    <div class="text-xs uppercase tracking-wide text-gray-400 mt-3 mb-2">Контекст токены</div>
                    <ul class="space-y-1">
                        <li
                            v-for="file in contextTokenFiles"
                            :key="file.name"
                            @click="$emit('select-file', file)"
                            :class="[selectedFile?.name === file.name ? 'token-file-row-active' : 'token-file-row-idle', { 'token-row-inactive': !isFileActive(file) }]"
                            class="p-2 rounded border cursor-pointer flex justify-between items-center transition-colors token-file-row"
                        >
                            <span class="text-sm text-gray-700">{{ file.displayName }}</span>
                            <div class="flex items-center gap-1">
                                <icon-action-button
                                    :icon="isFileActive(file) ? 'eye' : 'eye-off'"
                                    :title="isFileActive(file) ? 'Скрыть группу в Unity (inactive)' : 'Сделать группу активной'"
                                    variant="neutral"
                                    @click="$emit('toggle-file-active', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="edit"
                                    title="Редактировать заголовок"
                                    variant="primary"
                                    @click="$emit('open-edit-group-title', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="clear"
                                    title="Очистить токены группы"
                                    variant="warning"
                                    @click="$emit('clear-file', file)"
                                ></icon-action-button>
                                <icon-action-button
                                    icon="trash"
                                    title="Удалить файл"
                                    variant="danger"
                                    @click="$emit('delete-file', file)"
                                ></icon-action-button>
                            </div>
                        </li>
                        <li v-if="contextTokenFiles.length === 0" class="text-xs text-gray-400 italic p-2">Пусто</li>
                        <li v-if="tokenFiles.length === 0" class="text-sm text-red-400 italic p-2">Папка Content/Tokens пуста или не найдена.</li>
                    </ul>
                </div>
                <div class="col-span-2 bg-white p-4 rounded shadow border border-gray-200 flex flex-col h-full min-h-[500px]">
                    <div v-if="selectedFile" class="h-full flex flex-col">
                        <div class="flex justify-between items-center mb-3 border-b pb-2">
                            <h3 class="font-bold text-gray-700">{{ selectedFile.displayName }}</h3>
                            <div class="flex items-center gap-3">
                                <button @click="$emit('open-import')" class="px-3 py-1 rounded text-sm border border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-300 transition">Массовый импорт</button>
                                <span v-if="saveMessage" class="text-green-600 text-sm font-semibold">{{ saveMessage }}</span>
                                <button @click="$emit('save-file')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm shadow transition">Сохранить</button>
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
                                        <div v-for="(token, index) in subcategories[getActiveSubcategory(categoryName, subcategories)]" :key="index" :class="{ 'token-card-inactive': token.active === false || !isSelectedFileActive() || !isSubcategoryActive(getActiveSubcategory(categoryName, subcategories)) }" class="bg-white border border-gray-200 shadow-sm rounded p-3 relative w-full">
                                            <div class="absolute top-2 right-2 flex items-center gap-1">
                                                <icon-action-button
                                                    :icon="token.active === false ? 'eye-off' : 'eye'"
                                                    :title="token.active === false ? 'Сделать активным' : 'Скрыть в Unity (inactive)'"
                                                    variant="neutral"
                                                    @click="$emit('toggle-token-active', categoryName, getActiveSubcategory(categoryName, subcategories), index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="plus"
                                                    title="Добавить токен после"
                                                    variant="success"
                                                    @click="$emit('open-add-token', categoryName, getActiveSubcategory(categoryName, subcategories), index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="up"
                                                    title="Вверх"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, getActiveSubcategory(categoryName, subcategories), index, 'up')"
                                                    :disabled="index === 0"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="down"
                                                    title="Вниз"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, getActiveSubcategory(categoryName, subcategories), index, 'down')"
                                                    :disabled="index === subcategories[getActiveSubcategory(categoryName, subcategories)].length - 1"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="trash"
                                                    title="Удалить токен"
                                                    variant="danger"
                                                    @click="$emit('remove-token', categoryName, getActiveSubcategory(categoryName, subcategories), index)"
                                                ></icon-action-button>
                                            </div>
                                            <div class="mb-3 pr-6">
                                                <span class="token-badge font-bold text-sm px-2 py-1 rounded">{{ getTokenBadgeValue(token.id) }}</span>
                                            </div>
                                            <div class="space-y-2">
                                                <div v-for="lang in visibleLanguageList" :key="lang" class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-gray-400 uppercase w-6 text-right">{{ lang }}</span>
                                                    <input type="text" v-model="translations[lang][token.id]" :placeholder="'Перевод (' + lang + ')'" class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            v-if="(subcategories[getActiveSubcategory(categoryName, subcategories)] || []).length === 0"
                                            class="bg-white border border-gray-200 shadow-sm rounded p-3 w-full"
                                        >
                                            <button
                                                @click="$emit('open-add-token', categoryName, getActiveSubcategory(categoryName, subcategories), -1)"
                                                class="w-full px-3 py-2 rounded border border-dashed border-blue-300 text-blue-700 hover:bg-gray-100 transition-colors text-sm"
                                            >
                                                + Добавить первый токен
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="mb-4">
                                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3 w-full">
                                        <div v-for="(token, index) in subcategories.__flat || []" :key="index" :class="{ 'token-card-inactive': token.active === false || !isSelectedFileActive() }" class="bg-white border border-gray-200 shadow-sm rounded p-3 relative w-full">
                                            <div class="absolute top-2 right-2 flex items-center gap-1">
                                                <icon-action-button
                                                    :icon="token.active === false ? 'eye-off' : 'eye'"
                                                    :title="token.active === false ? 'Сделать активным' : 'Скрыть в Unity (inactive)'"
                                                    variant="neutral"
                                                    @click="$emit('toggle-token-active', categoryName, '__flat', index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="plus"
                                                    title="Добавить токен после"
                                                    variant="success"
                                                    @click="$emit('open-add-token', categoryName, '__flat', index)"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="up"
                                                    title="Вверх"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, '__flat', index, 'up')"
                                                    :disabled="index === 0"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="down"
                                                    title="Вниз"
                                                    variant="primary"
                                                    @click="$emit('move-token', categoryName, '__flat', index, 'down')"
                                                    :disabled="index === (subcategories.__flat || []).length - 1"
                                                ></icon-action-button>
                                                <icon-action-button
                                                    icon="trash"
                                                    title="Удалить токен"
                                                    variant="danger"
                                                    @click="$emit('remove-token', categoryName, '__flat', index)"
                                                ></icon-action-button>
                                            </div>
                                            <div class="mb-3 pr-6">
                                                <span class="token-badge font-bold text-sm px-2 py-1 rounded">{{ getTokenBadgeValue(token.id) }}</span>
                                            </div>
                                            <div class="space-y-2">
                                                <div v-for="lang in visibleLanguageList" :key="lang" class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-gray-400 uppercase w-6 text-right">{{ lang }}</span>
                                                    <input type="text" v-model="translations[lang][token.id]" :placeholder="'Перевод (' + lang + ')'" class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            v-if="(subcategories.__flat || []).length === 0"
                                            class="bg-white border border-gray-200 shadow-sm rounded p-3 w-full"
                                        >
                                            <button
                                                @click="$emit('open-add-token', categoryName, '__flat', -1)"
                                                class="w-full px-3 py-2 rounded border border-dashed border-blue-300 text-blue-700 hover:bg-gray-100 transition-colors text-sm"
                                            >
                                                + Добавить первый токен
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="h-full flex items-center justify-center text-gray-400">Выберите файл слева для редактирования</div>
                </div>
            </div>
        </div>
    `
};
