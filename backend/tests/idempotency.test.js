const { checkIdempotency } = require('../middlewares/idempotencyMiddleware');
const ProcessedTransaction = require('../models/ProcessedTransaction');
const Task = require('../models/Task');

// Mock the Mongoose models
jest.mock('../models/ProcessedTransaction');
jest.mock('../models/Task');

describe('Idempotency Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        req = {
            headers: {},
            body: {},
            params: { id: 'task-id-123' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    test('should bypass checks and call next() if no transaction ID is present', async () => {
        await checkIdempotency(req, res, next);

        expect(ProcessedTransaction.create).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('should record transaction ID and call next() if transaction ID is unique', async () => {
        req.headers['x-transaction-id'] = 'unique-tx-uuid-001';
        ProcessedTransaction.create.mockResolvedValue({ transactionId: 'unique-tx-uuid-001' });

        await checkIdempotency(req, res, next);

        expect(ProcessedTransaction.create).toHaveBeenCalledWith({ transactionId: 'unique-tx-uuid-001' });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('should fetch and return 200 OK with task state if transaction ID is a duplicate', async () => {
        req.body.transactionId = 'duplicate-tx-uuid-999';

        // Simulate MongoDB Duplicate Key Error (code 11000)
        const duplicateKeyError = new Error('Duplicate key error');
        duplicateKeyError.code = 11000;
        ProcessedTransaction.create.mockRejectedValue(duplicateKeyError);

        // Mock Task.findById chain
        const mockTask = {
            _id: 'task-id-123',
            title: 'Test Idempotent Task',
            status: 'Completed'
        };
        const mockPopulate = jest.fn().mockResolvedValue(mockTask);
        Task.findById.mockReturnValue({
            populate: mockPopulate
        });

        await checkIdempotency(req, res, next);

        expect(ProcessedTransaction.create).toHaveBeenCalledWith({ transactionId: 'duplicate-tx-uuid-999' });
        expect(Task.findById).toHaveBeenCalledWith('task-id-123');
        expect(mockPopulate).toHaveBeenCalledWith('assignedTo', 'name email profileImageUrl');
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Task updated successfully (idempotent)',
            task: mockTask,
            reconciled: false,
            idempotent: true
        });
    });

    test('should return 404 if duplicate transaction references a non-existent task', async () => {
        req.headers['x-transaction-id'] = 'duplicate-tx-uuid-888';

        const duplicateKeyError = new Error('Duplicate key error');
        duplicateKeyError.code = 11000;
        ProcessedTransaction.create.mockRejectedValue(duplicateKeyError);

        const mockPopulate = jest.fn().mockResolvedValue(null);
        Task.findById.mockReturnValue({
            populate: mockPopulate
        });

        await checkIdempotency(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
        expect(next).not.toHaveBeenCalled();
    });

    test('should return 500 error if writing to ProcessedTransaction fails with other DB errors', async () => {
        req.headers['x-transaction-id'] = 'some-tx-id';
        const generalDbError = new Error('Database connection failed');
        ProcessedTransaction.create.mockRejectedValue(generalDbError);

        await checkIdempotency(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Idempotency validation error',
            error: 'Database connection failed'
        });
    });
});
