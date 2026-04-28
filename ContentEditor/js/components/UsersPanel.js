window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.UsersPanel = {
    props: ['users'],
    template: `
        <div>
            <div class="flex justify-between mb-4">
                <h2 class="text-lg font-semibold">Пользователи (Content/Users/)</h2>
            </div>
            <div class="bg-white p-4 rounded shadow border border-gray-200">
                <ul class="space-y-2">
                    <li v-for="user in users" :key="user.id" class="p-2 bg-gray-50 rounded border border-gray-100">
                        <div class="font-semibold text-sm">{{ user.name || 'Без имени' }}</div>
                        <div class="text-xs text-gray-500">{{ user.id }}</div>
                    </li>
                    <li v-if="users.length === 0" class="text-sm text-gray-400 italic">Пользователи не найдены.</li>
                </ul>
            </div>
        </div>
    `
};
