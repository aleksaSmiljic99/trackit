// Responsive web chrome. Full-bleed background, a slim sticky top bar with the
// wordmark / unit toggle / nav, and a centered reading-width column for content
// so the Broadsheet display type keeps its measure on wide screens.
export default function AppShell({
  view,
  onNavigate,
  unit,
  onToggleUnit,
  onSignOut,
  showNav = true,
  children,
}) {
  const navItem = (id, label) => (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      aria-current={view === id ? 'page' : undefined}
      className={
        'text-[13px] uppercase tracking-[0.12em] min-h-[44px] flex items-center ' +
        (view === id ? 'text-accent-700' : 'text-neutral-600 hover:text-accent-700')
      }
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-divider">
        <div className="mx-auto max-w-[860px] px-5 sm:px-8 flex items-center gap-[14px] sm:gap-[20px] h-[56px]">
          <button
            type="button"
            onClick={() => onNavigate('today')}
            className="text-[13px] font-semibold uppercase tracking-[0.2em] shrink-0"
          >
            TrackIt
          </button>

          {showNav ? (
            <nav className="flex items-center gap-[14px] sm:gap-[18px] mr-auto overflow-x-auto">
              {navItem('today', 'Today')}
              {navItem('history', 'History')}
              {navItem('routines', 'Days')}
            </nav>
          ) : (
            <div className="mr-auto" />
          )}

          <button
            type="button"
            onClick={onToggleUnit}
            className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
          >
            {unit === 'kg' ? 'kg' : 'lb'}
          </button>

          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] hidden sm:flex items-center hover:text-accent-700"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[620px] px-6 sm:px-8 py-10 sm:py-14">
        {children}
      </main>
    </div>
  )
}
