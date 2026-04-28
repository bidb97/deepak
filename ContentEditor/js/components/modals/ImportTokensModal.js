window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.ImportTokensModal = {
    props: [
        'show', 'importSubcategory', 'fileHasSubcategories',
        'importSubcategoryOptions', 'massImportJson'
    ],
    emits: ['update:import-subcategory', 'update:mass-import-json', 'close', 'apply'],
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-2xl rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">Массовый импорт токенов (JSON)</h3>
                <p class="text-sm text-gray-500">Введите строку в формате JSON:</p>
                <div class="text-xs text-gray-400 mb-3 mt-1 space-y-1">
                    <span class="block font-mono select-all">{ "en": ["hello", "world"] }</span>
                    <span class="block font-mono select-all">{ "ru": [{ "base": "капуста", "forms": { "acc": "капусту", "gen": "капусты" } }] }</span>
                    <span class="block font-mono select-all">{ "ru": [{ "base": "вопрос" }], "en": ["question"] }</span>
                </div>
                <div class="mb-3">
                    <div v-if="fileHasSubcategories">
                        <label class="text-sm font-semibold">Подкатегория</label>
                        <select :value="importSubcategory" @change="$emit('update:import-subcategory', $event.target.value)" :disabled="!fileHasSubcategories" class="w-full border rounded px-2 py-1 mt-1 disabled:opacity-50">
                            <option
                                v-for="sub in importSubcategoryOptions"
                                :key="typeof sub === 'string' ? sub : sub.value"
                                :value="typeof sub === 'string' ? sub : sub.value"
                            >{{ typeof sub === 'string' ? sub : sub.label }}</option>
                        </select>
                    </div>
                </div>
                <textarea :value="massImportJson" @input="$emit('update:mass-import-json', $event.target.value)" class="w-full h-64 border rounded px-3 py-2 font-mono text-sm" ></textarea>
                <div class="flex justify-end gap-2 mt-3">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Отмена</button>
                    <button @click="$emit('apply')" class="px-4 py-2 rounded bg-purple-600 text-white">Импортировать</button>
                </div>
            </div>
        </div>
    `
};
