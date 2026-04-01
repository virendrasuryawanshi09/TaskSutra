import React from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const TaskListTable = ({ tableData }) => {
    const navigate = useNavigate();

    const normalizeStatus = (status) => {
        const normalizedValue = String(status || '').trim().toLowerCase();

        if (normalizedValue === 'completed') return 'Completed';
        if (['in progress', 'in-progress', 'inprogress'].includes(normalizedValue)) {
            return 'In Progress';
        }
        return 'Pending';
    };

    const getStatusBadge = (status) => {
        switch (normalizeStatus(status)) {
            case 'Completed':
                return 'border border-[rgba(76,127,106,0.18)] bg-[rgba(76,127,106,0.16)] text-[#4C7F6A] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]';
            case 'In Progress':
                return 'border border-[rgba(47,122,132,0.18)] bg-[rgba(47,122,132,0.16)] text-[#2F7A84] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]';
            case 'Pending':
                return 'border border-[rgba(194,139,44,0.18)] bg-[rgba(194,139,44,0.16)] text-[#C28B2C] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]';
            default:
                return 'bg-[var(--bg-soft)] text-[var(--text-muted)]';
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-[rgba(178,85,74,0.15)] text-[#B2554A]';
            case 'Medium':
                return 'bg-[rgba(194,139,44,0.15)] text-[#C28B2C]';
            case 'Low':
                return 'bg-[rgba(76,127,106,0.15)] text-[#4C7F6A]';
            default:
                return 'bg-[var(--bg-soft)] text-[var(--text-muted)]';
        }
    };

    const getStatusDot = (status) => {
        switch (normalizeStatus(status)) {
            case 'Completed':
                return 'bg-[#4C7F6A]';
            case 'In Progress':
                return 'bg-[var(--accent)]';
            case 'Pending':
                return 'bg-[#C28B2C]';
            default:
                return 'bg-[var(--text-muted)]';
        }
    };

    const formatStatus = (status) => normalizeStatus(status);

    const formatCreatedDate = (task) => {
        const taskDate = task.createdAt || task.createdOn;
        return taskDate ? moment(taskDate).format('DD MMM YYYY') : '--';
    };

    return (
        <>
            <div className="space-y-3 md:hidden">
                {tableData.map((task) => (
                    <button
                        key={task._id || task.id}
                        onClick={() => navigate(`/admin/tasks/${task._id || task.id}`)}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left shadow-sm transition-transform duration-200 active:scale-[0.99]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusDot(task.status)}`}></div>
                                    <p className="text-[15px] font-semibold leading-6 text-[var(--text)] break-words">
                                        {task.title}
                                    </p>
                                </div>
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                    Created {formatCreatedDate(task)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(task.status)}`}>
                                {formatStatus(task.status)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                            </span>
                        </div>
                    </button>
                ))}

                {tableData.length === 0 && (
                    <div className="rounded-2xl border border-[var(--border)] py-12 text-center text-sm text-[var(--text-muted)]">
                        No recent tasks found
                    </div>
                )}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] md:block">

                <table className="w-full table-fixed text-sm">

                    <thead className="sticky top-0 z-10 bg-[var(--bg-soft)]">
                        <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                            <th className="w-[40%] px-4 py-4 font-medium">Task</th>
                            <th className="w-[20%] px-4 py-4 font-medium">Status</th>
                            <th className="w-[20%] px-4 py-4 font-medium">Priority</th>
                            <th className="w-[20%] px-4 py-4 text-right font-medium">Created On</th>
                        </tr>
                    </thead>

                    <tbody>
                        {tableData.map((task) => (
                            <tr
                                key={task._id || task.id}
                                onClick={() => navigate(`/admin/tasks/${task._id || task.id}`)}
                                className="border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] 
              hover:bg-[var(--bg-soft)] hover:scale-[1.01] cursor-pointer transition-all duration-200"
                            >

                                <td className="px-4 py-4 font-medium text-[var(--text)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusDot(task.status)}`}></div>

                                        <span className="truncate">{task.title}</span>
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${getStatusBadge(task.status)}`}
                                    >
                                        {formatStatus(task.status)}
                                    </span>
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${getPriorityBadge(task.priority)}`}
                                    >
                                        {task.priority}
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-right text-[var(--text-muted)]">
                                    {formatCreatedDate(task)}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>

                {tableData.length === 0 && (
                    <div className="py-12 text-center text-sm text-[var(--text-muted)]">
                        No recent tasks found
                    </div>
                )}
            </div>
        </>
    );
};

export default TaskListTable;
