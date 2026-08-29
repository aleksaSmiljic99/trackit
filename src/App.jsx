import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import TodayScreen from './screens/TodayScreen.jsx'
import WorkScreen from './screens/WorkScreen.jsx'
import DoneScreen from './screens/DoneScreen.jsx'
import RoutinesScreen from './screens/RoutinesScreen.jsx'
import RoutineEditorScreen from './screens/RoutineEditorScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { usePreferences } from './hooks/usePreferences.js'
import { useRoutines } from './hooks/useRoutines.js'
import { useHistory } from './hooks/useHistory.js'
import { useLogs } from './hooks/useLogs.js'
import { useWorkout } from './hooks/useWorkout.js'

function Centered({ children }) {
  return (
    <div className="min-h-full bg-bg flex justify-center">
      <div className="w-full max-w-[520px] px-6 py-14 sm:py-20">{children}</div>
    </div>
  )
}

function SetupNotice() {
  return (
    <Centered>
      <div className="flex flex-col gap-[15px]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.2em]">TrackIt</div>
        <h1 className="text-[38px] font-semibold leading-[1.05]">Connect Supabase</h1>
        <p className="text-[17px] text-neutral-700">
          Create <code>.env</code> from <code>.env.example</code> and set{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then
          restart the dev server. Run <code>supabase/schema.sql</code> in the Supabase
          SQL editor first.
        </p>
      </div>
    </Centered>
  )
}

function AuthedApp() {
  const { signOut } = useAuth()
  const { prefs, toggleUnit } = usePreferences()
  const routines = useRoutines()
  const history = useHistory()
  const logs = useLogs()
  const wk = useWorkout({
    prefs,
    onSaved: () => {
      routines.refresh()
      history.refresh()
      logs.refresh()
    },
  })

  const [view, setView] = useState('today') // 'today' | 'routines' | 'editor'
  const [editing, setEditing] = useState(null) // routine object, or 'new'

  const navigate = (v) => {
    setEditing(null)
    setView(v)
  }

  const shellProps = {
    unit: prefs.unit,
    onToggleUnit: toggleUnit,
    onSignOut: signOut,
    view,
    onNavigate: navigate,
  }

  if (wk.screen === 'work') {
    return (
      <AppShell {...shellProps} showNav={false}>
        <WorkScreen wk={wk} prefs={prefs} />
      </AppShell>
    )
  }
  if (wk.screen === 'done') {
    return (
      <AppShell {...shellProps} showNav={false}>
        <DoneScreen wk={wk} prefs={prefs} />
      </AppShell>
    )
  }

  let content
  if (view === 'editor') {
    content = (
      <RoutineEditorScreen
        initial={editing === 'new' ? null : editing}
        unit={prefs.unit}
        onToggleUnit={toggleUnit}
        onCancel={() => navigate('routines')}
        onSave={async (data) => {
          if (editing === 'new') await routines.create(data)
          else await routines.update(editing.id, data)
          navigate('routines')
        }}
        onDelete={async (id) => {
          await routines.remove(id)
          navigate('routines')
        }}
      />
    )
  } else if (view === 'history') {
    content = (
      <HistoryScreen
        logs={logs.logs}
        loading={logs.loading}
        error={logs.error}
        unit={prefs.unit}
      />
    )
  } else if (view === 'routines') {
    content = (
      <RoutinesScreen
        routines={routines.routines}
        loading={routines.loading}
        error={routines.error}
        onNew={() => {
          setEditing('new')
          setView('editor')
        }}
        onEdit={(r) => {
          setEditing(r)
          setView('editor')
        }}
        onDelete={(id) => routines.remove(id)}
      />
    )
  } else {
    content = (
      <TodayScreen
        routines={routines.routines}
        routinesLoading={routines.loading}
        recent={history.recent}
        wk={wk}
        prefs={prefs}
        onManage={() => navigate('routines')}
      />
    )
  }

  return <AppShell {...shellProps}>{content}</AppShell>
}

export default function App() {
  const { configured, loading, user } = useAuth()

  if (!configured) return <SetupNotice />
  if (loading)
    return (
      <Centered>
        <div className="text-[15px] text-neutral-600">Loading…</div>
      </Centered>
    )
  if (!user)
    return (
      <Centered>
        <AuthScreen />
      </Centered>
    )
  return <AuthedApp />
}
