const ProcessedTransaction = require('../models/ProcessedTransaction');
const Task = require('../models/Task');

const checkIdempotency = async (req, res, next) => {
    const transactionId = req.headers['x-transaction-id'] || req.body.transactionId;

    if (!transactionId) {
        return next();
    }

    try {
        // Attempt to register the transaction ID
        await ProcessedTransaction.create({ transactionId });
        next();
    } catch (error) {
        // Code 11000 is mongoose/mongodb duplicate key error
        if (error.code === 11000) {
            console.log(`Intercepted duplicate request with transactionId: ${transactionId}`);
            
            try {
                // Retrieve current state of task to return
                const task = await Task.findById(req.params.id).populate(
                    'assignedTo',
                    'name email profileImageUrl'
                );
                if (!task) {
                    return res.status(404).json({ message: 'Task not found' });
                }
                
                return res.status(200).json({
                    message: 'Task updated successfully (idempotent)',
                    task,
                    reconciled: false,
                    idempotent: true
                });
            } catch (dbError) {
                return res.status(500).json({
                    message: 'Error fetching task state for idempotent response',
                    error: dbError.message
                });
            }
        }
        
        return res.status(500).json({
            message: 'Idempotency validation error',
            error: error.message
        });
    }
};

module.exports = {
    checkIdempotency
};
