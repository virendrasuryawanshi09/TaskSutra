import React from 'react'
import moment from 'moment';

const TaskListTable = ({ tableData }) => {
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border border-green-300';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'Pending': return 'bg-gray-100 text-gray-800 border border-gray-300';
            default: return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    const getPriorityBadgeColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800 border border-red-300';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'Low': return 'bg-green-100 text-green-800 border border-green-300';
            default: return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };
    return (
        <div className="">
            <table className="">
                <thead>
                    <tr className="">
                        <th className="">
                            Name
                        </th>
                        <th className="">Status</th>
                        <th className="">Priority</th>
                        <th className="">Created On</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((task) => (
                        <tr key={task.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="py-3 px-4 font-medium text-[var(--text)]">
                                {task.title}
                            </td>
                            <td className="py-3 px-4">
                </tbody>
            </table>
        </div>
    )
}

export default TaskListTable