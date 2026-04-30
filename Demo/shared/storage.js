(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const demoContentDbName = "deepakDemoContentAccess";
  const demoContentStoreName = "handles";
  const demoDirectoryHandleKey = "demoDirectory";

  async function openDemoContentDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(demoContentDbName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(demoContentStoreName)) {
          request.result.createObjectStore(demoContentStoreName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getStoredDemoDirectoryHandle() {
    const db = await openDemoContentDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(demoContentStoreName, "readonly");
      const request = transaction.objectStore(demoContentStoreName).get(demoDirectoryHandleKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveDemoDirectoryHandle(handle) {
    const db = await openDemoContentDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(demoContentStoreName, "readwrite");
      const request = transaction.objectStore(demoContentStoreName).put(handle, demoDirectoryHandleKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function ensureDemoFolderPermission(handle, mode = "read") {
    if (!handle?.queryPermission) return true;
    const options = { mode };
    if (await handle.queryPermission(options) === "granted") return true;
    if (!handle.requestPermission) return false;
    return await handle.requestPermission(options) === "granted";
  }

  async function selectDemoDirectory(mode = "read") {
    if (!window.showDirectoryPicker) return null;
    const handle = await window.showDirectoryPicker({ mode, startIn: "desktop" });
    if (!await ensureDemoFolderPermission(handle, mode)) return null;
    return handle;
  }

  async function getDemoDataDirectory(handle, create = false) {
    if (!handle) return null;
    return await handle.getDirectoryHandle("data", { create });
  }

  root.storage = {
    getStoredDemoDirectoryHandle,
    saveDemoDirectoryHandle,
    ensureDemoFolderPermission,
    selectDemoDirectory,
    getDemoDataDirectory
  };
})();
