function generateUid(prefix = 'id') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
    }

    const time = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 14);
    return `${prefix}_${time}_${rand}`;
}

function generateUniqueUid(usedIds, prefix = 'id') {
    let next = generateUid(prefix);
    while (usedIds.has(next)) {
        next = generateUid(prefix);
    }
    usedIds.add(next);
    return next;
}

window.ContentEditorUid = {
    generateUid,
    generateUniqueUid
};
