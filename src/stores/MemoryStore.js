export default class MemoryStore {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        return this.store.get(key);
    }

    set(key, value) {
        this.store.set(key, value);
    }

    delete(key) {
        this.store.delete(key);
    }

    has(key) {
        return this.store.has(key);
    }

    clear() {
        this.store.clear();
    }
}