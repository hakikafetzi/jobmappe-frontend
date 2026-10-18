import { useState } from 'react'
import { useCategories, useDeleteCategory } from '../../api/noteCategories'
import type { NoteCategory } from '../../api/types'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FolderIcon } from '../../shared/ui/icons'
import { IconButton } from '../../shared/ui/IconButton'
import { QueryView } from '../../shared/ui/QueryState'
import { useToast } from '../../shared/ui/toastContext'
import { SettingsSection } from '../settings/SettingsSection'
import { CategoryDialog } from './CategoryDialog'
import styles from './CategorySettings.module.css'

type Dialog =
  { kind: 'edit'; category: NoteCategory | null } | { kind: 'delete'; category: NoteCategory } | null

/** Ordner für Notizen: anlegen, umbenennen, löschen (volle API-Unterstützung). */
export function CategorySettings() {
  const query = useCategories()
  const remove = useDeleteCategory()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const close = () => setDialog(null)

  const confirmDelete = (category: NoteCategory) =>
    remove.mutate(category.id, {
      onSuccess: () => {
        close()
        toast('Ordner gelöscht')
      },
    })

  return (
    <SettingsSection
      title="Ordner für Notizen"
      count={query.data?.length}
      actions={<Button onClick={() => setDialog({ kind: 'edit', category: null })}>+ Ordner</Button>}
    >
      <QueryView query={query}>
        {(categories) =>
          categories.length ? (
            <ul className={styles.list}>
              {categories.map((c) => (
                <li key={c.id} className={styles.row}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.actions}>
                    <IconButton
                      aria-label={`${c.name} umbenennen`}
                      onClick={() => setDialog({ kind: 'edit', category: c })}
                    >
                      ✎
                    </IconButton>
                    <IconButton
                      aria-label={`${c.name} löschen`}
                      onClick={() => setDialog({ kind: 'delete', category: c })}
                    >
                      ✕
                    </IconButton>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={<FolderIcon />} title="Keine Ordner">
              Mit Ordnern sortierst du die Notizen deiner Bewerbungen.
            </EmptyState>
          )
        }
      </QueryView>

      {dialog?.kind === 'edit' && <CategoryDialog category={dialog.category} onClose={close} />}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Ordner löschen?"
          confirmLabel="Löschen"
          danger
          busy={remove.isPending}
          onCancel={close}
          onConfirm={() => confirmDelete(dialog.category)}
        >
          Der Ordner „{dialog.category.name}“ wird gelöscht.
        </ConfirmDialog>
      )}
    </SettingsSection>
  )
}
