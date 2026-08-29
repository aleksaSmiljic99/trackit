import { useEffect, useRef, useState } from "react";

// Responsive web chrome. Full-bleed background, a slim sticky top bar with the
// wordmark / nav / account menu, and a centered reading-width column for content
// so the Broadsheet display type keeps its measure on wide screens.
export default function AppShell({
  view,
  onNavigate,
  unit,
  onToggleUnit,
  onSignOut,
  prefs,
  onUpdatePrefs,
  showNav = true,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const navItem = (id, label) => (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      aria-current={view === id ? "page" : undefined}
      className={
        "text-[13px] uppercase tracking-[0.12em] min-h-[44px] flex items-center " +
        (view === id ? "text-accent-700" : "text-neutral-600 hover:text-accent-700")
      }
    >
      {label}
    </button>
  );

  const canSetRest = prefs && onUpdatePrefs;

  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-10 bg-header backdrop-blur border-b border-divider">
        <div className="mx-auto max-w-[860px] px-5 sm:px-8 flex items-center gap-[14px] sm:gap-[20px] h-[56px]">
          <button
            type="button"
            onClick={() => onNavigate("today")}
            className="text-[13px] font-semibold uppercase tracking-[0.2em] shrink-0"
          >
            TrackIt
          </button>

          {showNav ? (
            <nav className="flex items-center gap-[14px] sm:gap-[18px] mr-auto overflow-x-auto">
              {navItem("today", "Today")}
              {navItem("history", "History")}
              {navItem("progress", "Progress")}
              {navItem("routines", "Split")}
            </nav>
          ) : (
            <div className="mr-auto" />
          )}

          <button
            type="button"
            onClick={onToggleUnit}
            className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600 shrink-0"
          >
            {unit === "kg" ? "kg" : "lb"}
          </button>

          {onSignOut ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account and settings"
                className="min-h-[44px] px-[4px] flex items-center text-[20px] leading-none text-neutral-600 hover:text-accent-700"
              >
                ⋯
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[48px] w-[248px] bg-bg border border-divider rounded-[2px] shadow-lg p-[14px] flex flex-col gap-[12px]"
                >
                  {canSetRest ? (
                    <>
                      <div className="flex flex-col gap-[6px]">
                        <span className="text-[13px] uppercase tracking-[0.12em] text-neutral-700">
                          Theme
                        </span>
                        <div className="inline-flex overflow-hidden rounded-[2px] border border-neutral-400 self-start">
                          {["system", "light", "dark"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => onUpdatePrefs({ theme: t })}
                              aria-pressed={prefs.theme === t}
                              className={
                                "text-[12px] capitalize tracking-[0.04em] min-h-[36px] px-[12px] " +
                                (prefs.theme === t
                                  ? "bg-accent text-white"
                                  : "text-neutral-700 hover:text-accent-700")
                              }
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-divider" />

                      <div className="flex items-center justify-between gap-[10px]">
                        <span className="text-[13px] uppercase tracking-[0.12em] text-neutral-700">
                          Rest timer
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePrefs({ showRestTimer: !prefs.showRestTimer })
                          }
                          className={
                            "text-[13px] uppercase tracking-[0.1em] min-h-[36px] px-[10px] rounded-[2px] " +
                            (prefs.showRestTimer
                              ? "bg-accent text-white"
                              : "border border-neutral-400 text-neutral-700")
                          }
                        >
                          {prefs.showRestTimer ? "On" : "Off"}
                        </button>
                      </div>

                      {prefs.showRestTimer ? (
                        <div className="flex items-center justify-between gap-[10px]">
                          <span className="text-[13px] uppercase tracking-[0.12em] text-neutral-700">
                            Rest length
                          </span>
                          <div className="flex items-center gap-[8px] tabular-nums">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePrefs({
                                  restSeconds: Math.max(30, prefs.restSeconds - 15),
                                })
                              }
                              className="w-[32px] h-[32px] border border-neutral-400 rounded-[2px] flex items-center justify-center text-[18px] hover:border-accent hover:text-accent-700"
                              aria-label="less rest"
                            >
                              −
                            </button>
                            <span className="text-[14px] w-[52px] text-center">
                              {prefs.restSeconds}s
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePrefs({
                                  restSeconds: Math.min(240, prefs.restSeconds + 15),
                                })
                              }
                              className="w-[32px] h-[32px] border border-neutral-400 rounded-[2px] flex items-center justify-center text-[18px] hover:border-accent hover:text-accent-700"
                              aria-label="more rest"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="border-t border-divider" />
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="text-[13px] uppercase tracking-[0.12em] text-neutral-700 min-h-[44px] flex items-center hover:text-magenta-700"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[620px] px-6 sm:px-8 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
