import { LuLoader, LuCheck, LuSave } from "react-icons/lu";

const ProfileSaveBar = ({ isBusy, saved, user, onSave, onDiscard }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl shadow-[0_-2px_24px_rgba(0,0,0,0.07)]">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
      <div className="hidden sm:flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
        <p className="text-[12.5px] text-[var(--text-muted)]">
          Autosave is off — confirm changes manually.
        </p>
      </div>
      <div className="flex items-center gap-2.5 ml-auto">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isBusy}
          className="rounded-xl border border-[var(--border)] px-4 py-2 text-[13px] font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--bg-soft)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isBusy}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBusy ? (
            <LuLoader className="text-base animate-spin" />
          ) : saved ? (
            <LuCheck className="text-base" />
          ) : (
            <LuSave className="text-base" />
          )}
          {isBusy ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
);

export default ProfileSaveBar;
