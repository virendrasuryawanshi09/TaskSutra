const DB_NAME = 'TaskSutraOffline';
const DB_VERSION = 1;


export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB open error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                db.createObjectStore('tasks', { keyPath: '_id' });
            }
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};


export const saveTasks = async (tasks) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('tasks', 'readwrite');
            const store = tx.objectStore('tasks');
            
            store.clear();

            tasks.forEach(task => {
                const id = task._id || task.id;
                if (id) {
                    store.put({ ...task, _id: id });
                }
            });

            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error("IndexedDB saveTasks error:", err);
        return false;
    }
};


export const getCachedTasks = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('tasks', 'readonly');
            const store = tx.objectStore('tasks');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("IndexedDB getCachedTasks error:", err);
        return [];
    }
};


const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback RFC4122 compliance UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const queueSyncRequest = async (url, method, data, taskId) => {
    try {
        const db = await initDB();
        
        // Clone and inject transactionId if data is an object
        const finalData = typeof data === 'object' && data !== null ? { ...data } : {};
        if (!finalData.transactionId) {
            finalData.transactionId = generateUUID();
        }

        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');

            const request = store.add({
                url,
                method,
                data: finalData,
                taskId,
                timestamp: Date.now()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("IndexedDB queueSyncRequest error:", err);
        throw err;
    }
};


export const getSyncQueue = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readonly');
            const store = tx.objectStore('syncQueue');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("IndexedDB getSyncQueue error:", err);
        return [];
    }
};


export const deleteSyncQueueItem = async (id) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("IndexedDB deleteSyncQueueItem error:", err);
        return false;
    }
};
