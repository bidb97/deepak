window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.AddTokenModal = {
    props: ['show', 'languages', 'tokenDraft'],
    emits: ['update-token-value', 'close', 'create'],
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
                            :value="tokenDraft?.[lang] || ''"
                            @input="$emit('update-token-value', { lang, value: $event.target.value })"
                            :placeholder="'Перевод (' + lang + ')'"
                            class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        >
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Отмена</button>
                    <button @click="$emit('create')" class="px-4 py-2 rounded bg-green-600 text-white">Создать</button>
                </div>
            </div>
        </div>
    `
};
