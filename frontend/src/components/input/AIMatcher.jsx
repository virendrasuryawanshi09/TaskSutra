import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { LuActivity, LuCalendar, LuAlertTriangle, LuClock, LuLoader } from "react-icons/lu";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${userName || "Developer"}'s Cognitive Diagnostic`}>
      <div className="flex flex-col min-h-[300px] text-[var(--text)]">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 gap-3">
            <LuLoader className="animate-spin text-2xl text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-muted)]">Running cognitive & timeline diagnostics...</span>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center px-4">
            <LuAlertTriangle className="text-3xl text-rose-500 mb-2" />
            <p className="text-sm font-semibold text-rose-500">Analysis Failed</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{error}</p>
          </div>
        ) : !analysisData ? (
          <div className="flex flex-1 items-center justify-center py-12 text-sm text-[var(--text-muted)]">
            No diagnostic data available.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Shell of Cognitive Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between">
                <span className="text-xs text-[var(--text-muted)]">On-Time Delivery Probability</span>
                <span className="text-2xl font-semibold mt-2">{analysisData.deliveryProbability}%</span>
              </div>
              <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between">
                <span className="text-xs text-[var(--text-muted)]">Cognitive Load Index</span>
                <span className="text-2xl font-semibold mt-2">{analysisData.cognitiveLoadScore}/100</span>
              </div>
            </div>
            
            <div className="text-xs text-[var(--text-muted)]">
              {analysisData.assessment}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

AIMatcher.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string,
  userName: PropTypes.string,
};

export default AIMatcher;
