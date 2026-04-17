import React from 'react'

const Progress = ({ progress, status }) => {
    const getColor = () => {
        switch (status) {
            case "In Progress":
                return "";

            case "Completed":
                return "";

            default:
                return "";
        }
    }

    return (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`${getColor()} h-1.5 rounded-full text-center text-xs font-medium`} style={{width: `${progress} % `}}></div>
        </div>
    )
}

export default Progress