import { useEffect, useState } from 'react'

/** Aktuelle Zeit, aktualisiert im angegebenen Intervall (Standard 15 s). */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
