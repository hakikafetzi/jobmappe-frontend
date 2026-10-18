import { useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { CommandPalette } from '../features/command-palette/CommandPalette'
import { CommandsProvider } from '../features/command-palette/CommandsProvider'
import { CompanyDialog } from '../features/postings/company-edit/CompanyDialog'
import { NoteWorkspaceProvider } from '../features/notes/NoteWorkspaceProvider'
import { NewPostingDialog } from '../features/postings/new-posting/NewPostingDialog'
import { Logo } from '../shared/ui/Logo'
import styles from './AppShell.module.css'
import { MainNav } from './MainNav'
import { PaletteTrigger } from './PaletteTrigger'
import { paths } from './paths'
import { ProfileMenu } from './ProfileMenu'
import { AppActionsContext } from './uiContext'
import { useGlobalHotkeys } from './useGlobalHotkeys'

/** Rahmen jeder Seite: Kopfleiste mit Navigation, Inhalt, app-weite Dialoge. */
export function AppShell() {
  const [newPostingOpen, setNewPostingOpen] = useState(false)
  const [newCompanyOpen, setNewCompanyOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const navigate = useNavigate()
  const actions = useMemo(
    () => ({
      openNewPosting: () => setNewPostingOpen(true),
      openNewCompany: () => setNewCompanyOpen(true),
      openCommandPalette: () => setPaletteOpen(true),
    }),
    [],
  )

  useGlobalHotkeys({ navigate, ...actions })

  return (
    <AppActionsContext.Provider value={actions}>
      <CommandsProvider>
        {/* Notizfenster app-weit: minimierte bleiben beim Seitenwechsel unten in der Leiste */}
        <NoteWorkspaceProvider>
          <div className={styles.shell}>
            <header className={styles.topbar}>
              <Logo />
              <MainNav />
              <div className={styles.actions}>
                <PaletteTrigger onClick={actions.openCommandPalette} />
                <ProfileMenu />
              </div>
            </header>
            <main className={styles.main}>
              <Outlet />
            </main>
          </div>
          {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
          {newPostingOpen && <NewPostingDialog onClose={() => setNewPostingOpen(false)} />}
          {newCompanyOpen && (
            <CompanyDialog
              company={null}
              onClose={() => setNewCompanyOpen(false)}
              onSaved={(company) => void navigate(paths.company(company.id))}
            />
          )}
        </NoteWorkspaceProvider>
      </CommandsProvider>
    </AppActionsContext.Provider>
  )
}
