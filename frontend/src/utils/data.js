import {
    LuLayoutDashboard,
    LuUsers,
    LuClipboardCheck,
    LuSquarePlus,
    LuLogOut,
    LuCircleCheckBig,
    LuUser,
    LuMessageSquare
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
        id: "chat-admin",
        label: "Community Chat",
        icon: LuMessageSquare,
        path: "/admin/chat",
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
        label:"Team Members",
        icon: LuUsers,
        path: "/user/team-members",
        section: "views",
        description: "See everyone on your team and their task progress.",
    },
    {
        id: "04",
        label:"Edit Profile",
        icon: LuUser,
        path: "/user/profile",
        section: "views",
        description: "Update your personal information and profile picture.",
    },
    {
        id: "chat-user",
        label: "Community Chat",
        icon: LuMessageSquare,
        path: "/user/chat",
        section: "views",
        description: "Global realtime chat for all community members.",
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
