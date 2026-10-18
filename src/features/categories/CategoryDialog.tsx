import { useState } from 'react'
import { serverFieldErrors } from '../../api/errors'
import { saveCategoryMeta, useSaveCategory } from '../../api/noteCategories'
import type { NoteCategory } from '../../api/types'
import { isFolderName } from '../../shared/lib/validation'
import { Button } from '../../shared/ui/Button'
import { ModalDialog } from '../../shared/ui/Dialog'
import { Field, RequiredNote, TextInput } from '../../shared/ui/Field'
import { useToast } from '../../shared/ui/toastContext'

/** Ordner anlegen (category = null) oder umbenennen. */
export function CategoryDialog({
  category,
  onClose,
}: {
  category: NoteCategory | null
  onClose: () => void
}) {
  const toast = useToast()
  const save = useSaveCategory()
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Bitte einen Namen eingeben.')
      return
    }
    if (!isFolderName(trimmed)) {
      setError('Bitte einen gültigen Namen eingeben.')
      return
    }
    save.mutate(
      { id: category?.id ?? null, body: { name: trimmed } },
      {
        onSuccess: () => {
          onClose()
          toast(category ? 'Ordner umbenannt' : 'Ordner angelegt')
        },
        onError: (err) => setError(serverFieldErrors(err, saveCategoryMeta).name ?? null),
      },
    )
  }

  return (
    <ModalDialog
      title={category ? 'Ordner umbenennen' : 'Neuer Ordner'}
      size="small"
      onClose={onClose}
      footerStart={<RequiredNote />}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={submit} disabled={save.isPending}>
            Speichern
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Name" error={error} required>
          {(id) => (
            <TextInput
              id={id}
              autoFocus
              required
              placeholder="z. B. Gehaltsverhandlung"
              maxLength={255}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          )}
        </Field>
      </form>
    </ModalDialog>
  )
}
