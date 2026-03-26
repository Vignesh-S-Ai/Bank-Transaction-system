// AI Context Memory Manager

export class MemoryManager {
    constructor() {
        // Load from localStorage if available
        const saved = localStorage.getItem('nova_memory');
        const initialState = saved ? JSON.parse(saved) : {
            history: [],
            preferences: {},
            actionState: { flow: null, target: null, data: {} },
            shortTermMemory: {}
        };

        this.history = initialState.history || [];
        this.preferences = initialState.preferences || {};
        this.actionState = initialState.actionState || { flow: null, target: null, data: {} };
        this.shortTermMemory = initialState.shortTermMemory || {};
    }

    _save() {
        localStorage.setItem('nova_memory', JSON.stringify({
            history: this.history,
            preferences: this.preferences,
            actionState: this.actionState,
            shortTermMemory: this.shortTermMemory
        }));
    }

    addMessage(role, text, intent = null) {
        this.history.push({ role, text, intent, timestamp: new Date() });
        if (this.history.length > 50) this.history.shift();
        this._save();
    }

    setPreference(key, value) {
        this.preferences[key] = value;
        this._save();
    }

    getPreference(key) {
        return this.preferences[key];
    }

    updateActionState(flow, step, data = {}) {
        this.actionState = {
            flow,
            step,
            data: { ...this.actionState.data, ...data }
        };
        this._save();
    }

    clearActionState() {
        this.actionState = { flow: null, step: null, data: {} };
        this._save();
    }

    clearMemory() {
        this.history = [];
        this.preferences = {};
        this.actionState = { flow: null, step: null, data: {} };
        this.shortTermMemory = {};
        localStorage.removeItem('nova_memory');
    }

    remember(key, value) {
        this.shortTermMemory[key] = value;
        this._save();
    }

    recall(key) {
        return this.shortTermMemory[key];
    }
}

export const aiMemory = new MemoryManager();
