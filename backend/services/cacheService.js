const redisClient = require('../config/redis');

/**
 * Service to manage cache invalidation and helper methods
 */
const cacheService = {
    /**
     * Invalidates all dashboard caches (both admin and user) associated with a company
     * @param {string|ObjectId} companyId - The ID of the company
     */
    invalidateCompanyDashboards: async (companyId) => {
        if (!companyId) return;
        const pattern = `dashboard:${companyId.toString()}:*`;
        await redisClient.delWildcard(pattern);
    }
};

module.exports = cacheService;
