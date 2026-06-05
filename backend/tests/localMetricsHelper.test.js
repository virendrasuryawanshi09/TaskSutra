const {
    calculateLocalRecommendations,
    calculateLocalCognitiveLoad
} = require('../utils/localMetricsHelper');

describe('Local Metrics Heuristics Engine', () => {
    describe('calculateLocalRecommendations (Assignee Score Heuristics)', () => {
        const mockWorkloads = [
            {
                _id: 'dev_1',
                name: 'Alice',
                skills: ['React', 'Node.js', 'CSS'],
                activeTasks: 1
            },
            {
                _id: 'dev_2',
                name: 'Bob',
                skills: ['Python', 'Docker'],
                activeTasks: 5
            }
        ];

        test('should recommend devs correctly matching title/description skills and task load', () => {
            const title = 'Build React UI component';
            const description = 'Needs Node.js back-end integration';
            
            const results = calculateLocalRecommendations(mockWorkloads, title, description);
            
            
            const aliceRec = results.find(r => r.developerId === 'dev_1');
            expect(aliceRec).toBeDefined();
            expect(aliceRec.score).toBe(80);
            expect(aliceRec.matchingSkills).toContain('React');
            expect(aliceRec.matchingSkills).toContain('Node.js');

            
            const bobRec = results.find(r => r.developerId === 'dev_2');
            expect(bobRec).toBeDefined();
            expect(bobRec.score).toBe(20);
            expect(bobRec.matchingSkills).toHaveLength(0);
        });

        test('should clamp recommendation scores within bounds [15, 95]', () => {
            const workloadWithZeroTasks = [
                {
                    _id: 'dev_3',
                    skills: ['Java', 'SQL', 'Git', 'Docker'],
                    activeTasks: 0
                }
            ];
            
            const results = calculateLocalRecommendations(workloadWithZeroTasks, 'Java SQL Git Docker task', '');
            expect(results[0].score).toBe(90);
        });
    });

    describe('calculateLocalCognitiveLoad (Workload & Collision Heuristics)', () => {
        const mockUser = {
            name: 'Charlie',
            behavioralProfile: {
                performanceMetrics: {
                    lateSubmissionRate: 10 
                }
            }
        };

        test('should calculate optimal capacity for user with no active tasks', () => {
            const activeTasks = [];
            const timeline = [];

            const load = calculateLocalCognitiveLoad(mockUser, activeTasks, timeline);
            
            
            expect(load.deliveryProbability).toBe(96);
            expect(load.cognitiveLoadScore).toBe(5); 
            expect(load.warnings).toHaveLength(0);
            expect(load.assessment).toContain('Optimal capacity');
        });

        test('should apply context-switching penalty for multi-domain workloads', () => {
            const activeTasks = [
                { domain: 'Frontend', taskDna: { estimatedComplexityScore: 5 }, priority: 'Low' },
                { domain: 'Backend', taskDna: { estimatedComplexityScore: 5 }, priority: 'Low' }
            ];
            const timeline = [];

            const load = calculateLocalCognitiveLoad(mockUser, activeTasks, timeline);
            
            
            expect(load.detectedDomains).toContain('Frontend');
            expect(load.detectedDomains).toContain('Backend');
            expect(load.contextSwitchPenalty).toBe(10);
            expect(load.warnings).toContain('Context-switching penalty applied for working across 2 domains.');
        });

        test('should accumulate priority cognitive loads and deduct delivery probabilities', () => {
            const activeTasks = [
                { domain: 'Frontend', taskDna: { estimatedComplexityScore: 4 }, priority: 'High' }
            ];
            const timeline = [];

            const load = calculateLocalCognitiveLoad(mockUser, activeTasks, timeline);
            
            
            expect(load.cognitiveLoadScore).toBe(39);
            
            expect(load.deliveryProbability).toBe(84);
        });

        test('should identify deadline collisions and apply timeline penalties', () => {
            const activeTasks = [
                { title: 'Task A', domain: 'Frontend', taskDna: { estimatedComplexityScore: 2 }, priority: 'Low', dueDate: new Date('2026-06-10') },
                { title: 'Task B', domain: 'Frontend', taskDna: { estimatedComplexityScore: 2 }, priority: 'Low', dueDate: new Date('2026-06-11') } // Due next day
            ];
            const timeline = [
                { taskId: '1', title: 'Task A', dueDate: '2026-06-10', priority: 'Low', domain: 'Frontend', complexity: 2 },
                { taskId: '2', title: 'Task B', dueDate: '2026-06-11', priority: 'Low', domain: 'Frontend', complexity: 2 }
            ];

            const load = calculateLocalCognitiveLoad(mockUser, activeTasks, timeline);
            
            
            expect(load.schedulingOverlaps).toHaveLength(1);
            expect(load.schedulingOverlaps[0].description).toContain('Deadline collision');
            expect(load.warnings.some(w => w.includes('Timeline collision'))).toBe(true);
        });

        test('should report warning if a task is overdue', () => {
            const overdueDate = new Date();
            overdueDate.setDate(overdueDate.getDate() - 5); 
            const activeTasks = [
                { title: 'Stale task', domain: 'Frontend', taskDna: { estimatedComplexityScore: 3 }, priority: 'Medium', dueDate: overdueDate }
            ];
            const timeline = [];

            const load = calculateLocalCognitiveLoad(mockUser, activeTasks, timeline);
            
            expect(load.warnings).toContain('Task "Stale task" is overdue.');
        });
    });
});
