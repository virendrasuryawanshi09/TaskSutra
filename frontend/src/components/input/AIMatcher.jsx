import React, { useState, useEffect } from "react";
import { 
  LuActivity, 
  LuCalendar, 
  LuLoader, 
  LuLayers, 
  LuX, 
  LuClock,
  LuCompass,
  LuSparkles
} from "react-icons/lu";
import Modal from "../Modal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

/**
 * AIMatcher Component
 * Renders a premium, B2B-grade diagnostic view for a developer's Cognitive Load & On-Time Delivery Probability.
 */
const AIMatcher = ({ isOpen, onClose, userId, userName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchCognitiveLoadAnalysis();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const fetchCognitiveLoadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(API_PATHS.AI.GET_COGNITIVE_LOAD(userId));
      if (response.data && response.data.success) {
        setAnalysisData(response.data.data);
      } else {
        throw new Error("Failed to load analysis metrics.");
      }
    } catch (err) {
      console.error("Error fetching cognitive load analysis:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
      toast.error("Failed to load cognitive analyzer statistics.");
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 80) return "text-emerald-500 stroke-emerald-500 bg-emerald-500/10";
    if (prob >= 50) return "text-amber-500 stroke-amber-500 bg-amber-500/10";
    return "text-rose-500 stroke-rose-500 bg-rose-500/10";
  };

  const getLoadColor = (load) => {
    if (load <= 40) return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    if (load <= 75) return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    return "bg-rose-500/20 text-rose-600 dark:text-rose-400";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${userName || "Developer"}'s Cognitive Diagnostic`} size="lg">
      <div className="flex flex-col min-h-[350px] text-[var(--text)] font-sans">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 gap-3">
            <LuLoader className="animate-spin text-2xl text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)] tracking-wider">Compiling workloads & overlap timelines...</span>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center px-4">
            <svg className="w-8 h-8 text-rose-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-rose-500">Diagnostic Failed</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{error}</p>
          </div>
        ) : !analysisData ? (
          <div className="flex flex-1 items-center justify-center py-16 text-xs text-[var(--text-muted)]">
            No active timeline or cognitive load diagnostic data found.
          </div>
        ) : (
          <div className="space-y-5">
            {/* METRICS HEADER */}
            <div className="grid grid-cols-2 gap-4">
              {/* Delivery Probability Circle */}
              <div 
                className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-sm"
                role="progressbar"
                aria-valuenow={analysisData.deliveryProbability}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="On-Time Delivery Probability"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    On-Time Delivery
                  </span>
                  <span className="text-xl font-bold mt-1.5">
                    {analysisData.deliveryProbability}%
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    Predictive score
                  </span>
                </div>
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getProbabilityColor(analysisData.deliveryProbability).split(" ")[1]}
                      strokeDasharray={`${analysisData.deliveryProbability}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {(() => {
                      const color = analysisData.deliveryProbability >= 80 ? "text-emerald-500" : analysisData.deliveryProbability >= 50 ? "text-amber-500" : "text-rose-500";
                      return (
                        <svg className={`w-3.5 h-3.5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Cognitive Load Slider-style */}
              <div 
                className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-sm"
                role="progressbar"
                aria-valuenow={analysisData.cognitiveLoadScore}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Cognitive Load Index"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                      Cognitive Load
                    </span>
                    <span className="text-xl font-bold mt-1.5">
                      {analysisData.cognitiveLoadScore}/100
                    </span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase ${getLoadColor(analysisData.cognitiveLoadScore)}`}>
                    {analysisData.cognitiveLoadScore >= 75 ? "Critical" : analysisData.cognitiveLoadScore >= 40 ? "Moderate" : "Optimal"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysisData.cognitiveLoadScore >= 75 ? "bg-rose-500" : analysisData.cognitiveLoadScore >= 40 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${analysisData.cognitiveLoadScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI BRIEF ASSESSMENT */}
            <div className="bg-[var(--bg-soft)] border-l-2 border-[var(--accent)] px-4 py-3 rounded-r-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                <LuActivity className="text-[var(--accent)] shrink-0 text-xs" />
                <span>Operational Assessment</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed font-normal">
                {analysisData.assessment}
              </p>
            </div>

            {/* WARNINGS & ALERTS */}
            {analysisData.warnings && analysisData.warnings.length > 0 && (
              <div className="border border-amber-500/10 bg-amber-500/5 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Cognitive Friction Warning</span>
                </div>
                <div className="space-y-1 pl-5">
                  {analysisData.warnings.map((warn, i) => (
                    <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400/90 list-item list-disc leading-relaxed">
                      {warn}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* DETECTED DOMAINS & PENALTY */}
            <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <LuLayers className="text-xs" /> Work Domains
                </span>
                {analysisData.contextSwitchPenalty > 0 && (
                  <span className="text-[9px] text-rose-500 font-medium bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                    -{analysisData.contextSwitchPenalty}% Switch Penalty
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {analysisData.detectedDomains && analysisData.detectedDomains.length > 0 ? (
                  analysisData.detectedDomains.map((dom) => (
                    <span 
                      key={dom} 
                      className="text-[9px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-2 py-0.5 rounded-full font-medium"
                    >
                      {dom}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] italic">No distinct domains active</span>
                )}
              </div>
            </div>

            {/* TIMELINE VISUALIZER */}
            <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-4">
                <LuCalendar className="text-xs" /> Deadline Timeline ({analysisData.activeTasksCount || 0} active)
              </span>

              {analysisData.deadlinesTimeline && analysisData.deadlinesTimeline.length > 0 ? (
                <div className="relative pl-4 border-l border-[var(--border)] ml-2 space-y-4">
                  {analysisData.deadlinesTimeline.map((item, index) => (
                    <div key={index} className="relative group">
                      {/* Node circle indicator */}
                      <div className="absolute -left-[20.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--border)] border-2 border-[var(--surface)] group-hover:bg-[var(--accent)] transition-colors duration-200" />
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-semibold text-[var(--text)] truncate max-w-[220px]">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono shrink-0 mt-0.5">
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString(undefined, {month: "short", day: "numeric"}) : "No date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] px-1 py-0.1 border rounded font-semibold ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="text-[8px] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.1 rounded text-[var(--text-muted)]">
                            {item.domain}
                          </span>
                          {item.complexity && (
                            <span className="text-[8px] text-[var(--text-muted)] font-mono">
                              Complexity: {item.complexity}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                  <LuCalendar className="text-lg text-[var(--text-muted)] mb-1.5" />
                  <span className="text-[10px] font-medium text-[var(--text)]">No Deadlines In Pipeline</span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5">Developer has full availability and no active deadlines.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIMatcher;
