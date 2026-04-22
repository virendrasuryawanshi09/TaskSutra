import {
    LuLayoutDashboard,
    LuUsers,
    LuClipboardCheck,
    LuSquarePlus,
    LuLogOut,
    LuCalendarClock,
    LuCircleCheckBig
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
    {
        id: "01",
        label:"Dashboard",
        icon: LuLayoutDashboard,
        path: "/admin/dashboard",
    },
    {
        id: "02",
        label:"Manage Tasks",
        icon: LuClipboardCheck,
        path: "/admin/tasks",
    },
    {
        id: "03",
        label:"Create Task",
        icon: LuSquarePlus,
        path: "/admin/create-task",
    },
    {
        id: "04",
        label:"Team Members",
        icon: LuUsers,
        path: "/admin/users",
    },
    {
        id: "05",
        label:"Logout",
        icon: LuLogOut,
        path: "logout",
    },
];

export const SIDE_MENU_USER_DATA = [
    {
        id: "01",
        label:"Dashboard",
        icon: LuLayoutDashboard,
        path: "/user/dashboard",
        section: "main",
        description: "See your weekly summary, priority tasks, and upcoming deadlines.",
    },
    {
        id: "02",
        label:"My Tasks",
        icon: LuClipboardCheck,
        path: "/user/my-tasks",
        section: "main",
        description: "Review everything assigned to you and keep work moving.",
    },
    {
        id: "03",
        label:"Upcoming",
        icon: LuCalendarClock,
        path: "/user/my-tasks?view=upcoming",
        section: "views",
        description: "Jump straight into the tasks that are approaching their deadlines.",
    },
    {
        id: "04",
        label:"Completed",
        icon: LuCircleCheckBig,
        path: "/user/my-tasks?view=completed",
        section: "views",
        description: "Look back at finished work and the progress you have already made.",
    },
    {
        id: "05",
        label:"Logout",
        icon: LuLogOut,
        path: "logout",
        section: "utility",
        description: "Sign out of your workspace securely.",
    },
];

export const PRIORITY_DATA = [
    {label: "Low", value:"Low"},
    {label: "Medium", value:"Medium"},
    {label: "High", value:"High"},
]

export const STATUS_DATA = [
    {label: "Pending", value:"Pending"},
    {label: "In Progress", value:"In Progress"},
    {label: "Competed", value:"Completed"}
]
