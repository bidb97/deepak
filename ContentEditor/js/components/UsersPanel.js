window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.UsersPanel = {
    components: {
        IconActionButton: window.ContentEditorComponents.IconActionButton
    },
    props: ['users', 'saveMessage'],
    emits: ['save-user', 'delete-user', 'create-user-draft'],
    template: `
        <div class="h-full flex flex-col">
            <div class="flex justify-between mb-4 items-center shrink-0">
                <h2 class="text-lg font-semibold">Пользователи (Content/Users/*.json)</h2>
                <span v-if="saveMessage" class="text-sm text-green-600 font-medium transition-opacity duration-300">
                    {{ saveMessage }}
                </span>
            </div>
            
            <div class="flex-1 flex gap-4 overflow-hidden">
                <!-- Левая колонка со списком файлов/пользователей -->
                <div class="w-1/3 bg-white p-4 rounded shadow border border-gray-200 flex flex-col">
                    <div class="flex gap-2 mb-3 shrink-0 border-b border-gray-100 pb-3">
                        <button @click="filterGender = 'all'" :class="{'bg-gray-800 text-white': filterGender === 'all', 'bg-gray-100 text-gray-700': filterGender !== 'all'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Все</button>
                        <button @click="filterGender = 'male'" :class="{'bg-[#6a5cff] text-white': filterGender === 'male', 'bg-gray-100 text-gray-700': filterGender !== 'male'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">М</button>
                        <button @click="filterGender = 'female'" :class="{'bg-[#f04f62] text-white': filterGender === 'female', 'bg-gray-100 text-gray-700': filterGender !== 'female'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Ж</button>
                        <button @click="filterGender = 'special'" :class="{'bg-[#18b368] text-white': filterGender === 'special', 'bg-gray-100 text-gray-700': filterGender !== 'special'}" class="flex-1 py-1 px-2 text-xs font-medium rounded transition">Спец</button>
                    </div>
                    
                    <div class="mb-3 shrink-0">
                        <input type="text" v-model="searchQuery" placeholder="Поиск по имени, файлу..." class="w-full text-sm p-2 rounded border focus:outline-none transition">
                    </div>
                    
                    <ul class="space-y-2 flex-1 overflow-y-auto pr-1">
                        <li 
                            v-for="user in filteredUsers" 
                            :key="user.fileName" 
                            @click="selectUser(user)"
                            :class="{'border-[#6a5cff] bg-[#6a5cff] bg-opacity-10': selectedUser?.fileName === user.fileName, 'border-gray-200 hover:border-gray-300': selectedUser?.fileName !== user.fileName}"
                            class="p-2 bg-gray-50 rounded border cursor-pointer transition flex flex-col"
                        >
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-sm truncate" :title="user.data.nickname || 'Без имени'">
                                    {{ user.data.nickname || 'Без имени' }}
                                </span>
                                <span class="text-[10px] mb-1 uppercase font-bold px-1.5 py-0.5 rounded" :class="genderBadgeClass(user.data.gender)">
                                    {{ genderLabel(user.data.gender) }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center mt-1">
                                <span class="text-xs text-gray-400 truncate max-w-[100px] text-right">{{ user.fileName }}</span>
                                <div class="flex items-center gap-1 shrink-0">
                                    <icon-action-button
                                        icon="trash"
                                        title="Удалить"
                                        variant="danger"
                                        @click="confirmDeleteFromList(user)"
                                    ></icon-action-button>
                                </div>
                            </div>
                        </li>
                        <li v-if="filteredUsers.length === 0" class="text-sm text-gray-400 italic text-center py-4">Пользователи не найдены.</li>
                    </ul>
                    
                    <div class="mt-4 shrink-0 pt-3 border-t border-gray-100">
                        <button @click="openCreateDraft" class="w-full py-2 bg-gray-800 text-white font-medium rounded text-sm hover:bg-gray-700 transition flex items-center justify-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Новый пользователь
                        </button>
                    </div>
                </div>
                
                <!-- Правая колонка: Редактор -->
                <div v-if="selectedUser" class="w-2/3 bg-white p-5 rounded shadow border border-gray-200 flex flex-col overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">
                            Редактирование: 
                            <span v-if="selectedUser.isNew" class="text-sm font-normal text-[#6a5cff] bg-[#6a5cff] bg-opacity-10 px-2 py-0.5 rounded border border-[#6a5cff] border-opacity-30">Новый файл</span>
                            <span v-else class="text-sm font-normal text-gray-500">{{ selectedUser.fileName }}</span>
                        </h3>
                        <div class="flex gap-2">
                                <button @click="save" class="bg-[#6a5cff] hover:bg-[#7f73ff] text-white text-sm font-medium px-4 py-1.5 rounded transition shadow-sm flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                Сохранить
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div v-if="selectedUser.isNew" class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Имя файла (без .json) <span class="text-red-500">*</span></label>
                                <input type="text" v-model="selectedUser.fileName" placeholder="например: karen" class="w-full p-2 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Nickname (Имя в чате) <span class="text-red-500">*</span></label>
                                <input type="text" v-model="editDraft.nickname" placeholder="Например: Karen89" class="w-full p-2 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Пол <span class="text-red-500">*</span></label>
                                <select v-model="editDraft.gender" class="w-full p-2 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none bg-white">
                                    <option value="male">Мужской (Male)</option>
                                    <option value="female">Женский (Female)</option>
                                    <option value="special">Особый/Скрытый (Special)</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Типаж (Архетип) <span class="text-red-500">*</span></label>
                                <input type="text" v-model="editDraft.type" placeholder="karen, boomer, teen, tech, paranoid, star, default" class="w-full p-2 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none font-mono">
                            </div>
                        </div>

                        <!-- Модификаторы -->
                        <div class="border border-gray-200 rounded p-3 bg-gray-50">
                            <h4 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Модификаторы реакций</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Бонус/штраф к порогу оценки (%)</label>
                                    <input type="number" v-model.number="editDraft.modifiers.threshold_bonus" class="w-full p-1.5 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none" placeholder="0">
                                    <p class="text-[10px] text-gray-400 mt-0.5">+15 = легче удовлетворить, -10 = придирчивый</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Бонус к шансу "Angry" (%)</label>
                                    <input type="number" v-model.number="editDraft.modifiers.angry_chance_bonus" class="w-full p-1.5 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none" placeholder="0">
                                    <p class="text-[10px] text-gray-400 mt-0.5">+20 = чаще злится при низкой оценке</p>
                                </div>
                            </div>
                        </div>

                        <!-- Личные правила -->
                        <div class="border border-gray-200 rounded p-3">
                            <div class="flex justify-between items-center mb-2 border-b border-gray-200 pb-1">
                                <h4 class="text-sm font-semibold text-gray-700">Личные правила</h4>
                                <button @click="addRule" class="text-xs text-[#6a5cff] hover:text-[#7f73ff] font-medium">+ Добавить правило</button>
                            </div>
                            
                            <div v-if="editDraft.personal_rules.length === 0" class="text-xs text-gray-400 italic py-2">
                                Нет личных правил. (Пример: запрет эмодзи, обязательное "Мой Господин")
                            </div>
                            
                            <ul class="space-y-2">
                                <li v-for="(rule, idx) in editDraft.personal_rules" :key="idx" class="flex gap-2 items-start p-2 bg-gray-50 border border-gray-200 rounded">
                                    <div class="flex-1 space-y-2">
                                        <select v-model="rule.rule_type" class="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-[#6a5cff] bg-white">
                                            <option value="forbidden_token">Запретить токен (forbidden_token)</option>
                                            <option value="mandatory_token">Обязательный токен (mandatory_token)</option>
                                            <option value="structural">Структурное требование (structural)</option>
                                        </select>
                                        <input type="text" v-model="rule.value" placeholder="ID токена или значение" class="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-[#6a5cff] font-mono">
                                    </div>
                                    <button @click="removeRule(idx)" class="text-red-500 hover:text-red-700 p-1" title="Удалить">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Заметки -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Заметки для сценариста</label>
                            <textarea v-model="editDraft.notes" rows="3" placeholder="Описание характера, арки, с какого дня появляется..." class="w-full p-2 text-sm border border-gray-300 rounded focus:border-[#6a5cff] focus:outline-none resize-y"></textarea>
                        </div>
                    </div>
                </div>
                
                <div v-else class="w-2/3 bg-gray-50 p-5 rounded border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <p class="text-lg font-medium">Выберите пользователя слева</p>
                    <p class="text-sm mt-1">или создайте нового</p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            filterGender: 'all',
            searchQuery: '',
            selectedUser: null,
            editDraft: null
        };
    },
    computed: {
        filteredUsers() {
            let list = this.users || [];
            
            if (this.filterGender !== 'all') {
                list = list.filter(u => u.data.gender === this.filterGender);
            }
            
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                list = list.filter(u => 
                    (u.data.nickname || '').toLowerCase().includes(q) ||
                    (u.fileName || '').toLowerCase().includes(q)
                );
            }
            
            // Сортировка по алфавиту (по имени файла)
            return list.slice().sort((a, b) => a.fileName.localeCompare(b.fileName));
        }
    },
    methods: {
        genderBadgeClass(gender) {
            switch(gender) {
                case 'male': return 'bg-[rgba(106,92,255,0.16)] text-[#6a5cff] border border-[rgba(106,92,255,0.42)]';
                case 'female': return 'bg-[rgba(240,79,98,0.16)] text-[#f04f62] border border-[rgba(240,79,98,0.42)]';
                case 'special': return 'bg-[rgba(24,179,104,0.16)] text-[#18b368] border border-[rgba(24,179,104,0.42)]';
                default: return 'bg-gray-600 bg-opacity-20 text-gray-400 border border-gray-500 border-opacity-30';
            }
        },
        genderLabel(gender) {
            switch(gender) {
                case 'male': return 'М';
                case 'female': return 'Ж';
                case 'special': return 'Спец';
                default: return '?';
            }
        },
        selectUser(user) {
            // Если есть несохраненные изменения, здесь могла бы быть проверка
            this.selectedUser = {
                isNew: false,
                fileName: user.fileName,
                originalData: JSON.parse(JSON.stringify(user.data))
            };
            this.editDraft = JSON.parse(JSON.stringify(user.data));
        },
        openCreateDraft() {
            const { createUserDraft } = window.ContentEditorUsersService;
            const draft = createUserDraft();
            
            this.selectedUser = {
                isNew: true,
                fileName: '',
                originalData: null
            };
            this.editDraft = draft;
        },
        addRule() {
            this.editDraft.personal_rules.push({
                rule_type: 'forbidden_token',
                value: ''
            });
        },
        removeRule(idx) {
            this.editDraft.personal_rules.splice(idx, 1);
        },
        save() {
            if (!this.editDraft.nickname.trim()) {
                alert("Nickname не может быть пустым!");
                return;
            }
            
            let fileName = this.selectedUser.fileName;
            if (this.selectedUser.isNew) {
                if (!fileName.trim()) {
                    alert("Укажите имя файла для нового пользователя!");
                    return;
                }
                fileName = fileName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                if (!fileName.endsWith('.json')) {
                    fileName += '.json';
                }
                
                // Проверка на дубликат файла
                if (this.users.some(u => u.fileName === fileName)) {
                    alert("Файл с таким именем уже существует!");
                    return;
                }
            }
            
            // Чистим правила с пустым значением
            const draftToSave = JSON.parse(JSON.stringify(this.editDraft));
            draftToSave.personal_rules = draftToSave.personal_rules.filter(r => r.value.trim() !== '');

            this.$emit('save-user', fileName, draftToSave);
            
                        // Обновляем локальный стейт, чтобы не считался isNew
            this.selectedUser.isNew = false;
            this.selectedUser.fileName = fileName;
        },
        confirmDeleteFromList(user) {
            const nick = user?.data?.nickname?.trim();
            const label = nick || user.fileName;
            if (confirm(`Удалить пользователя ${label}?`)) {
                this.$emit('delete-user', user.fileName);
                if (this.selectedUser && this.selectedUser.fileName === user.fileName) {
                    this.selectedUser = null;
                    this.editDraft = null;
                }
            }
        }
    }
};
