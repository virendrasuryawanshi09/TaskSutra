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

module.exports = {
    BRAND,
    normalizeStatus,
    formatDate,
    formatDateTime,
    getPriorityLabel,
    getStatusStyle,
    getPriorityStyle,
    applyCellBorder,
    styleMetricCell,
    addSectionTitle,
    getExcelColumnLabel,
    addReportHeader,
    addSummaryRow,
    styleTableHeader,
    styleBodyRow,
    styleInsightCell,
    getWorkloadBand,
    getCompletionBand,
    styleBandCell,
    getPriorityBucketLabel,
    getTaskProgressBand,
    styleProgressBandCell,
    styleTaskPriorityCell,
    styleTaskStatusCell,
    addTaskRowsToWorksheet,
    finalizeWorksheet,
    createWorkbook,
    sendWorkbook,
};
