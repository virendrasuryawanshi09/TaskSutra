import React from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const TaskListTable = ({ tableData }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-[rgba(76,127,106,0.15)] text-[#4C7F6A]';
            case 'In Progress':
                return 'bg-[var(--accent-soft)] text-[var(--accent)]';
            case 'Pending':
                return 'bg-[rgba(194,139,44,0.15)] text-[#C28B2C]';
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
        switch (status) {
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

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">

            <table className="w-full text-sm table-fixed">

                {/* HEADER */}
                <thead className="bg-[var(--bg-soft)] sticky top-0 z-10">
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
                        <th className="py-3 px-4 font-medium w-[40%]">Task</th>
                        <th className="py-3 px-4 font-medium w-[20%]">Status</th>
                        <th className="py-3 px-4 font-medium w-[20%]">Priority</th>
                        <th className="py-3 px-4 font-medium w-[20%] text-right">Created On</th>
                    </tr>
                </thead>

                {/* BODY */}
                <tbody>
                    {tableData.map((task) => (
                        <tr
                            key={task.id}
                            onClick={() => navigate(`/admin/tasks/${task.id}`)}
                            className="border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] 
              hover:bg-[var(--bg-soft)] hover:scale-[1.01] cursor-pointer transition-all duration-200"
                        >

                            {/* TASK */}
                            <td className="py-3 px-4 font-medium text-[var(--text)]">
                                <div className="flex items-center gap-2">

                                    {/* Status Dot */}
                                    <div className={`w-2 h-2 rounded-full ${getStatusDot(task.status)}`}></div>

                                    {task.title}
                                </div>
                            </td>

                            {/* STATUS */}
                            <td className="py-3 px-4">
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusBadge(task.status)}`}
                                >
                                    {task.status}
                                </span>
                            </td>

                            {/* PRIORITY */}
                            <td className="py-3 px-4">
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getPriorityBadge(task.priority)}`}
                                >
                                    {task.priority}
                                </span>
                            </td>

                            {/* DATE */}
                            <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                                {moment(task.createdOn).format('DD MMM YYYY')}
                            </td>

                        </tr>
                    ))}
                </tbody>

            </table>

            {/* EMPTY STATE */}
            {tableData.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                    No recent tasks found
                </div>
            )}

        </div>
    );
};

export default TaskListTable;