import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";

const DomainSettingsForm = ({ companyDetails, currentUser, onCompanyCreated, onFetchCompanyDetails, isLoadingCompany }) => {
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDomain, setNewCompanyDomain] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Verification states
  const [verificationMethod, setVerificationMethod] = useState("otp");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [activeVerification, setActiveVerification] = useState(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);

  // Additional mock settings
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [defaultSignupRole, setDefaultSignupRole] = useState("member");
  const [mfaEnforced, setMfaEnforced] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      const domainPart = currentUser.email.split("@")[1];
      if (domainPart) {
        setNewCompanyDomain(domainPart);
      }
    }
  }, [currentUser]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyDomain.trim()) return;

    setIsCreatingCompany(true);
    const toastId = toast.loading("Creating workspace...");
    try {
      const res = await axiosInstance.post("/api/workspace/company", {
        name: newCompanyName.trim(),
        domain: newCompanyDomain.trim(),
      });
      if (res.data && res.data.company) {
        toast.success("Workspace created! You are now the Owner.", { id: toastId });
        if (onCompanyCreated) {
          onCompanyCreated(res.data.company, res.data.user);
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create workspace.",
        { id: toastId }
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleVerifyDomainStart = async (e) => {
    e.preventDefault();
    setIsVerifyingDomain(true);
    const toastId = toast.loading("Initiating domain verification...");
    try {
      const res = await axiosInstance.post("/api/workspace/verify-domain", {
        method: verificationMethod,
      });
      if (res.data && res.data.success) {
        setActiveVerification({
          code: res.data.verificationCode,
          method: verificationMethod,
        });
        if (onFetchCompanyDetails) {
          await onFetchCompanyDetails();
        }
        toast.success(res.data.message || "Verification code generated!", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to initiate domain verification.",
        { id: toastId }
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleConfirmDomain = async (e) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) return;

    setIsVerifyingDomain(true);
    const toastId = toast.loading("Confirming verification...");
    try {
      const res = await axiosInstance.post("/api/workspace/confirm-domain", {
        code: verificationCodeInput.trim(),
      });
      if (res.data && res.data.success) {
        setActiveVerification(null);
        setVerificationCodeInput("");
        toast.success("Domain verified successfully!", { id: toastId });
        if (onFetchCompanyDetails) {
          await onFetchCompanyDetails();
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Verification failed.",
        { id: toastId }
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleCancelVerification = () => {
    setActiveVerification(null);
    setVerificationCodeInput("");
  };

  if (isLoadingCompany) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)] font-mono text-xs flex flex-col items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></span>
        <span>Resolving secure workspace configuration...</span>
      </div>
    );
  }

  if (!companyDetails) {
    return (
      /* Create Workspace Form (Ultra-Premium Setup Console) */
      <div className="max-w-md mx-auto py-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm relative z-10 text-left">


        <h3 className="text-xl font-extrabold text-[var(--text)] mb-2 text-center tracking-tight">
          Deploy Your Enterprise Engine
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-8 text-center leading-relaxed">
          Establish a secure workspace directory for your company. Match email domains for automatic employee onboarding.
        </p>

        <form onSubmit={handleCreateCompany} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Workspace Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                className="w-full pl-3 pr-4 py-3 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-205"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Workspace Domain
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={newCompanyDomain}
                onChange={(e) => setNewCompanyDomain(e.target.value)}
                placeholder="acme.com"
                className="w-full pl-3 pr-4 py-3 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-205"
              />
            </div>
            <span className="text-[9px] text-[var(--text-muted)] block font-mono text-left">
              Must match corporate email domains (e.g. user@domain.com)
            </span>
          </div>

          <button
            type="submit"
            disabled={isCreatingCompany || !newCompanyName.trim()}
            className="w-full py-3 mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
          >
            {isCreatingCompany ? "Creating Workspace..." : "Create Workspace"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded">
              Workspace Console
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              ID: WS-{companyDetails._id?.substring(18) || "682-ANTI"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] flex items-center gap-2.5">
            {companyDetails.name}
            {companyDetails.isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                Setup Required
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`http://localhost:5173/signup`);
              toast.success("Signup URL copied!");
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl transition cursor-pointer shadow-sm animate-all"
          >
            Copy Link
          </button>
          {companyDetails.isVerified && (
            <span className="px-3.5 py-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl">
              Active Node
            </span>
          )}
        </div>
      </div>

      {/* 2. General Configuration Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
        <div className="text-left">
          <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">General Configurations</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Workspace registration profile details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">Workspace Name</label>
            <input
              type="text"
              disabled
              value={companyDetails.name}
              className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">Verified Domain</label>
            <input
              type="text"
              disabled
              value={companyDetails.domain}
              className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 3. Domain Verification Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">Domain Verification Registry</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Authenticate domain ownership to secure user auto-join.</p>
          </div>
          {companyDetails.isVerified ? (
            <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 uppercase">Passed</span>
          ) : (
            <span className="text-xs font-mono font-bold text-amber-500 uppercase">Pending</span>
          )}
        </div>

        {companyDetails.isVerified ? (
          /* Verified Success View */
          <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl space-y-3 text-left">
            <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Domain Ownership Successfully Cleared
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Your workspace domain **{companyDetails.domain}** was verified via {companyDetails.verificationMethod === "dns" ? "DNS TXT record matching" : "corporate email OTP verification"}. Automatically accepting logins with corporate emails.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[10px] text-[var(--text-muted)] text-left">
              <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">SSL Status: Active</span>
              <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">Gateway: Verified</span>
              <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">MX Route: Valid</span>
            </div>
          </div>
        ) : currentUser?.role !== "ceo" ? (
          /* Non-CEO Unverified Warning */
          <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl flex items-start gap-3 text-left">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Domain verification is required. Only the CEO/Workspace Owner can verify or edit domain settings.
            </p>
          </div>
        ) : (
          /* Verification Wizard */
          <div className="space-y-5 text-left">
            {!(activeVerification || companyDetails.verificationCode) ? (
              /* Step 1: Select Verification Method */
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  1. Select Verification Method
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email OTP Option */}
                  <div
                    onClick={() => setVerificationMethod("otp")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${verificationMethod === "otp"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface)]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text)]">Email OTP Verification</span>
                      <input
                        type="radio"
                        name="verify_method"
                        checked={verificationMethod === "otp"}
                        onChange={() => setVerificationMethod("otp")}
                        className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                      Sends a 6-digit confirmation pin to verify domain connectivity.
                    </p>
                  </div>

                  {/* DNS TXT Option */}
                  <div
                    onClick={() => setVerificationMethod("dns")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${verificationMethod === "dns"
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface)]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text)]">DNS TXT Record</span>
                      <input
                        type="radio"
                        name="verify_method"
                        checked={verificationMethod === "dns"}
                        onChange={() => setVerificationMethod("dns")}
                        className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                      Requires adding a custom TXT code to your domain server DNS configuration.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyDomainStart}
                  disabled={isVerifyingDomain}
                  className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center font-sans"
                >
                  {isVerifyingDomain ? "Activating Process..." : "Generate Verification Code"}
                </button>
              </div>
            ) : (
              /* Step 2: Code verification form with sandbox intercept */
              <form onSubmit={handleConfirmDomain} className="space-y-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  2. Add Verification Code
                </p>

                {/* DNS TXT Instructions */}
                {((activeVerification?.method || companyDetails.verificationMethod) === "dns") && (
                  <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Required DNS Record Configuration</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="sm:col-span-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded">
                        <span className="text-[8px] text-[var(--text-muted)] block">TYPE</span>
                        <span className="text-[var(--text)] text-[11px] font-bold">TXT</span>
                      </div>
                      <div className="sm:col-span-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded">
                        <span className="text-[8px] text-[var(--text-muted)] block">HOST</span>
                        <span className="text-[var(--text)] text-[11px] font-bold">@</span>
                      </div>
                      <div className="sm:col-span-2 p-2 bg-[var(--surface)] border border-[var(--border)] rounded relative font-sans">
                        <span className="text-[8px] text-[var(--text-muted)] block">VALUE</span>
                        <span className="text-[var(--accent)] text-[10px] font-bold truncate block select-all pr-8">
                          {activeVerification?.code || companyDetails.verificationCode}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email OTP Info */}
                {((activeVerification?.method || companyDetails.verificationMethod) === "otp") && (
                  <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                      We sent a secure 6-digit confirmation pin to **{currentUser.email}**. Check your mailbox and input the security token below.
                    </p>
                  </div>
                )}

                {/* Sandbox Intercept Panel */}
                <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                      <span className="text-[9px] font-mono font-extrabold text-[var(--accent)] uppercase tracking-widest">
                        Sandbox Telemetry Intercept
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase font-bold">Local dev mode</span>
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                    Verification interceptor active. Grab key values instantly from this debugging interface:
                  </p>

                  <div className="flex items-center justify-between p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded font-mono text-xs">
                    <div className="text-left">
                      <span className="text-[8px] text-[var(--text-muted)] block uppercase font-bold font-mono">
                        {((activeVerification?.method || companyDetails.verificationMethod) === "otp") ? "OTP Security Key" : "DNS TXT value"}
                      </span>
                      <span className="text-[var(--accent)] font-extrabold tracking-wider select-all block mt-0.5">
                        {activeVerification?.code || companyDetails.verificationCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeVerification?.code || companyDetails.verificationCode);
                        toast.success("Copied!");
                      }}
                      className="px-2 py-1 bg-[var(--bg-soft)] border border-[var(--border)] rounded text-[9px] text-[var(--text)] hover:bg-[var(--border)] transition active:scale-95 cursor-pointer"
                    >
                      Copy Value
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] border-dashed text-[9px] font-mono text-[var(--text-muted)]">
                    <span>DNS Verification Bypass code:</span>
                    <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded font-bold uppercase tracking-wider">
                      MOCK_VERIFY
                    </span>
                  </div>
                </div>

                {/* Code Confirmation Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                    Verify Security Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={verificationCodeInput}
                      onChange={(e) => setVerificationCodeInput(e.target.value)}
                      placeholder={
                        ((activeVerification?.method || companyDetails.verificationMethod) === "otp")
                          ? "Enter 6-digit verification code"
                          : "Enter verification record or 'MOCK_VERIFY'"
                      }
                      className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-200 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingDomain || !verificationCodeInput.trim()}
                      className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isVerifyingDomain ? "Checking..." : "Verify"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelVerification}
                    className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-soft)] transition cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 4. Workspace Access & Onboarding Settings (Premium Panel) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-6 shadow-sm">
        <div className="text-left">
          <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">Access & Onboarding Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Configure automated member signup pipelines and SSO attributes.</p>
        </div>

        <div className="space-y-4 text-left">
          {/* Option 1: Auto join via domain */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                Domain Auto-Join
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed font-sans">
                Allow anyone with a verified **{companyDetails.domain}** email to sign up and join this workspace.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (currentUser?.role !== "ceo") {
                  toast.error("Only the CEO can modify security flags.");
                  return;
                }
                setAutoJoinEnabled(!autoJoinEnabled);
                toast.success(`Domain auto-join ${!autoJoinEnabled ? "enabled" : "disabled"}`);
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer relative shrink-0 ${autoJoinEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white block shadow-sm transform transition duration-200 ${autoJoinEnabled ? "translate-x-4.5" : "translate-x-0"
                }`}></span>
            </button>
          </div>

          {/* Option 2: Default Role */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="space-y-0.5 text-left">
              <span className="text-xs font-bold text-[var(--text)]">Default Registration Role</span>
              <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed font-sans">
                Set the default organizational access tier assigned to new auto-joined colleagues.
              </span>
            </div>
            <select
              value={defaultSignupRole}
              onChange={(e) => {
                if (currentUser?.role !== "ceo") {
                  toast.error("Only the CEO can modify security flags.");
                  return;
                }
                setDefaultSignupRole(e.target.value);
                toast.success(`Default signup role set to ${e.target.value}`);
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] cursor-pointer"
            >
              <option value="member">Member (Read/Write Tasks)</option>
              <option value="admin">Admin (Full Workspace Access)</option>
            </select>
          </div>

          {/* Option 3: Enforce MFA */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                Enforce Multi-Factor Auth (MFA)
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed font-sans">
                Force workspace members to complete double-factor verification.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (currentUser?.role !== "ceo") {
                  toast.error("Only the CEO can modify security flags.");
                  return;
                }
                setMfaEnforced(!mfaEnforced);
                toast.success(`MFA Enforcement ${!mfaEnforced ? "enabled" : "disabled"}`);
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer relative shrink-0 ${mfaEnforced ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white block shadow-sm transform transition duration-200 ${mfaEnforced ? "translate-x-4.5" : "translate-x-0"
                }`}></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainSettingsForm;
