window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.CreateSubcategoryModal = {
    props: ['show', 'slug', 'title'],
    emits: ['update:slug', 'update:title', 'close', 'create'],
    template: `
        <div v-if="show" class="modal-overlay">
            <div class="bg-white w-full max-w-lg rounded-lg shadow-lg border border-gray-200 p-4">
                <h3 class="text-lg font-bold mb-2">Новая группа</h3>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-semibold">Slug группы</label>
                        <input :value="slug" @input="$emit('update:slug', $event.target.value)" type="text" placeholder="например, soup" class="w-full border rounded px-2 py-1 mt-1">
                    </div>
                    <div>
                        <label class="text-sm font-semibold">Title</label>
                        <input :value="title" @input="$emit('update:title', $event.target.value)" type="text" placeholder="например, Супы" class="w-full border rounded px-2 py-1 mt-1">
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
