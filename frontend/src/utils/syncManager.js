import axiosInstance from './axiosInstance';
import { getSyncQueue, deleteSyncQueueItem, saveTasks, getCachedTasks } from './indexedDB';
import toast from 'react-hot-toast';

let isSyncing = false;


export const processSyncQueue = async () => {
    if (isSyncing || !navigator.onLine) return;
    
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    isSyncing = true;
    console.log(`[SyncManager] Found ${queue.length} offline operations to synchronize.`);
    
    toast.loading("Reconnected. Synchronizing offline updates...", { id: "offlineSyncToast" });

    let successfulSyncs = 0;
    let conflictsResolved = 0;

    for (const item of queue) {
        try {
            const response = await axiosInstance({
                url: item.url,
                method: item.method,
                data: item.data
            });

            await deleteSyncQueueItem(item.id);
            successfulSyncs++;

            const updatedTask = response.data?.task;
            if (updatedTask) {
                const cached = await getCachedTasks();
                const nextCached = cached.map(t => (t._id === updatedTask._id ? updatedTask : t));
                await saveTasks(nextCached);
   
                window.dispatchEvent(new CustomEvent('sync_task_update', { 
                    detail: { task: updatedTask, reconciled: !!response.data.reconciled } 
                }));
            }

        } catch (error) {
            console.error(`[SyncManager] Sync failed for queue item ID ${item.id}:`, error);

  
            if (error.response && error.response.status === 409) {
                const conflictTask = error.response.data?.task;
                conflictsResolved++;
                
                await deleteSyncQueueItem(item.id);

                if (conflictTask) {
                    const cached = await getCachedTasks();
                    const nextCached = cached.map(t => (t._id === conflictTask._id ? conflictTask : t));
                    await saveTasks(nextCached);

                    
                    window.dispatchEvent(new CustomEvent('sync_task_conflict', { 
                        detail: { task: conflictTask, message: error.response.data?.message } 
                    }));
                }
            } else {
                
                console.warn("[SyncManager] Network issue during sync queue processing. Pausing queue.");
                break;
            }
        }
    }

    isSyncing = false;
    toast.dismiss("offlineSyncToast");

    if (successfulSyncs > 0) {
        toast.success(`Synced ${successfulSyncs} offline update(s) successfully!`);
    }
    if (conflictsResolved > 0) {
        toast.error(`Auto-resolved ${conflictsResolved} concurrent edit conflicts.`);
    }
};


export const initSyncManager = () => {
    window.addEventListener('online', () => {
        console.log('[SyncManager] Browser reconnected online. Triggering sync queue.');
        processSyncQueue();
    });

    setInterval(() => {
        if (navigator.onLine) {
            processSyncQueue();
        }
    }, 30000);
};
