window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.ScenariosPanel = {
    props: ['scenarioFiles'],
    template: `
        <div>
            <div class="flex justify-between mb-4">
                <h2 class="text-lg font-semibold">Сценарии (Content/Scenarios/)</h2>
                <button class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm shadow">+ Создать сценарий</button>
            </div>
            <div class="bg-white p-4 rounded shadow border border-gray-200 mb-4">
                <h3 class="font-semibold mb-2">Файлы сценариев</h3>
                <ul class="space-y-1">
                    <li v-for="file in scenarioFiles" :key="file.name" class="text-sm text-gray-700">{{ file.displayName }}</li>
                    <li v-if="scenarioFiles.length === 0" class="text-sm text-gray-400 italic">Папка Content/Scenarios пуста или не найдена.</li>
                </ul>
            </div>
            <div class="bg-white p-4 rounded shadow border border-gray-200 text-center text-gray-500 py-10">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Здесь будет Drag & Drop конструктор ходов (Turns)<br>
                <span class="text-sm">Игрок сможет перетаскивать токены из базы в колонки Correct/Trap/Cloud</span>
            </div>
        </div>
    `
};
