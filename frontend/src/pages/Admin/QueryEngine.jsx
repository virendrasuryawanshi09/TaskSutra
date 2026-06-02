import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  LuSparkles,
  LuSend,
  LuHistory,
  LuCopy,
  LuDownload,
  LuCheck,
  LuClock,
  LuLayers
} from "react-icons/lu";


const EmptyState = ({ message = "No results found for this query" }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] text-center">
    <LuLayers className="text-3xl text-[var(--text-muted)] mb-3" />
    <p className="text-sm font-medium text-[var(--text)]">{message}</p>
    <p className="text-xs text-[var(--text-muted)] mt-1">Try rephrasing your search or click on one of the quick suggestions.</p>
  </div>
);

const QueryHistory = ({ history, onSelect }) => {
  if (history.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
        <LuHistory size={13} /> History:
      </span>
      {history.map((q, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(q)}
          className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)] transition duration-200 cursor-pointer"
        >
          {q.length > 30 ? q.slice(0, 30) + "..." : q}
        </button>
      ))}
    </div>
  );
};

const QuerySummary = ({ answer, isStreaming }) => {
  if (!answer) return null;
  return (
    <div className="mb-6 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition duration-300">
      <div className="flex items-center gap-1.5 mb-3">
        <LuSparkles className="text-sm text-[var(--accent)] animate-pulse" />
        <span className="text-[11px] font-bold text-[var(--accent)] tracking-wider uppercase">✦ AI Overview</span>
      </div>
      <div className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-line font-normal">
        {answer}
        {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent)] animate-pulse">▌</span>}
      </div>
    </div>
  );
};

const ResultTable = ({ rawData }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!Array.isArray(rawData) || rawData.length === 0) {
    return <EmptyState />;
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--bg-soft)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
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

const QueryEngine = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const [rawData, setRawData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [executionTime, setExecutionTime] = useState(null);
  const [resultCount, setResultCount] = useState(null);

  const [queryHistory, setQueryHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const activeStreamRef = useRef(null);

  const suggestions = [
    "Who has the most overdue tasks?",
    "Show all high priority tasks due this week",
    "Which developers have skills in React?",
    "Count in progress tasks per domain"
  ];

  useEffect(() => {
    const saved = localStorage.getItem("ceo_query_history");
    if (saved) {
      try {
        setQueryHistory(JSON.parse(saved));
      } catch (e) {
        // Ignore corrupt history
      }
    }
  }, []);

  const saveToHistory = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setQueryHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("ceo_query_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSuggestionClick = (prompt) => {
    setQuery(prompt);
    handleSubmit(null, prompt);
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

  const handleSubmit = async (e, forcedQuery) => {
    if (e) e.preventDefault();
    const finalQuery = forcedQuery || query;
    if (!finalQuery.trim() || isLoading || isStreaming) return;

    setIsLoading(true);
    setRawData(null);
    setAnswer("");
    setExecutionTime(null);
    setResultCount(null);

    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.cancel();
      } catch (err) { }
    }

    try {
      saveToHistory(finalQuery);

      const res = await axiosInstance.post(API_PATHS.AI.CEO_NL_QUERY, {
        question: finalQuery
      });

      if (!res.data || !res.data.success) {
        throw new Error(res.data?.message || "Search execution failed");
      }

      const { rawData: fetchedData, executionTimeMs, resultCount: count } = res.data;
      setRawData(fetchedData);
      setExecutionTime(executionTimeMs);
      setResultCount(count);

      if (!fetchedData || fetchedData.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsStreaming(true);

      const token = localStorage.getItem("token");
      const streamResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${API_PATHS.AI.CEO_NL_STREAM}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: finalQuery,
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
              } catch (err) { }
            }
          }
        }
      }

      setIsStreaming(false);

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "An error occurred during execution.";
      toast.error(errMsg);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Query Intelligence | TaskSutra</title>
        <meta name="description" content="Secure CEO-only natural language query interface to gain real-time database insights." />
      </Helmet>

      <DashboardLayout activeMenu="query-engine">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-widest text-[var(--accent)] uppercase">
              CEO Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight mt-1">
              Ask Anything.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Query your organization's tasks, assignees, priorities, and domains using plain natural English.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative group">
              <div className={`absolute -inset-0.5 rounded-[999px] bg-gradient-to-r from-[var(--accent)] to-[#4ECDC4] opacity-30 blur transition duration-300 group-hover:opacity-60 ${isLoading || isStreaming ? "animate-pulse opacity-100" : "opacity-0"}`} />

              <div className="relative flex items-center h-16 w-full rounded-[999px] bg-[var(--surface)] border-2 border-[var(--border)] focus-within:border-[var(--accent)] px-5 shadow-sm transition duration-200">
                <LuSparkles className="text-xl text-[var(--accent)] mr-3 flex-shrink-0 animate-pulse" />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Which developers have more than 2 active tasks?"
                  disabled={isLoading || isStreaming}
                  className="flex-1 h-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none border-none pr-4 w-full"
                />

                <button
                  type="submit"
                  disabled={isLoading || isStreaming || !query.trim()}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all duration-200 active:scale-[0.95] disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:scale-100 cursor-pointer flex-shrink-0"
                >
                  <LuSend className="text-sm" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Suggestions:</span>
              {suggestions.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSuggestionClick(p)}
                  disabled={isLoading || isStreaming}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            <QueryHistory history={queryHistory} onSelect={handleSuggestionClick} />
          </form>

          {rawData && (
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <LuLayers size={13} className="text-[var(--accent)]" /> {resultCount} records matched
                </span>
                <span className="flex items-center gap-1">
                  <LuClock size={13} className="text-[var(--accent)]" /> Query finished in {executionTime}ms
                </span>
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

          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-2">
                <div className="h-4 bg-[var(--bg-soft)] rounded w-1/4" />
                <div className="h-3 bg-[var(--bg-soft)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg-soft)] rounded w-1/2" />
              </div>
              <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
                <div className="h-10 bg-[var(--bg-soft)] border-b border-[var(--border)]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[var(--bg-soft)] rounded w-full" />
                  <div className="h-4 bg-[var(--bg-soft)] rounded w-5/6" />
                  <div className="h-4 bg-[var(--bg-soft)] rounded w-4/5" />
                </div>
              </div>
            </div>
          )}

          <QuerySummary answer={answer} isStreaming={isStreaming} />

          {!isLoading && rawData && (
            <ResultTable rawData={rawData} />
          )}

        </div>
      </DashboardLayout>
    </>
  );
};

export default QueryEngine;
