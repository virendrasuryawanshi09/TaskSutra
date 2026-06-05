const {
    compareClocks,
    mergeClocks,
    reconcileTask
} = require('../services/vectorClockReconciler');

describe('Vector Clock Conflict Resolution Engine', () => {
    describe('compareClocks', () => {
        test('should detect A dominates B (client is strictly newer)', () => {
            expect(compareClocks({ u1: 1 }, {})).toBe('A_DOMINATES');
            expect(compareClocks({ u1: 2, u2: 1 }, { u1: 1, u2: 1 })).toBe('A_DOMINATES');
        });

        test('should detect B dominates A (client is stale)', () => {
            expect(compareClocks({}, { u1: 1 })).toBe('B_DOMINATES');
            expect(compareClocks({ u1: 1 }, { u1: 2 })).toBe('B_DOMINATES');
        });

        test('should detect equal clocks', () => {
            expect(compareClocks({ u1: 1, u2: 5 }, { u1: 1, u2: 5 })).toBe('EQUAL');
            expect(compareClocks({}, {})).toBe('EQUAL');
        });

        test('should detect concurrent clocks (conflict)', () => {
            expect(compareClocks({ u1: 1, u2: 0 }, { u1: 0, u2: 1 })).toBe('CONCURRENT');
            expect(compareClocks({ u1: 2, u2: 1 }, { u1: 1, u2: 2 })).toBe('CONCURRENT');
        });
    });

    describe('mergeClocks', () => {
        test('should merge clocks taking maximum logical version for each user', () => {
            const clockA = { u1: 2, u2: 1 };
            const clockB = { u1: 1, u2: 3, u3: 1 };
            const merged = mergeClocks(clockA, clockB);
            expect(merged).toEqual({ u1: 2, u2: 3, u3: 1 });
        });
    });

    describe('reconcileTask', () => {
        const createMockDbTask = (initialData = {}) => {
            return {
                title: initialData.title || 'Task',
                description: initialData.description || 'Desc',
                priority: initialData.priority || 'Medium',
                status: initialData.status || 'Pending',
                todoChecklist: initialData.todoChecklist || [],
                progress: initialData.progress || 0,
                vectorClock: new Map(Object.entries(initialData.vectorClock || {})),
                dueDate: initialData.dueDate || null,
                save: jest.fn().mockResolvedValue(true)
            };
        };

        test('should reject updates when client clock is dominated (stale local state)', () => {
            const dbTask = createMockDbTask({ vectorClock: { u1: 2 } });
            const clientUpdate = { status: 'Completed', vectorClock: { u1: 1 } };

            const result = reconcileTask(dbTask, clientUpdate);
            expect(result.conflict).toBe(true);
            expect(result.reconciled).toBe(false);
            expect(dbTask.status).toBe('Pending'); 
        });

        test('should accept updates completely when client clock dominates db clock', () => {
            const dbTask = createMockDbTask({ status: 'Pending', vectorClock: { u1: 1 } });
            const clientUpdate = { status: 'In-progress', vectorClock: { u1: 2 } };

            const result = reconcileTask(dbTask, clientUpdate);
            expect(result.conflict).toBe(false);
            expect(result.reconciled).toBe(false);
            expect(dbTask.status).toBe('In-progress');
            expect(Object.fromEntries(dbTask.vectorClock)).toEqual({ u1: 2 });
        });

        test('should auto-reconcile checklist items and status when clocks are concurrent', () => {
            const dbTask = createMockDbTask({
                status: 'In-progress',
                vectorClock: { u1: 1 },
                todoChecklist: [
                    { text: 'Auth integration', completed: false, _id: '1' },
                    { text: 'Database caching', completed: true, _id: '2' }
                ]
            });

            const clientUpdate = {
                status: 'Pending',
                vectorClock: { u2: 1 }, 
                todoChecklist: [
                    { text: 'Auth integration', completed: true, id: '1' },
                    { text: 'Database caching', completed: false, id: '2' }
                ]
            };

            const result = reconcileTask(dbTask, clientUpdate);
            
            expect(result.conflict).toBe(true);
            expect(result.reconciled).toBe(true);
            
            expect(dbTask.todoChecklist).toHaveLength(2);
            expect(dbTask.todoChecklist.find(i => i.text === 'Auth integration').completed).toBe(true);
            expect(dbTask.todoChecklist.find(i => i.text === 'Database caching').completed).toBe(true);

            expect(dbTask.progress).toBe(100);

     
            expect(dbTask.status).toBe('In-progress');

            expect(Object.fromEntries(dbTask.vectorClock)).toEqual({ u1: 1, u2: 1 });
        });

        test('should choose highest priority (High > Medium > Low) on conflict', () => {
            const dbTask = createMockDbTask({ priority: 'Medium', vectorClock: { u1: 1 } });
            const clientUpdate = { priority: 'High', vectorClock: { u2: 1 } }; 

            reconcileTask(dbTask, clientUpdate);
            expect(dbTask.priority).toBe('High');
        });
    });
});
