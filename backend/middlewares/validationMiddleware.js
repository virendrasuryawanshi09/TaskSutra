const Joi = require('joi');

const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ message: errorMessage });
        }

        req.body = value;
        next();
    };
};

const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ message: errorMessage });
        }

        req.params = value;
        next();
    };
};

// Authentication schemas
const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    profileImageUrl: Joi.string().uri().allow('').optional(),
    inviteToken: Joi.string().trim().allow('').optional()
});

const loginSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().required()
});

// Todo Item Schema (used inside task schemas)
const todoItemSchema = Joi.object({
    _id: Joi.string().trim().optional(),
    id: Joi.string().trim().optional(),
    text: Joi.string().trim().required(),
    completed: Joi.boolean().default(false)
});

// Task status update schema
const taskStatusUpdateSchema = Joi.object({
    status: Joi.string().trim().valid(
        'Pending', 'In-progress', 'Completed',
        'pending', 'in-progress', 'inprogress', 'completed'
    ).optional(),
    vectorClock: Joi.object().pattern(
        Joi.string(),
        Joi.number().integer().min(0)
    ).optional(),
    transactionId: Joi.string().trim().optional(),
    
    // Allow additional task fields just in case status update triggers standard synchronization
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().allow('').optional(),
    priority: Joi.string().trim().valid('Low', 'Medium', 'High', 'low', 'medium', 'high').optional(),
    dueDate: Joi.date().iso().allow(null, '').optional(),
    progress: Joi.number().integer().min(0).max(100).optional(),
    todoCheckList: Joi.array().items(todoItemSchema).optional(),
    todoChecklist: Joi.array().items(todoItemSchema).optional()
}).min(1); // At least one field is required

// Task checklist update schema
const taskChecklistUpdateSchema = Joi.object({
    todoCheckList: Joi.array().items(todoItemSchema).optional(),
    todoChecklist: Joi.array().items(todoItemSchema).optional(),
    vectorClock: Joi.object().pattern(
        Joi.string(),
        Joi.number().integer().min(0)
    ).optional(),
    transactionId: Joi.string().trim().optional(),

    // Allow additional task fields just in case checklist update triggers standard synchronization
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().allow('').optional(),
    priority: Joi.string().trim().valid('Low', 'Medium', 'High', 'low', 'medium', 'high').optional(),
    status: Joi.string().trim().valid(
        'Pending', 'In-progress', 'Completed',
        'pending', 'in-progress', 'inprogress', 'completed'
    ).optional(),
    dueDate: Joi.date().iso().allow(null, '').optional(),
    progress: Joi.number().integer().min(0).max(100).optional()
}).min(1); // At least one field is required

module.exports = {
    validateBody,
    validateParams,
    registerSchema,
    loginSchema,
    taskStatusUpdateSchema,
    taskChecklistUpdateSchema
};
