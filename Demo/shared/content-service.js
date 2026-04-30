(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
    return await response.json();
  }

  async function readJsonFile(dirHandle, fileName, fallback) {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return text.trim() ? JSON.parse(text) : fallback;
  }

  async function writeTextFile(dirHandle, fileName, text) {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function loadContentFromFetch() {
    const [tokensData, charactersData, scenariosData] = await Promise.all([
      loadJson("data/tokens.json"),
      loadJson("data/characters.json"),
      loadJson("data/scenarios.json")
    ]);
    return normalizeContent({ tokensData, charactersData, scenariosData });
  }

  async function loadContentFromDirectory(handle) {
    const dataHandle = await root.storage.getDemoDataDirectory(handle, false);
    const tokensData = await readJsonFile(dataHandle, "tokens.json", { common: [], scenario: [] });
    const charactersData = await readJsonFile(dataHandle, "characters.json", { characters: [] });
    const scenariosData = await readJsonFile(dataHandle, "scenarios.json", { scenarios: [] });
    return normalizeContent({ tokensData, charactersData, scenariosData });
  }

  async function saveContentToDirectory(handle, content) {
    const dataHandle = await root.storage.getDemoDataDirectory(handle, true);
    const normalized = normalizeContent(content);
    await writeTextFile(dataHandle, "tokens.json", `${JSON.stringify(normalized.tokensData, null, 2)}\n`);
    await writeTextFile(dataHandle, "characters.json", `${JSON.stringify(normalized.charactersData, null, 2)}\n`);
    await writeTextFile(dataHandle, "scenarios.json", `${JSON.stringify(normalized.scenariosData, null, 2)}\n`);
  }

  function normalizeContent(content) {
    return {
      tokensData: root.schema.normalizeTokensData(content.tokensData),
      charactersData: root.schema.normalizeCharactersData(content.charactersData),
      scenariosData: root.schema.normalizeScenariosData(content.scenariosData)
    };
  }

  root.contentService = {
    loadContentFromFetch,
    loadContentFromDirectory,
    saveContentToDirectory,
    normalizeContent
  };
})();
