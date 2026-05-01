(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  async function restoreDemoHandle() {
    const handle = await root.storage.getStoredDemoDirectoryHandle();
    if (!handle) return null;
    if (!await root.storage.ensureDemoFolderPermission(handle, "readwrite")) return null;
    return handle;
  }

  async function pickDemoHandle() {
    return await root.storage.selectDemoDirectory("readwrite");
  }

  async function loadEditorContent(handle) {
    if (handle) return await root.contentService.loadContentFromDirectory(handle);
    if (window.location.protocol === "file:") {
      throw new Error("FILE_PROTOCOL_REQUIRES_DEMO_FOLDER");
    }
    return await root.contentService.loadContentFromFetch();
  }

  async function saveEditorContent(handle, content) {
    await root.contentService.saveContentToDirectory(handle, content);
  }

  async function saveEditorDataFile(handle, fileName, data) {
    await root.contentService.saveEditorDataFile(handle, fileName, data);
  }

  async function rememberDemoHandle(handle) {
    await root.storage.saveDemoDirectoryHandle(handle);
  }

  root.editorApi = {
    restoreDemoHandle,
    pickDemoHandle,
    loadEditorContent,
    saveEditorContent,
    saveEditorDataFile,
    rememberDemoHandle
  };
})();
