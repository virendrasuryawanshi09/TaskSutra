import { LuLoader, LuCheck, LuSave, LuRotateCcw } from "react-icons/lu";

const ProfileSaveBar = ({ isBusy, saved, onSave, onDiscard }) => (
  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.12)] px-2 py-2">
      <button
        type="button"
        onClick={onDiscard}
        disabled={isBusy}
        title="Discard changes"
        className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--bg-soft)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <LuRotateCcw className="text-[13px]" />
        Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isBusy}
        className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-[12.5px] font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed ${
          saved
            ? "bg-emerald-600"
            : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md"
        }`}
      >
        {isBusy ? <LuLoader className="text-sm animate-spin" /> : saved ? <LuCheck className="text-sm" /> : <LuSave className="text-sm" />}
        {isBusy ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  </div>
);

export default ProfileSaveBar;
