const calculateLocalRecommendations = (teamWorkloads, title, description) => {
    const textToMatch = `${title} ${description || ""}`.toLowerCase();

    return teamWorkloads.map(w => {
        const matchingSkills = [];
        if (Array.isArray(w.skills)) {
            w.skills.forEach(skill => {
                if (skill && textToMatch.includes(skill.toLowerCase())) {
                    matchingSkills.push(skill);
                }
            });
        }

        // Base score starts at 60
        let score = 60;
        // Add 15 points per matched skill, capped at +30
        score += Math.min(30, matchingSkills.length * 15);
        // Deduct 10 points per active task, capped at -40
        const activeCount = w.activeTasks || 0;
        score -= Math.min(40, activeCount * 10);
        // Clamp between 15 and 95
        score = Math.max(15, Math.min(95, score));

        const reasoning = matchingSkills.length > 0
            ? `Matched skill(s) [${matchingSkills.join(", ")}] with ${activeCount} active task(s).`
            : `Matched on active workload of ${activeCount} task(s).`;

        return {
            developerId: w._id.toString(),
            score,
            matchingSkills,
            reasoning
        };
    });
};

const calculateLocalCognitiveLoad = (user, activeTasks, deadlinesTimeline) => {
    const now = new Date();
    let deliveryProbability = 100;
    let cognitiveLoadScore = 0;
    const warnings = [];
    const schedulingOverlaps = [];

    // 1. Analyze domains for context-switching
    const domains = new Set();
    activeTasks.forEach(t => {
        if (t.domain) {
            domains.add(t.domain);
        } else {
            domains.add("Frontend");
        }
    });

    const detectedDomains = Array.from(domains);
    const domainCount = detectedDomains.length;
    const contextSwitchPenalty = Math.max(0, (domainCount - 1) * 10);
    deliveryProbability -= contextSwitchPenalty;

    if (contextSwitchPenalty > 0) {
        warnings.push(`Context-switching penalty applied for working across ${domainCount} domains.`);
    }

    activeTasks.forEach(task => {
        let taskPenalty = 0;
        const complexity = task.taskDna?.estimatedComplexityScore || 5;

        cognitiveLoadScore += complexity * 6;

        if (task.priority === 'High') {
            cognitiveLoadScore += 15;
            taskPenalty += 12;
        } else if (task.priority === 'Medium') {
            cognitiveLoadScore += 8;
            taskPenalty += 6;
        } else {
            cognitiveLoadScore += 3;
            taskPenalty += 2;
        }

        if (task.dueDate && new Date(task.dueDate) < now) {
            taskPenalty += 15;
            warnings.push(`Task "${task.title}" is overdue.`);
        }

        deliveryProbability -= taskPenalty;
    });

    for (let i = 0; i < deadlinesTimeline.length; i++) {
        for (let j = i + 1; j < deadlinesTimeline.length; j++) {
            if (!deadlinesTimeline[i].dueDate || !deadlinesTimeline[j].dueDate) continue;
            const date1 = new Date(deadlinesTimeline[i].dueDate);
            const date2 = new Date(deadlinesTimeline[j].dueDate);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 2) {
                const overlapDesc = `Deadline collision: "${deadlinesTimeline[i].title}" and "${deadlinesTimeline[j].title}" are due within ${diffDays} day(s) of each other.`;
                schedulingOverlaps.push({ description: overlapDesc });
                deliveryProbability -= 10;
                cognitiveLoadScore += 8;
                warnings.push(`Timeline collision on tasks due near ${new Date(deadlinesTimeline[i].dueDate).toLocaleDateString()}.`);
            }
        }
    }

    const lateRate = user.behavioralProfile?.performanceMetrics?.lateSubmissionRate || 0;
    deliveryProbability -= Math.round(lateRate * 0.4);

    deliveryProbability = Math.max(10, Math.min(98, deliveryProbability));
    cognitiveLoadScore = Math.max(5, Math.min(95, cognitiveLoadScore));

    let assessment = "";
    if (cognitiveLoadScore > 75) {
        assessment = `Critical cognitive load with high risk of delivery delays. Needs workload rebalancing immediately.`;
    } else if (cognitiveLoadScore > 40) {
        assessment = `Moderate load. Multi-tasking across ${domainCount} domains requires careful deadline monitoring.`;
    } else {
        assessment = `Optimal capacity. Workload is well-distributed and deadlines are clear.`;
    }

    return {
        deliveryProbability,
        cognitiveLoadScore,
        detectedDomains,
        contextSwitchPenalty,
        deadlinesTimeline,
        schedulingOverlaps,
        warnings,
        assessment
    };
};

module.exports = {
    calculateLocalRecommendations,
    calculateLocalCognitiveLoad
};
