window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.LanguagesModal = {
    props: ['show', 'languages', 'newLanguageCode', 'isLanguageVisible'],
    emits: ['close', 'toggle-language', 'update:new-language-code', 'add-language'],
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-xl rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">Языки интерфейса токенов</h3>
                <p class="text-sm text-gray-500 mb-3">Выбери языки для отображения и редактирования в редакторе. Настройка сохраняется глобально.</p>
                <div class="space-y-2 mb-4">
                    <label v-for="lang in languages" :key="lang" class="flex items-center gap-2">
                        <input type="checkbox" :checked="isLanguageVisible(lang)" @change="$emit('toggle-language', lang)">
                        <span class="uppercase text-sm font-semibold">{{ lang }}</span>
                    </label>
                </div>
                <div class="border-t pt-3">
                    <label class="text-sm font-semibold">Добавить новый язык</label>
                    <div class="flex items-center gap-2 mt-1">
                        <input type="text" :value="newLanguageCode" @input="$emit('update:new-language-code', $event.target.value)" placeholder="например, de" class="border rounded px-2 py-1 text-sm w-40">
                        <button @click="$emit('add-language')" class="px-3 py-1 rounded bg-blue-600 text-white text-sm">Добавить язык</button>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Готово</button>
                </div>
            </div>
        </div>
    `
};
