function createUserDraft(data = {}) {
    const { generateUid } = window.ContentEditorUid;
    return {
        id: generateUid('usr'),
        name: data.name || '',
        notes: data.notes || ''
    };
}

function normalizeUserRecord(raw = {}) {
    const draft = createUserDraft(raw);
    if (typeof raw.id === 'string' && raw.id.trim()) {
        draft.id = raw.id.trim();
    }
    return draft;
}

window.ContentEditorUsersService = {
    createUserDraft,
    normalizeUserRecord
};
