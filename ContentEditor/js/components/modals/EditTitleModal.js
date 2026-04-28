window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.EditTitleModal = {
    props: ['show', 'heading', 'languages', 'values'],
    emits: ['update:value', 'close', 'save'],
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-lg rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">{{ heading || 'Редактировать заголовок' }}</h3>
                <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    <div v-for="lang in languages" :key="lang" class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-400 uppercase w-8 text-right">{{ lang }}</span>
                        <input
                            :value="values?.[lang] || ''"
                            @input="$emit('update:value', { lang, value: $event.target.value })"
                            type="text"
                            :placeholder="'Title (' + lang + ')'"
                            class="w-full border rounded px-2 py-1"
                        >
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Отмена</button>
                    <button @click="$emit('save')" class="px-4 py-2 rounded bg-blue-600 text-white">Сохранить</button>
                </div>
            </div>
        </div>
    `
};
