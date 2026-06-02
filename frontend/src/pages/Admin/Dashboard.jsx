import React, { useState, useContext, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import { addThousandSeparator } from '../../utils/helper';
import InfoCard from '../../components/Cards/InfoCard';
import { HiOutlineCheckCircle, HiOutlineClipboardList, HiOutlineClock, HiOutlineRefresh } from 'react-icons/hi';
import { LuArrowRight, LuSparkles, LuSend, LuCheck, LuCopy, LuDownload, LuClock, LuLayers, LuX } from 'react-icons/lu';
import TaskListTable from '../../components/TaskListTable';
import CustomPieChart from '../../components/Charts/CustomPieChart';
import CustomBarChart from '../../components/Charts/CustomBarChart';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell as RechartsCell } from 'recharts';


const COLORS = [
  "#D97706", // Pending
  "#2F7A84", // In Progress
  "#4C7F6A", // Completed
];

const AutoChart = ({ data }) => {
  if (!Array.isArray(data) || data.length < 2) return null;
  const sample = data[0];
  const keys = Object.keys(sample);
  const valueKey = keys.find(k => typeof sample[k] === 'number' && k !== '__v' && k !== 'progress' && k !== 'estimatedComplexityScore');
  const labelKey = keys.find(k => typeof sample[k] === 'string' && k !== '_id' && k !== 'companyId');

  if (!valueKey || !labelKey) return null;

  const chartData = data.map(item => ({
    name: item[labelKey] || "Unknown",
    value: item[valueKey]
  }));

  const chartColors = ["#4F46E5", "#D97706", "#059669", "#2563EB", "#7C3AED", "#EC4899", "#10B981"];

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3">
      <span className="text-[10px] font-bold text-[var(--accent)] tracking-wider uppercase flex items-center gap-1.5">
        <LuLayers size={13} className="text-[var(--accent)]" /> Data Visualization
      </span>
      <div className="h-[200px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
            <RechartsTooltip 
              cursor={{ fill: 'var(--bg-soft)', opacity: 0.4 }}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', color: 'var(--text)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <RechartsCell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const KeyMetricPills = ({ rawData, isTaskData, isUserData }) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return null;

  if (isTaskData) {
    const total = rawData.length;
    const totalProgress = rawData.reduce((sum, t) => sum + (t.progress || 0), 0);
    const avgProgress = Math.round(totalProgress / total);
    const highPriority = rawData.filter(t => t.priority === 'High').length;
    const now = new Date();
    const overdue = rawData.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed').length;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Total Tasks</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{total}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Avg Progress</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{avgProgress}%</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">High Priority</span>
          <span className="text-base font-bold text-red-500 mt-0.5">{highPriority}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Overdue</span>
          <span className="text-base font-bold text-amber-600 mt-0.5">{overdue}</span>
        </div>
      </div>
    );
  }

  if (isUserData) {
    const total = rawData.length;
    const members = rawData.filter(u => u.role === 'member').length;
    const admins = rawData.filter(u => u.role === 'admin').length;
    const totalSkills = rawData.reduce((sum, u) => sum + (Array.isArray(u.skills) ? u.skills.length : 0), 0);
    const avgSkills = Math.round(totalSkills / total) || 0;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Total Matched</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{total}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Members</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{members}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Admins</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{admins}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Avg Skills</span>
          <span className="text-base font-bold text-[var(--text)] mt-0.5">{avgSkills}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Total Records</span>
        <span className="text-base font-bold text-[var(--text)] mt-0.5">{rawData.length}</span>
      </div>
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/30 flex flex-col">
        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Data Fields</span>
        <span className="text-base font-bold text-[var(--text)] mt-0.5">{Object.keys(rawData[0]).filter(k => k !== '__v' && k !== 'companyId').length}</span>
      </div>
    </div>
  );
};

const parseInlineStyles = (text) => {
  if (typeof text !== 'string') return text;
  const parts = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  let lastIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(textBefore);
    }
    parts.push(<strong key={match.index} className="font-semibold text-[var(--text)]">{match[1]}</strong>);
    lastIndex = boldRegex.lastIndex;
  }

  const textAfter = text.substring(lastIndex);
  if (textAfter) {
    parts.push(textAfter);
  }

  return parts.length > 0 ? parts : text;
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, index) => {
    let content = line.trim();
    if (content === "") return <div key={index} className="h-2" />;

    // Headers
    const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const parsed = parseInlineStyles(title);
      if (level === 1) return <h1 key={index} className="text-xl font-bold mt-3 mb-1 text-[var(--text)]">{parsed}</h1>;
      if (level === 2) return <h2 key={index} className="text-lg font-bold mt-2.5 mb-1 text-[var(--text)]">{parsed}</h2>;
      return <h3 key={index} className="text-base font-bold mt-2 mb-1 text-[var(--text)]">{parsed}</h3>;
    }

    // Bullet list
    const bulletMatch = content.match(/^[\*\-\+]\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      return (
        <ul key={index} className="list-disc pl-5 my-0.5 text-sm text-[var(--text)]">
          <li>{parseInlineStyles(itemText)}</li>
        </ul>
      );
    }

    return <p key={index} className="my-1 text-sm text-[var(--text)] leading-relaxed">{parseInlineStyles(content)}</p>;
  });
};

const ResultTable = ({ rawData }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!Array.isArray(rawData) || rawData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] text-center">
        <LuLayers className="text-3xl text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--text)]">No results found for this query</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Try rephrasing your search query.</p>
      </div>
    );
  }

  const firstItem = rawData[0];
  const columns = Object.keys(firstItem).filter(key => key !== '__v' && key !== 'companyId');

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...rawData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const aStr = typeof aVal === 'object' ? JSON.stringify(aVal) : aVal;
    const bStr = typeof bVal === 'object' ? JSON.stringify(bVal) : bVal;

    if (sortConfig.direction === 'asc') {
      return aStr > bStr ? 1 : -1;
    } else {
      return aStr < bStr ? 1 : -1;
    }
  });

  const formatCellValue = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === 'boolean') return val ? "Yes" : "No";
    if (Array.isArray(val)) {
      if (val.length === 0) return "-";
      return val.map(item => typeof item === 'object' ? (item.name || item.text || JSON.stringify(item)) : String(item)).join(", ");
    }
    if (typeof val === 'object') {
      return val.name || val.title || JSON.stringify(val);
    }
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(val).toLocaleDateString();
    }
    return String(val);
  };

  return (
    <div className="w-full border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--bg-soft)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold uppercase tracking-wider sticky top-0 z-10">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className="px-5 py-4 cursor-pointer hover:bg-[var(--border)] transition duration-150 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    {col}
                    {sortConfig.key === col && (
                      <span className="text-[10px]">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
            {sortedData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[var(--bg-soft)]/50 transition duration-150">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-4 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const Dashboard = () => {

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // CEO Search states
  const [query, setQuery] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [executionTime, setExecutionTime] = useState(null);
  const [resultCount, setResultCount] = useState(null);
  const [copied, setCopied] = useState(false);
  const activeStreamRef = useRef(null);

  // Esc key listener to close overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isQueryLoading || isStreaming) return;

    setIsOverlayOpen(true);
    setIsQueryLoading(true);
    setRawData(null);
    setAnswer("");
    setExecutionTime(null);
    setResultCount(null);

    if (activeStreamRef.current) {
      try { activeStreamRef.current.cancel(); } catch (_) {}
    }

    try {
      const res = await axiosInstance.post(API_PATHS.AI.CEO_NL_QUERY, {
        question: query
      });

      if (!res.data || !res.data.success) {
        throw new Error(res.data?.message || "Search execution failed");
      }

      const { rawData: fetchedData, executionTimeMs, resultCount: count } = res.data;
      setRawData(fetchedData);
      setExecutionTime(executionTimeMs);
      setResultCount(count);
      setIsQueryLoading(false);

      if (!fetchedData || fetchedData.length === 0) {
        return;
      }

      setIsStreaming(true);

      const token = localStorage.getItem("token");
      const streamResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${API_PATHS.AI.CEO_NL_STREAM}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: query,
          rawData: fetchedData
        })
      });

      if (!streamResponse.ok) {
        throw new Error("Summarization stream connection failed");
      }

      const reader = streamResponse.body.getReader();
      activeStreamRef.current = reader;
      const decoder = new TextDecoder();
      let streamDone = false;
      let buffer = "";

      while (!streamDone) {
        const { done: doneReading, value } = await reader.read();
        streamDone = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !streamDone });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith("data: [DONE]")) {
              streamDone = true;
              break;
            }
            if (cleaned.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(cleaned.slice(6));
                if (parsed.token) {
                  setAnswer(prev => prev + parsed.token);
                }
              } catch (err) {}
            }
          }
        }
      }

      setIsStreaming(false);

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "An error occurred during execution.";
      toast.error(errMsg);
      setIsQueryLoading(false);
      setIsStreaming(false);
    }
  };

  const handleCopyResults = () => {
    if (!rawData) return;
    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))
      .then(() => {
        setCopied(true);
        toast.success("JSON results copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy results"));
  };

  const handleExportCSV = () => {
    if (!rawData || rawData.length === 0) return;

    try {
      const headers = Object.keys(rawData[0]).filter(k => k !== '__v' && k !== 'companyId');
      const csvRows = [
        headers.join(','),
        ...rawData.map(row =>
          headers.map(fieldName => {
            const val = row[fieldName];
            const cleanVal = val === null || val === undefined
              ? ''
              : typeof val === 'object'
                ? JSON.stringify(val).replace(/"/g, '""')
                : String(val).replace(/"/g, '""');
            return `"${cleanVal}"`;
          }).join(',')
        )
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ceo_query_results_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully");
    } catch (e) {
      toast.error("Failed to export CSV");
    }
  };

  const currentHour = moment().hour();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";

  const prepareChartData = (data) => {
    const taskDistribution = data?.taskDistribution || {};
    const taskPriorityLevels = data?.taskPriorityLevels || {};
    const totalTasks = Number(taskDistribution?.All || 0);
    const pendingTasks = Number(taskDistribution?.Pending || 0);
    const completedTasks = Number(taskDistribution?.Completed || 0);
    const rawInProgressCount = Number(
      taskDistribution?.InProgress ??
      taskDistribution?.["In Progress"] ??
      taskDistribution?.["In-progress"] ??
      0
    );
    const derivedInProgressCount = Math.max(
      0,
      totalTasks - pendingTasks - completedTasks
    );
    const inProgressCount = rawInProgressCount || derivedInProgressCount;

    const taskDistributionData = [
      { status: "Pending", count: pendingTasks },
      { status: "In Progress", count: inProgressCount },
      { status: "Completed", count: completedTasks },
    ];

    setPieChartData(taskDistributionData);

    const priorityLevelData = [
      { priority: "High", count: taskPriorityLevels?.High || 0 },
      { priority: "Medium", count: taskPriorityLevels?.Medium || 0 },
      { priority: "Low", count: taskPriorityLevels?.Low || 0 },
    ];
    setBarChartData(priorityLevelData);
  };

  const getDashboardData = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );

      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };


  useEffect(() => {
    getDashboardData();
  }, []);

  if (!dashboardData) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="p-6 text-[var(--text-muted)]">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  const taskDistribution = dashboardData?.charts?.taskDistribution || {};
  const totalTasks = Number(taskDistribution?.All || 0);
  const pendingTasks = Number(taskDistribution?.Pending || 0);
  const completedTasks = Number(taskDistribution?.Completed || 0);
  const rawInProgressCount = Number(
    taskDistribution?.InProgress ??
    taskDistribution?.["In Progress"] ??
    taskDistribution?.["In-progress"] ??
    0
  );
  const inProgressCount = rawInProgressCount || Math.max(
    0,
    totalTasks - pendingTasks - completedTasks
  );

  return (
    <>
      <Helmet>
        <title>Dashboard | TaskSutra</title>
        <meta name="description" content="Monitor workspace health, track recent task completions, analyze team distribution, and access management analytics." />
      </Helmet>
      <DashboardLayout activeMenu="Dashboard">
        {/* CEO Global Search bar */}
        {user?.role === 'ceo' && (
          <form onSubmit={handleQuerySubmit} className="my-4 sm:my-6">
            <div className="relative group">
              <div className={`absolute -inset-0.5 rounded-[999px] bg-gradient-to-r from-[var(--accent)] to-[#4ECDC4] opacity-30 blur transition duration-300 group-hover:opacity-60 ${isQueryLoading || isStreaming ? "animate-pulse opacity-100" : "opacity-0"}`} />

              <div className="relative flex items-center h-16 w-full rounded-[999px] bg-[var(--surface)] border-2 border-[var(--border)] focus-within:border-[var(--accent)] px-5 shadow-sm transition duration-200">
                <LuSparkles className="text-xl text-[var(--accent)] mr-3 flex-shrink-0 animate-pulse" />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about tasks, developers, or workspace details..."
                  disabled={isQueryLoading || isStreaming}
                  className="flex-1 h-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none border-none pr-4 w-full"
                />

                <button
                  type="submit"
                  disabled={isQueryLoading || isStreaming || !query.trim()}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all duration-200 active:scale-[0.95] disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:scale-100 cursor-pointer flex-shrink-0"
                >
                  <LuSend className="text-sm" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="my-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:my-6 sm:p-5">
          <div>
            <div className="col-span-3">
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)] tracking-tight">
                {greeting}, {user?.name}
              </h2>

              <p className="text-sm text-[var(--accent)] mt-1">Let’s turn your goals into progress.</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {moment().format("dddd, MMMM Do YYYY")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-4 md:gap-6">
            <InfoCard
              label="Total Tasks"
              icon={<HiOutlineClipboardList />}
              value={addThousandSeparator(totalTasks)}
              color="#4F46E5"
            />

            <InfoCard
              label="Pending Tasks"
              icon={<HiOutlineClock />}
              value={addThousandSeparator(pendingTasks)}
              color="#D97706"
            />

            <InfoCard
              label="In Progress Tasks"
              icon={<HiOutlineRefresh />}
              value={addThousandSeparator(inProgressCount)}
              color="#059669"
            />
            <InfoCard
              label="Completed Tasks"
              icon={<HiOutlineCheckCircle />}
              value={addThousandSeparator(completedTasks)}
              color="#2563EB"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">


          <div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Task Distribution</h5>
              </div>

              <CustomPieChart
                data={pieChartData}
                colors={COLORS}
              />

            </div>
          </div>

          <div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Task Priority Levels</h5>
              </div>

              <CustomBarChart
                data={barChartData}
              />
            </div>
          </div>

          <div className="md:col-span-2">

            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-white/40 to-white/10">

              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 p-5">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h5 className="text-lg font-semibold text-[var(--text)]">
                      Recent Tasks
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Track your latest activity
                    </p>
                  </div>

                  <button
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition cursor-pointer"
                    onClick={onSeeMore}
                  >
                    View All
                    <LuArrowRight className="text-base transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                </div>

                <div className="h-px bg-[var(--border)] mb-4"></div>

                <TaskListTable tableData={dashboardData?.recentTasks || []} />

              </div>
            </div>

          </div>
        </div>

        {/* AI Query Overlay Modal */}
        {isOverlayOpen && (() => {
          const firstItem = rawData && rawData[0];
          const isTaskData = firstItem && ('title' in firstItem && ('status' in firstItem || 'priority' in firstItem));
          const isUserData = firstItem && ('name' in firstItem && ('role' in firstItem || 'skills' in firstItem));

          const renderTaskCard = (task) => {
            const priorityColors = {
              High: "bg-red-500/10 text-red-500 border-red-500/20",
              Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
              Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            };

            const statusColors = {
              Pending: "bg-gray-500/10 text-gray-500 border-gray-500/20",
              "In-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
              "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
              Completed: "bg-green-500/10 text-green-500 border-green-500/20",
            };

            const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date";

            return (
              <div key={task._id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 group">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColors[task.priority] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                      {task.priority || "Low"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[task.status] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                      {task.status || "Pending"}
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-[var(--text)] mt-2.5 line-clamp-2 group-hover:text-[var(--accent)] transition duration-200">
                    {task.title}
                  </h5>
                  {task.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-auto pt-2 border-t border-[var(--border)]/50">
                  {/* Progress bar */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Progress</span>
                    <span className="font-semibold">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${task.progress || 0}%` }} />
                  </div>

                  {/* Due Date & Assignees */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <LuClock size={11} className="text-[var(--accent)]" /> {formattedDate}
                    </span>
                    {/* Avatar bubbles */}
                    {Array.isArray(task.assignedToUsers) && task.assignedToUsers.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignedToUsers.slice(0, 3).map((name, i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center border border-[var(--surface)] text-[9px] shadow-sm select-none" title={name}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {task.assignedToUsers.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] font-semibold flex items-center justify-center border border-[var(--border)] text-[8px] shadow-sm select-none">
                            +{task.assignedToUsers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignedTo.slice(0, 3).map((userObj, i) => {
                          const name = typeof userObj === 'object' && userObj !== null ? userObj.name : (typeof userObj === 'string' ? userObj : "User");
                          return (
                            <div key={i} className="w-5 h-5 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center border border-[var(--surface)] text-[9px] shadow-sm select-none" title={name}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                          );
                        })}
                        {task.assignedTo.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] font-semibold flex items-center justify-center border border-[var(--border)] text-[8px] shadow-sm select-none">
                            +{task.assignedTo.length - 3}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          };

          const renderUserCard = (dev) => {
            const roleColors = {
              ceo: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
              admin: "text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)]/20",
              member: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            };

            return (
              <div key={dev._id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 group">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center text-sm shadow-sm select-none">
                      {dev.name ? dev.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition duration-200">
                        {dev.name}
                      </h5>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${roleColors[dev.role] || "text-gray-500 bg-gray-500/10 border-gray-500/20"}`}>
                        {dev.role}
                      </span>
                    </div>
                  </div>
                  {dev.title && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
                      {dev.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-auto pt-2 border-t border-[var(--border)]/50">
                  {/* Skills */}
                  {Array.isArray(dev.skills) && dev.skills.length > 0 ? (
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-1">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {dev.skills.slice(0, 4).map((skill, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)] font-medium">
                            {skill}
                          </span>
                        ))}
                        {dev.skills.length > 4 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)] font-medium">
                            +{dev.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-muted)] italic">No skills listed</div>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
              <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl border border-white/20 dark:border-white/5 bg-[var(--surface)]/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--border)] bg-[var(--bg-soft)]/50">
                  <div className="flex items-center gap-2">
                    <LuSparkles className="text-lg text-[var(--accent)] animate-pulse" />
                    <span className="text-sm font-semibold text-[var(--text)]">AI Assistant Insights</span>
                  </div>
                  <button
                    onClick={() => setIsOverlayOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                  >
                    <LuX className="text-lg" />
                  </button>
                </div>

                {/* Body (Split Screen Layout) */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  
                  {/* Left Column - AI text overview (40%) */}
                  <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-[var(--border)] p-6 overflow-y-auto bg-[var(--bg-soft)]/20 flex flex-col gap-4">
                    {/* Question Display */}
                    <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Search Query</span>
                      <p className="text-xs sm:text-sm font-medium text-[var(--text)] mt-1 leading-relaxed">"{query}"</p>
                    </div>

                    {/* AI Overview summary */}
                    {(answer || isStreaming || isQueryLoading) && (
                      <div className="p-5 rounded-2xl border border-[var(--accent)]/10 bg-[var(--accent-soft)]/5 shadow-sm flex-1">
                        <div className="flex items-center gap-1.5 mb-3">
                          <LuSparkles className="text-xs text-[var(--accent)] animate-pulse" />
                          <span className="text-[10px] font-bold text-[var(--accent)] tracking-wider uppercase">✦ AI Overview</span>
                        </div>
                        {isQueryLoading ? (
                          <div className="space-y-3 py-6 flex flex-col items-center justify-center text-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent mb-1" />
                            <p className="text-[11px] text-[var(--text-muted)]">Querying database & analyzing metrics...</p>
                          </div>
                        ) : (
                          <div className="text-xs leading-relaxed text-[var(--text)] whitespace-pre-line font-normal">
                            {renderMarkdown(answer)}
                            {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent)] animate-pulse">▌</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Tasks / Users visual view (60%) */}
                  <div className="w-full md:w-[60%] p-6 overflow-y-auto flex flex-col gap-4 bg-[var(--surface)]">
                    
                    {/* Metadata Header */}
                    {!isQueryLoading && rawData && (
                      <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border)] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <LuLayers size={13} className="text-[var(--accent)]" /> {resultCount} {isTaskData ? "tasks" : isUserData ? "members" : "records"} found
                          </span>
                          {executionTime && (
                            <span className="flex items-center gap-1">
                              <LuClock size={13} className="text-[var(--accent)]" /> {executionTime}ms
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleCopyResults}
                            className="flex items-center gap-1 hover:text-[var(--accent)] transition cursor-pointer"
                          >
                            {copied ? <LuCheck size={13} className="text-green-500" /> : <LuCopy size={13} />}
                            Copy JSON
                          </button>
                          <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1 hover:text-[var(--accent)] transition cursor-pointer"
                          >
                            <LuDownload size={13} /> Export CSV
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Content View */}
                    {isQueryLoading ? (
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="h-6 bg-[var(--bg-soft)] rounded w-1/4 animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/20 animate-pulse space-y-3">
                              <div className="h-3 bg-[var(--bg-soft)] rounded w-1/2" />
                              <div className="h-4 bg-[var(--bg-soft)] rounded w-3/4" />
                              <div className="h-2 bg-[var(--bg-soft)] rounded w-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : rawData && rawData.length > 0 ? (
                      <div className="space-y-6">
                        {/* Key Metric Pills */}
                        <KeyMetricPills rawData={rawData} isTaskData={isTaskData} isUserData={isUserData} />

                        {/* Auto Chart (if applicable) */}
                        <AutoChart data={rawData} />

                        {/* Structured Data View (Cards or Table) */}
                        {isTaskData ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {rawData.map(task => renderTaskCard(task))}
                          </div>
                        ) : isUserData ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {rawData.map(dev => renderUserCard(dev))}
                          </div>
                        ) : (
                          <ResultTable rawData={rawData} />
                        )}
                      </div>
                    ) : (
                      !isQueryLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-soft)]/10">
                          <LuLayers className="text-4xl text-[var(--text-muted)] mb-3" />
                          <p className="text-sm font-semibold text-[var(--text)]">No records found</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                            The query finished successfully but did not match any document in this company workspace.
                          </p>
                        </div>
                      )
                    )}

                  </div>
                  
                </div>
              </div>
            </div>
          );
        })()}
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
