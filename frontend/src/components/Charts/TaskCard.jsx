import React from 'react'
import Progress from '../Progress';
import AvatarGroup from '../AvatarGroup';
import {LuPaperclip} from 'react-icons/lu';
import moment from 'moment';

const TaskCard = (
    key, title, description, priority, status, progress, createdAt, dueDate, assignedTo, attachmentCount, completedTodoCount, todoChecklist, onClick,
) => {
    const getStatusTapColor = (status) => {
        switch (status) {
            case "In Progress":
            return "text-cyan-500 bg-cyan-100 border border-cyan-500/10";

            case "Completed":
            return "text-green-500 bg-green-100 border border-green-500/10";

           default:
            return "text-gray-500 bg-gray-100 border border-gray-500/10";
        }
    };

    const getPriorityTagColor = () => {
        switch (priority) {
            case "Low":
            return ""
            
            case "Medium":
                return""
        
            
            default:
                return""
        }

    }

    return (
        <div className="">TaskCard</div>
    );
}

export default TaskCard