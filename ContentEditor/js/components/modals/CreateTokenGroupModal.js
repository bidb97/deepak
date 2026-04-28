window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.CreateTokenGroupModal = {
    props: [
        'show',
        'newGroupFileName',
        'newGroupTitle',
        'newGroupHasSubcategories',
        'newGroupTokenScope'
    ],
    emits: [
        'update:new-group-file-name',
        'update:new-group-title',
        'update:new-group-has-subcategories',
        'update:new-group-token-scope',
        'close',
        'create'
    ],
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-lg rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">Новая группа токенов</h3>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-semibold">Название файла</label>
                        <input :value="newGroupFileName" @input="$emit('update:new-group-file-name', $event.target.value)" type="text" placeholder="например, greetings" class="w-full border rounded px-2 py-1 mt-1">
                    </div>
                    <div>
                        <label class="text-sm font-semibold">Title</label>
                        <input :value="newGroupTitle" @input="$emit('update:new-group-title', $event.target.value)" type="text" placeholder="например, Приветствия" class="w-full border rounded px-2 py-1 mt-1">
                    </div>
                    <label class="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" :checked="newGroupHasSubcategories" @change="$emit('update:new-group-has-subcategories', $event.target.checked)">
                        С категориями
                    </label>
                    <div>
                        <label class="text-sm font-semibold">Тип группы</label>
                        <select
                            :value="newGroupTokenScope"
                            @change="$emit('update:new-group-token-scope', $event.target.value)"
                            class="w-full border rounded px-2 py-1 mt-1"
                        >
                            <option value="common">Общие</option>
                            <option value="context">Контекст токены</option>
                        </select>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 rounded border">Отмена</button>
                    <button @click="$emit('create')" class="px-4 py-2 rounded bg-blue-600 text-white">Создать</button>
                </div>
            </div>
        </div>
    `
};
