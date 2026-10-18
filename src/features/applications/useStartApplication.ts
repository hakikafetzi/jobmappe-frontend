import { useNavigate } from 'react-router'
import { useStartApplication } from '../../api/applications'
import { paths, type ApplicationOrigin } from '../../app/paths'
import { useToast } from '../../shared/ui/toastContext'

/** Bewerbung zu einer Stelle anlegen und direkt öffnen. */
export function useStartAndOpenApplication(origin: 'postings' | 'home') {
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartApplication()

  const run = (postingId: string) =>
    start.mutate(postingId, {
      onSuccess: (application) => {
        const state: ApplicationOrigin =
          origin === 'postings' ? { from: 'postings', postingId } : { from: 'home' }
        void navigate(paths.application(application.id), { state })
        toast('Bewerbung angelegt — Status „In Bearbeitung“')
      },
    })

  return { run, isPending: start.isPending }
}
