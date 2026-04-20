const Task = require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");

const BRAND = {
    accent: "1368EC",
    accentSoft: "DCEBFF",
    surface: "F8FAFC",
    border: "D9E2F1",
    text: "0F172A",
    muted: "64748B",
    success: "16A34A",
    successSoft: "DCFCE7",
    warning: "D97706",
    warningSoft: "FEF3C7",
    info: "0891B2",
    infoSoft: "CFFAFE",
    danger: "DC2626",
    dangerSoft: "FEE2E2",
    white: "FFFFFF",
};

const normalizeStatus = (status = "") => status.trim().toLowerCase();

const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);
};

const formatDateTime = (value) => {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
};

const getPriorityLabel = (priority = "") => {
    const normalized = priority.trim().toLowerCase();

    if (normalized === "high") return "High";
    if (normalized === "medium") return "Medium";
    return "Low";
};

const getStatusStyle = (status = "") => {
    const normalized = normalizeStatus(status);

    if (normalized === "completed") {
        return {
            fill: BRAND.successSoft,
            font: BRAND.success,
            label: "Completed",
        };
    }

    if (
        normalized === "in progress" ||
        normalized === "in-progress" ||
        normalized === "inprogress"
    ) {
        return {
            fill: BRAND.infoSoft,
            font: BRAND.info,
            label: "In Progress",
        };
    }

    return {
        fill: BRAND.warningSoft,
        font: BRAND.warning,
        label: "Pending",
    };
};

const getPriorityStyle = (priority = "") => {
    const normalized = priority.trim().toLowerCase();

    if (normalized === "high") {
        return { fill: BRAND.dangerSoft, font: BRAND.danger, label: "High" };
    }

    if (normalized === "medium") {
        return { fill: "FFF4E5", font: BRAND.warning, label: "Medium" };
    }

    return { fill: "E8F5E9", font: BRAND.success, label: "Low" };
};

const applyCellBorder = (cell) => {
    cell.border = {
        top: { style: "thin", color: { argb: BRAND.border } },
        left: { style: "thin", color: { argb: BRAND.border } },
        bottom: { style: "thin", color: { argb: BRAND.border } },
        right: { style: "thin", color: { argb: BRAND.border } },
    };
};

const styleMetricCell = (cell, isLabel = false) => {
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BRAND.surface },
    };
    cell.font = isLabel
        ? { name: "Aptos", size: 10, color: { argb: BRAND.muted }, bold: true }
        : { name: "Aptos", size: 16, color: { argb: BRAND.text }, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    applyCellBorder(cell);
};

const addSectionTitle = (worksheet, rowNumber, title) => {
    const lastColumn = getExcelColumnLabel(worksheet.columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastColumn}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = title;
    cell.font = {
        name: "Aptos",
        size: 11,
        bold: true,
        color: { argb: BRAND.accent },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F8FF" },
    };
    applyCellBorder(cell);
    worksheet.getRow(rowNumber).height = 20;
};

const getExcelColumnLabel = (columnNumber) => {
    let label = "";
    let current = columnNumber;

    while (current > 0) {
        const remainder = (current - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        current = Math.floor((current - 1) / 26);
    }

    return label;
};

const addReportHeader = (worksheet, title, subtitle) => {
    const lastColumn = getExcelColumnLabel(worksheet.columnCount);

    worksheet.mergeCells(`A1:${lastColumn}1`);
    worksheet.getCell("A1").value = title;
    worksheet.getCell("A1").font = {
        name: "Aptos Display",
        size: 18,
        bold: true,
        color: { argb: BRAND.white },
    };
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BRAND.accent },
    };

    worksheet.mergeCells(`A2:${lastColumn}2`);
    worksheet.getCell("A2").value = subtitle;
    worksheet.getCell("A2").font = {
        name: "Aptos",
        size: 10,
        color: { argb: BRAND.muted },
        italic: true,
    };
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };

    worksheet.getRow(1).height = 28;
    worksheet.getRow(2).height = 20;
};

const addSummaryRow = (worksheet, metrics) => {
    const rowLabel = worksheet.addRow(metrics.flatMap((metric) => [metric.label, ""]));
    const rowValue = worksheet.addRow(metrics.flatMap((metric) => [metric.value, ""]));

    rowLabel.height = 20;
    rowValue.height = 24;

    for (let index = 1; index <= metrics.length * 2; index += 2) {
        worksheet.mergeCells(rowLabel.number, index, rowLabel.number, index + 1);
        worksheet.mergeCells(rowValue.number, index, rowValue.number, index + 1);

        styleMetricCell(worksheet.getCell(rowLabel.number, index), true);
        styleMetricCell(worksheet.getCell(rowValue.number, index), false);
    }

    worksheet.addRow([]);
};

const styleTableHeader = (row) => {
    row.height = 22;
    row.eachCell((cell) => {
        cell.font = {
            name: "Aptos",
            size: 10,
            bold: true,
            color: { argb: BRAND.white },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: BRAND.text },
        };
        applyCellBorder(cell);
    });
};

const styleBodyRow = (row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;

    row.eachCell((cell) => {
        cell.font = {
            name: "Aptos",
            size: 10,
            color: { argb: BRAND.text },
        };
        cell.alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
        };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isEven ? "FFFFFF" : "F8FBFF" },
        };
        applyCellBorder(cell);
    });
};

const styleInsightCell = (cell) => {
    cell.font = {
        name: "Aptos",
        size: 10,
        color: { argb: BRAND.text },
        italic: true,
    };
    cell.alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
    };
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F7FAFF" },
    };
    applyCellBorder(cell);
};

const getWorkloadBand = (taskCount) => {
    if (taskCount >= 8) return "Heavy";
    if (taskCount >= 4) return "Balanced";
    if (taskCount >= 1) return "Light";
    return "Idle";
};

const getCompletionBand = (percentage) => {
    if (percentage >= 80) return "Strong";
    if (percentage >= 50) return "Healthy";
    if (percentage > 0) return "Needs Attention";
    return "Not Started";
};

const styleBandCell = (cell, type, value) => {
    let fill = BRAND.surface;
    let font = BRAND.text;

    if (type === "workload") {
        if (value === "Heavy") {
            fill = BRAND.dangerSoft;
            font = BRAND.danger;
        } else if (value === "Balanced") {
            fill = BRAND.infoSoft;
            font = BRAND.info;
        } else if (value === "Light") {
            fill = BRAND.successSoft;
            font = BRAND.success;
        } else {
            fill = BRAND.surface;
            font = BRAND.muted;
        }
    }

    if (type === "completion") {
        if (value === "Strong") {
            fill = BRAND.successSoft;
            font = BRAND.success;
        } else if (value === "Healthy") {
            fill = BRAND.infoSoft;
            font = BRAND.info;
        } else if (value === "Needs Attention") {
            fill = BRAND.warningSoft;
            font = BRAND.warning;
        } else {
            fill = BRAND.surface;
            font = BRAND.muted;
        }
    }

    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
    };
    cell.font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: { argb: font },
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
};

const getPriorityBucketLabel = (priority = "") => {
    const normalized = priority.trim().toLowerCase();

    if (normalized === "high") return "High Priority";
    if (normalized === "medium") return "Medium Priority";
    return "Low Priority";
};

const getTaskProgressBand = (progress = 0) => {
    const numericProgress = Number(progress) || 0;

    if (numericProgress >= 100) return "Closed";
    if (numericProgress >= 70) return "Near Finish";
    if (numericProgress > 0) return "Active";
    return "Not Started";
};

const styleProgressBandCell = (cell, value) => {
    let fill = BRAND.surface;
    let font = BRAND.muted;

    if (value === "Closed") {
        fill = BRAND.successSoft;
        font = BRAND.success;
    } else if (value === "Near Finish") {
        fill = BRAND.infoSoft;
        font = BRAND.info;
    } else if (value === "Active") {
        fill = BRAND.warningSoft;
        font = BRAND.warning;
    }

    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
    };
    cell.font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: { argb: font },
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
};

const styleTaskPriorityCell = (cell, priority) => {
    const priorityStyle = getPriorityStyle(priority);

    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: priorityStyle.fill },
    };
    cell.font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: { argb: priorityStyle.font },
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
};

const styleTaskStatusCell = (cell, status) => {
    const statusStyle = getStatusStyle(status);

    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusStyle.fill },
    };
    cell.font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: { argb: statusStyle.font },
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
};

const addTaskRowsToWorksheet = (worksheet, tasks, startIndex = 0) => {
    tasks.forEach((task, index) => {
        const assignedTo = Array.isArray(task.assignedTo)
            ? task.assignedTo.map((user) => `${user.name} (${user.email})`).join(", ")
            : "Unassigned";

        const createdBy = task.createdBy
            ? `${task.createdBy.name} (${task.createdBy.email})`
            : "Admin";

        const progressBand = getTaskProgressBand(task.progress);

        const row = worksheet.addRow({
            taskId: task._id.toString(),
            title: task.title || "--",
            description: task.description || "--",
            priority: getPriorityLabel(task.priority),
            priorityBucket: getPriorityBucketLabel(task.priority),
            status: getStatusStyle(task.status).label,
            progress: `${Number(task.progress || 0)}%`,
            progressBand,
            dueDate: formatDate(task.dueDate),
            assignedTo: assignedTo || "Unassigned",
            createdBy,
        });

        styleBodyRow(row, startIndex + index);

        styleTaskPriorityCell(row.getCell(4), task.priority);
        row.getCell(4).value = getPriorityLabel(task.priority);
        row.getCell(5).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F3F8FF" },
        };
        row.getCell(5).font = {
            name: "Aptos",
            size: 10,
            bold: true,
            color: { argb: BRAND.accent },
        };
        row.getCell(5).alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        styleTaskStatusCell(row.getCell(6), task.status);
        row.getCell(6).value = getStatusStyle(task.status).label;
        styleProgressBandCell(row.getCell(8), progressBand);
    });
};

const finalizeWorksheet = (worksheet, headerRowNumber) => {
    worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
    worksheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: worksheet.columnCount },
    };
    worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
            left: 0.3,
            right: 0.3,
            top: 0.4,
            bottom: 0.4,
            header: 0.2,
            footer: 0.2,
        },
    };
};

const createWorkbook = () => {
    const workbook = new excelJS.Workbook();
    workbook.creator = "TaskSutra";
    workbook.company = "TaskSutra";
    workbook.lastModifiedBy = "TaskSutra";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
    return workbook;
};

const sendWorkbook = async (res, workbook, filename) => {
    res.status(200);
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
};

const exportTasksReport = async (req, res) => {
    try {
        const tasks = await Task.find()
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
        const users = await User.find({ role: "member" })
            .select("name email _id")
            .lean();
        const userTasks = await Task.find()
            .populate("assignedTo", "name email _id")
            .lean();

        const userTaskMap = {};

        users.forEach((user) => {
            userTaskMap[user._id.toString()] = {
                name: user.name || "Unnamed",
                email: user.email || "--",
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
            const insightsCell = overviewRow.getCell(14);

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
