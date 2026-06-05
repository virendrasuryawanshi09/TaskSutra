
const compareClocks = (clockA = {}, clockB = {}) => {
    let aGreater = false;
    let bGreater = false;

    const allKeys = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);

    for (const key of allKeys) {
        const valA = clockA[key] || 0;
        const valB = clockB[key] || 0;

        if (valA > valB) {
            aGreater = true;
        } else if (valB > valA) {
            bGreater = true;
        }
    }

    if (aGreater && !bGreater) return 'A_DOMINATES';
    if (bGreater && !aGreater) return 'B_DOMINATES';
    if (!aGreater && !bGreater) return 'EQUAL';
    return 'CONCURRENT';
};


const mergeClocks = (clockA = {}, clockB = {}) => {
    const merged = {};
    const allKeys = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);
    for (const key of allKeys) {
        merged[key] = Math.max(clockA[key] || 0, clockB[key] || 0);
    }
    return merged;
};


const getStatusRank = (status = '') => {
    if (status === 'Completed') return 3;
    if (status === 'In-progress') return 2;
    return 1;
};


const getPriorityRank = (priority = '') => {
    if (priority === 'High') return 3;
    if (priority === 'Medium') return 2;
    return 1;
};

const mergeChecklists = (dbList = [], clientList = []) => {
    const merged = [];
    const clientMap = new Map();

    clientList.forEach(item => {
        const key = String(item._id || item.id || item.text).trim().toLowerCase();
        clientMap.set(key, item);
    });

    dbList.forEach(dbItem => {
        const key = String(dbItem._id || dbItem.id || dbItem.text).trim().toLowerCase();
        const clientItem = clientMap.get(key);

        if (clientItem) {
            merged.push({
                text: dbItem.text,
                completed: !!(dbItem.completed || clientItem.completed),
                _id: dbItem._id
            });
            clientMap.delete(key);
        } else {
            
            merged.push(dbItem.toObject ? dbItem.toObject() : dbItem);
        }
    });


    clientMap.forEach(clientItem => {
        merged.push(clientItem);
    });

    return merged;
};

const saveClock = (dbTask, mergedClock) => {
    if (dbTask.vectorClock instanceof Map) {
        dbTask.vectorClock.clear();
        for (const [k, v] of Object.entries(mergedClock)) {
            dbTask.vectorClock.set(k, v);
        }
    } else if (dbTask.vectorClock && typeof dbTask.vectorClock.set === 'function') {
        dbTask.vectorClock.clear();
        for (const [k, v] of Object.entries(mergedClock)) {
            dbTask.vectorClock.set(k, v);
        }
    } else {
        dbTask.vectorClock = new Map(Object.entries(mergedClock));
    }
};

const reconcileTask = (dbTask, clientTaskData) => {
    const dbClock = dbTask.vectorClock instanceof Map 
        ? Object.fromEntries(dbTask.vectorClock) 
        : (dbTask.vectorClock && typeof dbTask.vectorClock.set === 'function')
            ? Object.fromEntries(dbTask.vectorClock)
            : (dbTask.vectorClock || {});
    
    const clientClock = clientTaskData.vectorClock || {};

    const relation = compareClocks(clientClock, dbClock);

    if (relation === 'B_DOMINATES') {
        return { conflict: true, reconciled: false, task: dbTask };
    }

    if (relation === 'A_DOMINATES' || relation === 'EQUAL') {
        if (clientTaskData.title !== undefined) dbTask.title = clientTaskData.title;
        if (clientTaskData.description !== undefined) dbTask.description = clientTaskData.description;
        if (clientTaskData.priority !== undefined) dbTask.priority = clientTaskData.priority;
        if (clientTaskData.status !== undefined) dbTask.status = clientTaskData.status;
        if (clientTaskData.dueDate !== undefined) dbTask.dueDate = clientTaskData.dueDate;
        
        if (Array.isArray(clientTaskData.todoChecklist)) {
            dbTask.todoChecklist = clientTaskData.todoChecklist;
        } else if (Array.isArray(clientTaskData.todoCheckList)) {
            dbTask.todoChecklist = clientTaskData.todoCheckList;
        }

        if (clientTaskData.progress !== undefined) {
            dbTask.progress = clientTaskData.progress;
        }

        const mergedClock = mergeClocks(dbClock, clientClock);
        saveClock(dbTask, mergedClock);

        return { conflict: false, reconciled: false, task: dbTask };
    }


    const mergedClock = mergeClocks(dbClock, clientClock);


    const dbList = dbTask.todoChecklist || [];
    const clientList = clientTaskData.todoChecklist || clientTaskData.todoCheckList || [];
    const mergedChecklist = mergeChecklists(dbList, clientList);
    dbTask.todoChecklist = mergedChecklist;

    const totalItems = mergedChecklist.length;
    const completedItems = mergedChecklist.filter(item => item.completed).length;
    dbTask.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;


    const dbStatusRank = getStatusRank(dbTask.status);
    const clientStatus = clientTaskData.status || (dbTask.progress === 100 ? 'Completed' : dbTask.status);
    const clientStatusRank = getStatusRank(clientStatus);
    dbTask.status = clientStatusRank >= dbStatusRank ? clientStatus : dbTask.status;

  
    const dbPriorityRank = getPriorityRank(dbTask.priority);
    const clientPriority = clientTaskData.priority || dbTask.priority;
    const clientPriorityRank = getPriorityRank(clientPriority);
    dbTask.priority = clientPriorityRank >= dbPriorityRank ? clientPriority : dbTask.priority;


    if (clientTaskData.dueDate && dbTask.dueDate) {
        const clientDate = new Date(clientTaskData.dueDate);
        const dbDate = new Date(dbTask.dueDate);
        dbTask.dueDate = clientDate > dbDate ? clientTaskData.dueDate : dbTask.dueDate;
    } else if (clientTaskData.dueDate) {
        dbTask.dueDate = clientTaskData.dueDate;
    }


    if (clientTaskData.title && (!dbTask.title || clientTaskData.title.length > dbTask.title.length)) {
        dbTask.title = clientTaskData.title;
    }
    if (clientTaskData.description && (!dbTask.description || clientTaskData.description.length > dbTask.description.length)) {
        dbTask.description = clientTaskData.description;
    }

    saveClock(dbTask, mergedClock);

    return { conflict: true, reconciled: true, task: dbTask };
};

module.exports = {
    compareClocks,
    mergeClocks,
    reconcileTask
};
