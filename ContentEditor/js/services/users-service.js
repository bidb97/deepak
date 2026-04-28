function createUserDraft(data = {}) {
    const { generateUid } = window.ContentEditorUid;
    return {
        id: (typeof data.id === 'string' && data.id.trim()) ? data.id.trim() : generateUid('usr'),
        nickname: data.nickname || '',
        gender: data.gender || 'male', // male, female, special
        type: data.type || 'default',
        modifiers: data.modifiers || {
            threshold_bonus: 0,
            angry_chance_bonus: 0
        },
        personal_rules: data.personal_rules || [],
        notes: data.notes || ''
    };
}

function normalizeUserRecord(raw = {}) {
    const { generateUid } = window.ContentEditorUid;
    const draft = createUserDraft(raw);
    if (typeof raw.id === 'string' && raw.id.trim()) {
        draft.id = raw.id.trim();
    } else if (!draft.id) {
        draft.id = generateUid('usr');
    }
    if (typeof raw.nickname === 'string' && raw.nickname.trim()) {
        draft.nickname = raw.nickname.trim();
    }
    if (raw.gender) draft.gender = raw.gender;
    if (raw.type) draft.type = raw.type;
    
    // Модификаторы
    if (raw.modifiers) {
        draft.modifiers.threshold_bonus = Number(raw.modifiers.threshold_bonus) || 0;
        draft.modifiers.angry_chance_bonus = Number(raw.modifiers.angry_chance_bonus) || 0;
    }
    
    // Личные правила
    if (Array.isArray(raw.personal_rules)) {
        draft.personal_rules = raw.personal_rules.map(rule => ({
            rule_type: rule.rule_type || 'forbidden_token',
            value: rule.value || ''
        }));
    }
    
    if (typeof raw.notes === 'string') {
        draft.notes = raw.notes;
    }
    
    return draft;
}

async function loadUsers(rootContentHandle) {
    const { getOptionalDirectoryHandle, listJsonFiles, readJsonFromFileHandle } = window.ContentEditorFsService;
    const users = [];
    if (!rootContentHandle) return users;

    const usersDir = await getOptionalDirectoryHandle(rootContentHandle, 'Users');
    if (!usersDir) return users;

    const userFiles = await listJsonFiles(usersDir);
    for (const fileHandle of userFiles) {
        const raw = await readJsonFromFileHandle(fileHandle, null);
        if (raw) {
            users.push({
                fileHandle,
                fileName: fileHandle.name,
                data: normalizeUserRecord(raw)
            });
        }
    }
    
    return users;
}

async function saveUser(rootContentHandle, fileName, userData) {
    const { getOptionalDirectoryHandle, writeJsonToFileHandle } = window.ContentEditorFsService;
    if (!rootContentHandle) throw new Error("Нет доступа к папке Content");
    
    let usersDir = await getOptionalDirectoryHandle(rootContentHandle, 'Users');
    if (!usersDir) {
        usersDir = await rootContentHandle.getDirectoryHandle('Users', { create: true });
    }
    
    const cleanFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    const fileHandle = await usersDir.getFileHandle(cleanFileName, { create: true });
    const normalized = normalizeUserRecord(userData);
    await writeJsonToFileHandle(fileHandle, normalized);
    
    return {
        fileHandle,
        fileName: cleanFileName,
        data: normalized
    };
}

async function deleteUser(rootContentHandle, fileName) {
    const { getOptionalDirectoryHandle } = window.ContentEditorFsService;
    if (!rootContentHandle) return false;
    
    const usersDir = await getOptionalDirectoryHandle(rootContentHandle, 'Users');
    if (!usersDir) return false;
    
    try {
        await usersDir.removeEntry(fileName);
        return true;
    } catch (e) {
        console.error("Ошибка при удалении файла юзера", e);
        return false;
    }
}

window.ContentEditorUsersService = {
    createUserDraft,
    normalizeUserRecord,
    loadUsers,
    saveUser,
    deleteUser
};
