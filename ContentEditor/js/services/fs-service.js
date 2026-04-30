async function readJsonFromFileHandle(fileHandle, fallback = {}) {
    try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (!text.trim()) return fallback;
        return JSON.parse(text);
    } catch (e) {
        return fallback;
    }
}

async function writeJsonToFileHandle(fileHandle, payload) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
}

async function getOptionalDirectoryHandle(parentHandle, dirName) {
    return parentHandle.getDirectoryHandle(dirName, { create: false }).catch(() => null);
}

async function listJsonFiles(dirHandle) {
    const files = [];
    if (!dirHandle) return files;

    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            files.push(entry);
        }
    }

    return files;
}

window.ContentEditorFsService = {
    readJsonFromFileHandle,
    writeJsonToFileHandle,
    getOptionalDirectoryHandle,
    listJsonFiles
};
