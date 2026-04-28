async function collectProjectTokenIds(rootContentHandle) {
    const { getOptionalDirectoryHandle, listJsonFiles, readJsonFromFileHandle } = window.ContentEditorFsService;
    const ids = new Set();
    if (!rootContentHandle) return ids;

    const tokensDir = await getOptionalDirectoryHandle(rootContentHandle, 'Tokens');
    if (!tokensDir) return ids;

    const tokenFiles = await listJsonFiles(tokensDir);
    for (const entry of tokenFiles) {
        const parsed = await readJsonFromFileHandle(entry, {});
        for (const [category, subcats] of Object.entries(parsed)) {
            if (category === 'meta' || typeof subcats !== 'object' || !subcats) continue;
            for (const tokenArray of Object.values(subcats)) {
                if (!Array.isArray(tokenArray)) continue;
                for (const token of tokenArray) {
                    if (token && typeof token.id === 'string') ids.add(token.id);
                }
            }
        }
    }

    return ids;
}

function generateUniqueTokenId(usedIds) {
    const { generateUniqueUid } = window.ContentEditorUid;
    return generateUniqueUid(usedIds, 'tok');
}

window.ContentEditorTokensService = {
    collectProjectTokenIds,
    generateUniqueTokenId
};
