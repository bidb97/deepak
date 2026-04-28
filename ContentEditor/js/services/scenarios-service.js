function createScenarioDraft(userId = '') {
    const { generateUid } = window.ContentEditorUid;
    return {
        id: generateUid('scn'),
        user_id: userId || '',
        title: '',
        turns: []
    };
}

function createTurnDraft() {
    const { generateUid } = window.ContentEditorUid;
    return {
        id: generateUid('trn'),
        request: '',
        keywords: [],
        cloud_ids: [],
        required_token_ids: [],
        correct_token_ids: [],
        trap_token_ids: [],
        reaction_good: '',
        reaction_bad: ''
    };
}

function validateScenarioHasUser(scenario) {
    return typeof scenario?.user_id === 'string' && scenario.user_id.trim().length > 0;
}

window.ContentEditorScenariosService = {
    createScenarioDraft,
    createTurnDraft,
    validateScenarioHasUser
};
