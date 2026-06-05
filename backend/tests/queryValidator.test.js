const { validatePipeline } = require('../services/queryValidator');

describe('Query Validator Security Sandbox', () => {
    test('should allow safe, standard read-only aggregation pipelines', () => {
        const pipeline = [
            { $match: { status: 'Completed', progress: { $gt: 50 } } },
            { $group: { _id: '$priority', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ];
        const result = validatePipeline(pipeline);
        expect(result.valid).toBe(true);
    });

    test('should block dangerous modification stages ($out, $merge)', () => {
        const outPipeline = [
            { $match: { role: 'member' } },
            { $out: 'compromised_collection' }
        ];
        const mergePipeline = [
            { $match: { role: 'member' } },
            { $merge: { into: 'users', on: '_id', whenMatched: 'replace' } }
        ];

        const outResult = validatePipeline(outPipeline);
        const mergeResult = validatePipeline(mergePipeline);

        expect(outResult.valid).toBe(false);
        expect(outResult.error).toContain('Unauthorized pipeline operator "$out"');
        expect(mergeResult.valid).toBe(false);
        expect(mergeResult.error).toContain('Unauthorized pipeline operator "$merge"');
    });

    test('should block dangerous functions or scripting ($function, $accumulator, mapReduce)', () => {
        const funcPipeline = [
            {
                $addFields: {
                    customField: {
                        $function: {
                            body: 'function(x) { return x; }',
                            args: ['$name'],
                            lang: 'js'
                        }
                    }
                }
            }
        ];
        const result = validatePipeline(funcPipeline);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Dangerous operators or strings detected');
    });

    test('should block unauthorized joins ($lookup outside users and tasks)', () => {
        const badLookupPipeline = [
            {
                $lookup: {
                    from: 'companies',
                    localField: 'companyId',
                    foreignField: '_id',
                    as: 'companyDetails'
                }
            }
        ];
        const goodLookupPipeline = [
            {
                $lookup: {
                    from: 'users', 
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'assigneeDetails'
                }
            }
        ];

        const badResult = validatePipeline(badLookupPipeline);
        const goodResult = validatePipeline(goodLookupPipeline);

        expect(badResult.valid).toBe(false);
        expect(badResult.error).toContain('Unauthorized join target "companies"');
        expect(goodResult.valid).toBe(true);
    });

    test('should reject pipelines referencing sensitive fields in projection keys', () => {
        const passwordPipeline = [
            { $project: { password: 1, name: 1 } }
        ];
        const saltPipeline = [
            { $project: { salt: 1, email: 1 } }
        ];

        const pwResult = validatePipeline(passwordPipeline);
        const saltResult = validatePipeline(saltPipeline);

        expect(pwResult.valid).toBe(false);
        expect(pwResult.error).toContain('Sensitive field reference');
        expect(saltResult.valid).toBe(false);
        expect(saltResult.error).toContain('Sensitive field reference');
    });

    test('should reject pipelines matching or querying sensitive fields', () => {
        const matchPasswordPipeline = [
            { $match: { password: { $ne: null } } }
        ];
        const result = validatePipeline(matchPasswordPipeline);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Sensitive field reference');
    });

    test('should reject pipelines containing token or secret keywords in values (prevent prompt injection extracts)', () => {
        const tokenPipeline = [
            { $match: { description: 'Here is the reset-token' } }
        ];
        const result = validatePipeline(tokenPipeline);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Sensitive field reference');
    });
});
