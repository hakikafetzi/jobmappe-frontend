import { switchThemePreference } from '../theme/switchTheme'
import { useThemePreference } from '../theme/theme'
import { THEME_OPTIONS } from '../theme/themeOptions'
import { SlideSwitch } from './SlideSwitch'
import styles from './ThemeSwitch.module.css'

type Props = {
  /** menu: kompakt über die volle Breite (Profilmenü); settings: Einstellungszeile */
  size: 'menu' | 'settings'
} & ({ label: string; labelledBy?: never } | { label?: never; labelledBy: string })

/** Hell/Dunkel/System. Die Markierung gleitet zur Wahl, die Seite wechselt animiert die Farben. */
export function ThemeSwitch(props: Props) {
  const [theme] = useThemePreference()
  return (
    <SlideSwitch
      {...props}
      className={styles.theme}
      options={THEME_OPTIONS}
      value={theme}
      onSelect={(value, e) => {
        const r = e.currentTarget.getBoundingClientRect()
        switchThemePreference(value, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }}
    />
  )
}
