// AI Context Memory Manager

export class MemoryManager {
    constructor() {
        this.history = [];
        this.preferences = {};
        this.actionState = { flow: null, target: null, data: {} };
        this.shortTermMemory = {};
    }

    addMessage(role, text, intent = null) {
        this.history.push({ role, text, intent, timestamp: new Date() });
        // Keep last 50 messages to prevent memory leak
        if (this.history.length > 50) this.history.shift();
    }

    setPreference(key, value) {
        this.preferences[key] = value;
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
    }

    clearActionState() {
        this.actionState = { flow: null, step: null, data: {} };
    }

    remember(key, value) {
        this.shortTermMemory[key] = value;
    }

    recall(key) {
        return this.shortTermMemory[key];
    }
}

export const aiMemory = new MemoryManager();
