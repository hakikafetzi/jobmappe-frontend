import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useLatest } from '../shared/hooks/useLatest'
import { useMediaQuery, MOBILE_QUERY } from '../shared/hooks/useMediaQuery'
import { BriefcaseIcon, ColumnsIcon, HomeIcon, NoteIcon } from '../shared/ui/icons'
import styles from './MainNav.module.css'
import { areaOf, type Area } from './navArea'
import { paths } from './paths'

const ITEMS: { area: Area; to: string; label: string; Icon: typeof HomeIcon }[] = [
  { area: 'home', to: paths.home(), label: 'Startseite', Icon: HomeIcon },
  { area: 'postings', to: paths.postings(), label: 'Stellen', Icon: BriefcaseIcon },
  { area: 'applications', to: paths.applications(), label: 'Bewerbungen', Icon: ColumnsIcon },
  { area: 'notes', to: paths.notes(), label: 'Notizen', Icon: NoteIcon },
]

/** Setzt Strich (Desktop) bzw. Fläche (Dock) unter den aktiven Eintrag; ohne Eintrag ausgeblendet. */
function placeIndicator(
  nav: HTMLElement | null,
  ind: HTMLElement | null,
  area: Area,
  isMobile: boolean,
  animate: boolean,
) {
  const on = nav?.querySelector<HTMLElement>(`[data-area="${area}"]`)
  if (!ind) return
  // Bereich ohne Eintrag (Einstellungen): kein Strich
  if (!on) {
    ind.style.opacity = '0'
    return
  }
  const inset = isMobile ? 0 : parseFloat(getComputedStyle(on).paddingLeft) || 16
  if (!animate) ind.style.transition = 'none'
  ind.style.transform = `translateX(${on.offsetLeft + inset}px)`
  ind.style.width = `${on.offsetWidth - inset * 2}px`
  ind.style.opacity = '1'
  if (!animate) {
    void ind.offsetWidth
    ind.style.transition = ''
  }
}

export function MainNav() {
  const active = areaOf(useLocation().pathname)
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const lastArea = useRef<Area | null>(null)
  const latest = useLatest({ active, isMobile })

  // Gleitet zum aktiven Eintrag. Animiert nur beim Seitenwechsel, nicht beim ersten Platzieren
  // oder beim Wechsel zwischen Desktop und Dock.
  useLayoutEffect(() => {
    const animate = lastArea.current !== null && lastArea.current !== active
    placeIndicator(navRef.current, indicatorRef.current, active, isMobile, animate)
    lastArea.current = active
  }, [active, isMobile])

  // Neu vermessen ohne Animation: bei Größenänderung und sobald die Schrift geladen ist.
  // Nur einmal registrieren, sonst bricht das (sofort aufgelöste) fonts.ready jede Animation ab.
  useEffect(() => {
    let alive = true
    const remeasure = () => {
      if (!alive) return
      const { active: area, isMobile: mobile } = latest.current
      placeIndicator(navRef.current, indicatorRef.current, area, mobile, false)
    }
    window.addEventListener('resize', remeasure)
    void document.fonts?.ready.then(remeasure)
    return () => {
      alive = false
      window.removeEventListener('resize', remeasure)
    }
  }, [latest])

  return (
    <nav className={styles.nav} aria-label="Hauptnavigation" ref={navRef}>
      <span className={styles.indicator} ref={indicatorRef} aria-hidden="true" />
      {ITEMS.map(({ area, to, label, Icon }) => (
        <Link
          key={area}
          to={to}
          className={styles.item}
          data-area={area}
          aria-current={area === active ? 'page' : undefined}
        >
          <Icon className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
