const {
    registerSchema,
    loginSchema,
    taskStatusUpdateSchema,
    taskChecklistUpdateSchema
} = require('../middlewares/validationMiddleware');

describe('Joi Request Validation Schemas', () => {
    
    describe('Registration Schema', () => {
        test('should validate a correct registration payload', () => {
            const payload = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                profileImageUrl: 'https://example.com/pic.jpg',
                inviteToken: 'abc-123-token'
            };
            const { error, value } = registerSchema.validate(payload);
            expect(error).toBeUndefined();
            expect(value.email).toBe('john@example.com');
        });

        test('should allow empty profileImageUrl and inviteToken', () => {
            const payload = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                profileImageUrl: '',
                inviteToken: ''
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeUndefined();
        });

        test('should require name, email, and password', () => {
            const payload = {
                email: 'john@example.com',
                password: 'password123'
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"name" is required');
        });

        test('should enforce email format', () => {
            const payload = {
                name: 'John Doe',
                email: 'not-an-email',
                password: 'password123'
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"email" must be a valid email');
        });

        test('should enforce password length of at least 6 characters', () => {
            const payload = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123'
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"password" length must be at least 6 characters long');
        });
    });

    describe('Login Schema', () => {
        test('should validate a correct login payload', () => {
            const payload = {
                email: 'john@example.com',
                password: 'password123'
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeUndefined();
        });

        test('should require email and password', () => {
            const payload = {
                email: 'john@example.com'
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"password" is required');
        });

        test('should enforce email format for login', () => {
            const payload = {
                email: 'not-an-email',
                password: 'password123'
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"email" must be a valid email');
        });
    });

    describe('Task Status Update Schema', () => {
        test('should validate a correct status update', () => {
            const payload = {
                status: 'In-progress',
                transactionId: 'tx-uuid-1234'
            };
            const { error } = taskStatusUpdateSchema.validate(payload);
            expect(error).toBeUndefined();
        });

        test('should validate status update with vectorClock', () => {
            const payload = {
                status: 'Completed',
                vectorClock: { 'user-1': 5, 'user-2': 10 },
                transactionId: 'tx-uuid-1234'
            };
            const { error } = taskStatusUpdateSchema.validate(payload);
            expect(error).toBeUndefined();
        });

        test('should fail if all fields are missing', () => {
            const payload = {};
            const { error } = taskStatusUpdateSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('must have at least 1 key');
        });

        test('should fail with an invalid status', () => {
            const payload = {
                status: 'Not-A-Status'
            };
            const { error } = taskStatusUpdateSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"status" must be one of');
        });
    });

    describe('Task Checklist Update Schema', () => {
        test('should validate a correct checklist update', () => {
            const payload = {
                todoCheckList: [
                    { text: 'Write Unit Tests', completed: true },
                    { text: 'Verify Execution', completed: false }
                ]
            };
            const { error } = taskChecklistUpdateSchema.validate(payload);
            expect(error).toBeUndefined();
        });

        test('should require a text field for todo items', () => {
            const payload = {
                todoCheckList: [
                    { completed: true }
                ]
            };
            const { error } = taskChecklistUpdateSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error.message).toContain('"todoCheckList[0].text" is required');
        });

        test('should validate checklist update with vectorClock', () => {
            const payload = {
                todoChecklist: [
                    { text: 'Test checklist', completed: true }
                ],
                vectorClock: { 'user-1': 1 }
            };
            const { error } = taskChecklistUpdateSchema.validate(payload);
            expect(error).toBeUndefined();
        });
    });
});
