const Task = require("../models/Task");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
    BRAND,
    normalizeStatus,
    formatDate,
    formatDateTime,
    getPriorityLabel,
    getStatusStyle,
    getPriorityStyle,
    addSectionTitle,
    addReportHeader,
    addSummaryRow,
    styleTableHeader,
    styleBodyRow,
    styleInsightCell,
    getWorkloadBand,
    getCompletionBand,
    styleBandCell,
    addTaskRowsToWorksheet,
    finalizeWorksheet,
    createWorkbook,
    sendWorkbook,
} = require("../services/excelService");

const exportTasksReport = async (req, res) => {
    try {
        const companyId = req.user.companyId || new mongoose.Types.ObjectId();
        const tasks = await Task.find({ companyId })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        const workbook = createWorkbook();
        const executiveWorksheet = workbook.addWorksheet("Executive Summary", {
            properties: { defaultRowHeight: 20 },
        });
        const worksheet = workbook.addWorksheet("Task Report", {
            properties: { defaultRowHeight: 20 },
        });
        const highPriorityWorksheet = workbook.addWorksheet("High Priority Tasks", {
            properties: { defaultRowHeight: 20 },
        });
        const mediumPriorityWorksheet = workbook.addWorksheet("Medium Priority Tasks", {
            properties: { defaultRowHeight: 20 },
        });
        const lowPriorityWorksheet = workbook.addWorksheet("Low Priority Tasks", {
            properties: { defaultRowHeight: 20 },
        });

        executiveWorksheet.columns = [
            { header: "Highlight", key: "highlight", width: 30 },
            { header: "Value", key: "value", width: 26 },
            { header: "Commentary", key: "commentary", width: 76 },
        ];

        worksheet.columns = [
            { header: "Task ID", key: "taskId", width: 26 },
            { header: "Title", key: "title", width: 28 },
            { header: "Description", key: "description", width: 42 },
            { header: "Priority", key: "priority", width: 14 },
            { header: "Priority Bucket", key: "priorityBucket", width: 18 },
            { header: "Status", key: "status", width: 16 },
            { header: "Progress", key: "progress", width: 12 },
            { header: "Progress Band", key: "progressBand", width: 16 },
            { header: "Due Date", key: "dueDate", width: 16 },
            { header: "Assigned To", key: "assignedTo", width: 34 },
            { header: "Created By", key: "createdBy", width: 26 },
        ];

        const prioritySheetColumns = [
            { header: "Task ID", key: "taskId", width: 26 },
            { header: "Title", key: "title", width: 28 },
            { header: "Description", key: "description", width: 42 },
            { header: "Priority", key: "priority", width: 14 },
            { header: "Priority Bucket", key: "priorityBucket", width: 18 },
            { header: "Status", key: "status", width: 16 },
            { header: "Progress", key: "progress", width: 12 },
            { header: "Progress Band", key: "progressBand", width: 16 },
            { header: "Due Date", key: "dueDate", width: 16 },
            { header: "Assigned To", key: "assignedTo", width: 34 },
            { header: "Created By", key: "createdBy", width: 26 },
        ];

        highPriorityWorksheet.columns = prioritySheetColumns;
        mediumPriorityWorksheet.columns = prioritySheetColumns;
        lowPriorityWorksheet.columns = prioritySheetColumns;

        addReportHeader(
            executiveWorksheet,
            "TaskSutra Executive Task Summary",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            worksheet,
            "TaskSutra Task Report",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            highPriorityWorksheet,
            "TaskSutra High Priority Tasks",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            mediumPriorityWorksheet,
            "TaskSutra Medium Priority Tasks",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            lowPriorityWorksheet,
            "TaskSutra Low Priority Tasks",
            `Generated on ${formatDateTime(new Date())}`
        );

        const metrics = {
            total: tasks.length,
            pending: 0,
            inProgress: 0,
            completed: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0,
        };

        tasks.forEach((task) => {
            const normalizedStatus = normalizeStatus(task.status);
            const priorityLabel = getPriorityLabel(task.priority);
            if (normalizedStatus === "completed") metrics.completed += 1;
            else if (
                normalizedStatus === "in progress" ||
                normalizedStatus === "in-progress" ||
                normalizedStatus === "inprogress"
            ) {
                metrics.inProgress += 1;
            } else {
                metrics.pending += 1;
            }

            if (priorityLabel === "High") metrics.highPriority += 1;
            else if (priorityLabel === "Medium") metrics.mediumPriority += 1;
            else metrics.lowPriority += 1;
        });

        const highPriorityTasks = tasks.filter(
            (task) => getPriorityLabel(task.priority) === "High"
        );
        const mediumPriorityTasks = tasks.filter(
            (task) => getPriorityLabel(task.priority) === "Medium"
        );
        const lowPriorityTasks = tasks.filter(
            (task) => getPriorityLabel(task.priority) === "Low"
        );
        const completedTasks = tasks.filter(
            (task) => normalizeStatus(task.status) === "completed"
        );
        const overdueOpenTasks = tasks.filter((task) => {
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            return (
                dueDate &&
                !Number.isNaN(dueDate.getTime()) &&
                dueDate < new Date() &&
                normalizeStatus(task.status) !== "completed"
            );
        });
        const topAssignedTask = [...tasks].sort((a, b) => {
            const aCount = Array.isArray(a.assignedTo) ? a.assignedTo.length : 0;
            const bCount = Array.isArray(b.assignedTo) ? b.assignedTo.length : 0;
            return bCount - aCount;
        })[0];
        const strongestProgressTask = [...tasks].sort(
            (a, b) => Number(b.progress || 0) - Number(a.progress || 0)
        )[0];

        addSummaryRow(executiveWorksheet, [
            { label: "Total Tasks", value: metrics.total },
            { label: "High Priority", value: metrics.highPriority },
            { label: "Open Tasks", value: metrics.pending + metrics.inProgress },
            {
                label: "Completion Rate",
                value:
                    metrics.total > 0
                        ? `${Math.round((metrics.completed / metrics.total) * 100)}%`
                        : "0%",
            },
        ]);
        addSectionTitle(executiveWorksheet, 6, "Portfolio Highlights");
        const executiveHeaderRow = executiveWorksheet.addRow(
            executiveWorksheet.columns.map((column) => column.header)
        );
        styleTableHeader(executiveHeaderRow);
        [
            {
                highlight: "Priority Concentration",
                value: `${metrics.highPriority} High`,
                commentary: `${metrics.highPriority} high-priority tasks require the closest oversight, while ${metrics.mediumPriority} medium and ${metrics.lowPriority} low priority tasks shape the broader workload mix.`,
            },
            {
                highlight: "Completion Snapshot",
                value: `${completedTasks.length} Closed`,
                commentary: `${completedTasks.length} tasks are completed, ${metrics.inProgress} are advancing, and ${metrics.pending} remain not started.`,
            },
            {
                highlight: "Overdue Exposure",
                value: overdueOpenTasks.length,
                commentary: `${overdueOpenTasks.length} open tasks are overdue and may need immediate intervention to protect delivery timelines.`,
            },
            {
                highlight: "Most Distributed Task",
                value: topAssignedTask?.title || "--",
                commentary: topAssignedTask
                    ? `This task is assigned across ${
                          Array.isArray(topAssignedTask.assignedTo)
                              ? topAssignedTask.assignedTo.length
                              : 0
                      } collaborators, making it the broadest shared responsibility item.`
                    : "No assignment distribution data available.",
            },
            {
                highlight: "Furthest Progress",
                value: strongestProgressTask?.title || "--",
                commentary: strongestProgressTask
                    ? `${Number(strongestProgressTask.progress || 0)}% progress makes this the most advanced active work item in the current portfolio.`
                    : "No progress data available.",
            },
        ].forEach((item, index) => {
            const row = executiveWorksheet.addRow(item);
            styleBodyRow(row, index);
            row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
            row.getCell(2).font = {
                name: "Aptos",
                size: 11,
                bold: true,
                color: { argb: BRAND.accent },
            };
            styleInsightCell(row.getCell(3));
        });

        addSummaryRow(worksheet, [
            { label: "Total Tasks", value: metrics.total },
            { label: "High Priority", value: metrics.highPriority },
            { label: "Pending", value: metrics.pending },
            { label: "In Progress", value: metrics.inProgress },
        ]);
        addSummaryRow(highPriorityWorksheet, [
            { label: "Tasks", value: highPriorityTasks.length },
            { label: "Completed", value: highPriorityTasks.filter((task) => normalizeStatus(task.status) === "completed").length },
            { label: "In Progress", value: highPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status === "in progress" || status === "in-progress" || status === "inprogress";
            }).length },
            { label: "Pending", value: highPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status !== "completed" && status !== "in progress" && status !== "in-progress" && status !== "inprogress";
            }).length },
        ]);
        addSummaryRow(mediumPriorityWorksheet, [
            { label: "Tasks", value: mediumPriorityTasks.length },
            { label: "Completed", value: mediumPriorityTasks.filter((task) => normalizeStatus(task.status) === "completed").length },
            { label: "In Progress", value: mediumPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status === "in progress" || status === "in-progress" || status === "inprogress";
            }).length },
            { label: "Pending", value: mediumPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status !== "completed" && status !== "in progress" && status !== "in-progress" && status !== "inprogress";
            }).length },
        ]);
        addSummaryRow(lowPriorityWorksheet, [
            { label: "Tasks", value: lowPriorityTasks.length },
            { label: "Completed", value: lowPriorityTasks.filter((task) => normalizeStatus(task.status) === "completed").length },
            { label: "In Progress", value: lowPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status === "in progress" || status === "in-progress" || status === "inprogress";
            }).length },
            { label: "Pending", value: lowPriorityTasks.filter((task) => {
                const status = normalizeStatus(task.status);
                return status !== "completed" && status !== "in progress" && status !== "in-progress" && status !== "inprogress";
            }).length },
        ]);

        const headerRow = worksheet.addRow(worksheet.columns.map((column) => column.header));
        const highPriorityHeaderRow = highPriorityWorksheet.addRow(
            highPriorityWorksheet.columns.map((column) => column.header)
        );
        const mediumPriorityHeaderRow = mediumPriorityWorksheet.addRow(
            mediumPriorityWorksheet.columns.map((column) => column.header)
        );
        const lowPriorityHeaderRow = lowPriorityWorksheet.addRow(
            lowPriorityWorksheet.columns.map((column) => column.header)
        );

        styleTableHeader(headerRow);
        styleTableHeader(highPriorityHeaderRow);
        styleTableHeader(mediumPriorityHeaderRow);
        styleTableHeader(lowPriorityHeaderRow);

        addTaskRowsToWorksheet(worksheet, tasks);
        addTaskRowsToWorksheet(highPriorityWorksheet, highPriorityTasks);
        addTaskRowsToWorksheet(mediumPriorityWorksheet, mediumPriorityTasks);
        addTaskRowsToWorksheet(lowPriorityWorksheet, lowPriorityTasks);

        finalizeWorksheet(executiveWorksheet, 7);
        finalizeWorksheet(worksheet, 6);
        finalizeWorksheet(highPriorityWorksheet, 6);
        finalizeWorksheet(mediumPriorityWorksheet, 6);
        finalizeWorksheet(lowPriorityWorksheet, 6);
        return sendWorkbook(res, workbook, "task_report.xlsx");
    } catch (error) {
        return res.status(500).json({
            message: "Error exporting tasks report",
            error: error.message,
        });
    }
};

const exportUsersReport = async (req, res) => {
    try {
        const companyId = req.user.companyId || new mongoose.Types.ObjectId();
        const users = await User.find({ role: "member", companyId })
            .select("name email skills _id")
            .lean();
        const userTasks = await Task.find({ companyId })
            .populate("assignedTo", "name email _id")
            .lean();

        const userTaskMap = {};

        users.forEach((user) => {
            userTaskMap[user._id.toString()] = {
                name: user.name || "Unnamed",
                email: user.email || "--",
                skills: Array.isArray(user.skills) && user.skills.length > 0 ? user.skills.join(", ") : "None",
                taskCount: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                completedTasks: 0,
                highPriorityTasks: 0,
                mediumPriorityTasks: 0,
                lowPriorityTasks: 0,
                taskDetails: [],
            };
        });

        userTasks.forEach((task) => {
            if (!Array.isArray(task.assignedTo)) return;

            task.assignedTo.forEach((assignedUser) => {
                const userKey = assignedUser._id.toString();
                const userEntry = userTaskMap[userKey];

                if (!userEntry) return;

                userEntry.taskCount += 1;

                const normalizedStatus = normalizeStatus(task.status);
                const priorityLabel = getPriorityLabel(task.priority);

                if (normalizedStatus === "completed") {
                    userEntry.completedTasks += 1;
                } else if (
                    normalizedStatus === "in progress" ||
                    normalizedStatus === "in-progress" ||
                    normalizedStatus === "inprogress"
                ) {
                    userEntry.inProgressTasks += 1;
                } else {
                    userEntry.pendingTasks += 1;
                }

                if (priorityLabel === "High") {
                    userEntry.highPriorityTasks += 1;
                } else if (priorityLabel === "Medium") {
                    userEntry.mediumPriorityTasks += 1;
                } else {
                    userEntry.lowPriorityTasks += 1;
                }

                userEntry.taskDetails.push({
                    title: task.title || "Untitled Task",
                    status: getStatusStyle(task.status).label,
                    priority: priorityLabel,
                    dueDate: formatDate(task.dueDate),
                });
            });
        });

        const workbook = createWorkbook();
        const executiveWorksheet = workbook.addWorksheet("Executive Summary", {
            properties: { defaultRowHeight: 20 },
        });
        const overviewWorksheet = workbook.addWorksheet("User Report", {
            properties: { defaultRowHeight: 20 },
        });
        const detailsWorksheet = workbook.addWorksheet("User Task Details", {
            properties: { defaultRowHeight: 20 },
        });

        executiveWorksheet.columns = [
            { header: "Highlight", key: "highlight", width: 30 },
            { header: "Value", key: "value", width: 24 },
            { header: "Commentary", key: "commentary", width: 72 },
        ];
        overviewWorksheet.columns = [
            { header: "Rank", key: "rank", width: 10 },
            { header: "User Name", key: "name", width: 28 },
            { header: "Email ID", key: "email", width: 32 },
            { header: "Total Tasks", key: "taskCount", width: 14 },
            { header: "Completed", key: "completedTasks", width: 14 },
            { header: "In Progress", key: "inProgressTasks", width: 14 },
            { header: "Pending", key: "pendingTasks", width: 14 },
            { header: "High Priority", key: "highPriorityTasks", width: 15 },
            { header: "Medium Priority", key: "mediumPriorityTasks", width: 16 },
            { header: "Low Priority", key: "lowPriorityTasks", width: 14 },
            { header: "Workload Band", key: "workloadBand", width: 16 },
            { header: "Delivery Band", key: "completionBand", width: 16 },
            { header: "Completion Rate", key: "completionRate", width: 18 },
            { header: "Skillset", key: "skills", width: 30 },
            { header: "Insights", key: "insights", width: 60 },
        ];

        detailsWorksheet.columns = [
            { header: "User Name", key: "userName", width: 28 },
            { header: "Email ID", key: "email", width: 32 },
            { header: "Task Title", key: "taskTitle", width: 34 },
            { header: "Status", key: "status", width: 16 },
            { header: "Priority", key: "priority", width: 14 },
            { header: "Due Date", key: "dueDate", width: 16 },
        ];

        addReportHeader(
            executiveWorksheet,
            "TaskSutra Executive User Summary",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            overviewWorksheet,
            "TaskSutra User Report",
            `Generated on ${formatDateTime(new Date())}`
        );
        addReportHeader(
            detailsWorksheet,
            "TaskSutra User Task Details",
            `Generated on ${formatDateTime(new Date())}`
        );

        const userRows = Object.values(userTaskMap);
        const totalAssignments = userRows.reduce((sum, user) => sum + user.taskCount, 0);
        const totalPending = userRows.reduce((sum, user) => sum + user.pendingTasks, 0);
        const totalInProgress = userRows.reduce((sum, user) => sum + user.inProgressTasks, 0);
        const totalCompleted = userRows.reduce((sum, user) => sum + user.completedTasks, 0);
        const activeMembers = userRows.filter((user) => user.taskCount > 0).length;
        const topPerformer = [...userRows].sort((a, b) => {
            const aRate = a.taskCount > 0 ? a.completedTasks / a.taskCount : 0;
            const bRate = b.taskCount > 0 ? b.completedTasks / b.taskCount : 0;
            if (bRate !== aRate) return bRate - aRate;
            return b.completedTasks - a.completedTasks;
        })[0];
        const highestLoadUser = [...userRows].sort((a, b) => b.taskCount - a.taskCount)[0];
        const priorityHotspot = [...userRows].sort(
            (a, b) => b.highPriorityTasks - a.highPriorityTasks
        )[0];
        const overallCompletionRate =
            totalAssignments > 0
                ? `${Math.round((totalCompleted / totalAssignments) * 100)}%`
                : "0%";

        addSummaryRow(executiveWorksheet, [
            { label: "Members", value: userRows.length },
            { label: "Active Members", value: activeMembers },
            { label: "Assigned Tasks", value: totalAssignments },
            { label: "Completion Rate", value: overallCompletionRate },
        ]);
        addSectionTitle(executiveWorksheet, 6, "Leadership Snapshot");
        const executiveHeaderRow = executiveWorksheet.addRow(
            executiveWorksheet.columns.map((column) => column.header)
        );
        styleTableHeader(executiveHeaderRow);
        [
            {
                highlight: "Top Performer",
                value: topPerformer?.name || "--",
                commentary: topPerformer
                    ? `${topPerformer.completedTasks} tasks completed with ${
                          topPerformer.taskCount > 0
                              ? Math.round(
                                    (topPerformer.completedTasks / topPerformer.taskCount) * 100
                                )
                              : 0
                      }% completion efficiency.`
                    : "No performance data available yet.",
            },
            {
                highlight: "Highest Workload",
                value: highestLoadUser?.name || "--",
                commentary: highestLoadUser
                    ? `${highestLoadUser.taskCount} total assignments currently sit with this user, making them the busiest member in the current cycle.`
                    : "No workload data available yet.",
            },
            {
                highlight: "Priority Hotspot",
                value: priorityHotspot?.name || "--",
                commentary: priorityHotspot
                    ? `${priorityHotspot.highPriorityTasks} high-priority tasks are concentrated with this user, which may need closer planning attention.`
                    : "No high-priority concentration found.",
            },
            {
                highlight: "Open Work Pool",
                value: `${totalPending + totalInProgress}`,
                commentary: `${totalPending} tasks are pending and ${totalInProgress} are currently moving, giving a clear picture of the active delivery load.`,
            },
        ].forEach((item, index) => {
            const row = executiveWorksheet.addRow(item);
            styleBodyRow(row, index);
            row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
            row.getCell(2).font = {
                name: "Aptos",
                size: 11,
                bold: true,
                color: { argb: BRAND.accent },
            };
            styleInsightCell(row.getCell(3));
        });

        addSummaryRow(overviewWorksheet, [
            { label: "Members", value: userRows.length },
            { label: "Assigned Tasks", value: totalAssignments },
            { label: "In Progress", value: totalInProgress },
            { label: "Pending", value: totalPending },
        ]);
        addSummaryRow(detailsWorksheet, [
            { label: "Members", value: userRows.length },
            { label: "Assigned Tasks", value: totalAssignments },
            { label: "Completed", value: totalCompleted },
        ]);

        const overviewHeaderRow = overviewWorksheet.addRow(
            overviewWorksheet.columns.map((column) => column.header)
        );
        const detailsHeaderRow = detailsWorksheet.addRow(
            detailsWorksheet.columns.map((column) => column.header)
        );

        styleTableHeader(overviewHeaderRow);
        styleTableHeader(detailsHeaderRow);

        const rankedUsers = [...userRows].sort((a, b) => {
            const aRate = a.taskCount > 0 ? a.completedTasks / a.taskCount : 0;
            const bRate = b.taskCount > 0 ? b.completedTasks / b.taskCount : 0;
            if (bRate !== aRate) return bRate - aRate;
            if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
            return b.taskCount - a.taskCount;
        });

        rankedUsers.forEach((user, index) => {
            const completionPercentage =
                user.taskCount > 0
                    ? Math.round((user.completedTasks / user.taskCount) * 100)
                    : 0;
            const completionRate = `${completionPercentage}%`;
            const workloadBand = getWorkloadBand(user.taskCount);
            const completionBand = getCompletionBand(completionPercentage);

            const insightParts = [
                `Ranked #${index + 1} in current output view`,
                `${user.completedTasks} completed`,
                `${user.inProgressTasks} in progress`,
                `${user.pendingTasks} pending`,
                `Priority mix: H ${user.highPriorityTasks}, M ${user.mediumPriorityTasks}, L ${user.lowPriorityTasks}`,
            ];

            const overviewRow = overviewWorksheet.addRow({
                rank: index + 1,
                name: user.name,
                email: user.email,
                taskCount: user.taskCount,
                completedTasks: user.completedTasks,
                inProgressTasks: user.inProgressTasks,
                pendingTasks: user.pendingTasks,
                highPriorityTasks: user.highPriorityTasks,
                mediumPriorityTasks: user.mediumPriorityTasks,
                lowPriorityTasks: user.lowPriorityTasks,
                workloadBand,
                completionBand,
                completionRate,
                skills: user.skills,
                insights:
                    user.taskCount > 0
                        ? insightParts.join(" | ")
                        : "No tasks assigned yet",
            });

            styleBodyRow(overviewRow, index);

            const rankCell = overviewRow.getCell(1);
            const completedCell = overviewRow.getCell(5);
            const progressCell = overviewRow.getCell(6);
            const pendingCell = overviewRow.getCell(7);
            const highPriorityCell = overviewRow.getCell(8);
            const mediumPriorityCell = overviewRow.getCell(9);
            const lowPriorityCell = overviewRow.getCell(10);
            const workloadBandCell = overviewRow.getCell(11);
            const completionBandCell = overviewRow.getCell(12);
            const rateCell = overviewRow.getCell(13);
            const insightsCell = overviewRow.getCell(15);

            [
                rankCell,
                completedCell,
                progressCell,
                pendingCell,
                highPriorityCell,
                mediumPriorityCell,
                lowPriorityCell,
                workloadBandCell,
                completionBandCell,
                rateCell,
            ].forEach((cell) => {
                cell.alignment = { vertical: "middle", horizontal: "center" };
                cell.font = {
                    name: "Aptos",
                    size: 10,
                    bold: true,
                    color: { argb: BRAND.text },
                };
            });

            rankCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "EDF4FF" },
            };
            rankCell.font = {
                name: "Aptos",
                size: 10,
                bold: true,
                color: { argb: BRAND.accent },
            };

            pendingCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: BRAND.warningSoft },
            };
            progressCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: BRAND.infoSoft },
            };
            completedCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: BRAND.successSoft },
            };
            highPriorityCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: BRAND.dangerSoft },
            };
            mediumPriorityCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF4E5" },
            };
            lowPriorityCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E8F5E9" },
            };
            rateCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: BRAND.accentSoft },
            };
            rateCell.font = {
                name: "Aptos",
                size: 10,
                bold: true,
                color: { argb: BRAND.accent },
            };
            styleBandCell(workloadBandCell, "workload", workloadBand);
            styleBandCell(completionBandCell, "completion", completionBand);
            styleInsightCell(insightsCell);

            if (user.taskDetails.length === 0) {
                const detailRow = detailsWorksheet.addRow({
                    userName: user.name,
                    email: user.email,
                    taskTitle: "--",
                    status: "No Tasks",
                    priority: "--",
                    dueDate: "--",
                });

                styleBodyRow(detailRow, index);
                return;
            }

            user.taskDetails.forEach((taskDetail, detailIndex) => {
                const detailRow = detailsWorksheet.addRow({
                    userName: user.name,
                    email: user.email,
                    taskTitle: taskDetail.title,
                    status: taskDetail.status,
                    priority: taskDetail.priority,
                    dueDate: taskDetail.dueDate,
                });

                styleBodyRow(detailRow, index + detailIndex);

                const detailStatusCell = detailRow.getCell(4);
                const detailPriorityCell = detailRow.getCell(5);
                const detailStatusStyle = getStatusStyle(taskDetail.status);
                const detailPriorityStyle = getPriorityStyle(taskDetail.priority);

                detailStatusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: detailStatusStyle.fill },
                };
                detailStatusCell.font = {
                    name: "Aptos",
                    size: 10,
                    bold: true,
                    color: { argb: detailStatusStyle.font },
                };
                detailStatusCell.alignment = {
                    vertical: "middle",
                    horizontal: "center",
                };

                detailPriorityCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: detailPriorityStyle.fill },
                };
                detailPriorityCell.font = {
                    name: "Aptos",
                    size: 10,
                    bold: true,
                    color: { argb: detailPriorityStyle.font },
                };
                detailPriorityCell.alignment = {
                    vertical: "middle",
                    horizontal: "center",
                };
            });
        });

        finalizeWorksheet(executiveWorksheet, 7);
        finalizeWorksheet(overviewWorksheet, 6);
        finalizeWorksheet(detailsWorksheet, 6);
        return sendWorkbook(res, workbook, "user_report.xlsx");
    } catch (error) {
        return res.status(500).json({
            message: "Error exporting users report",
            error: error.message,
        });
    }
};

module.exports = {
    exportTasksReport,
    exportUsersReport,
};
