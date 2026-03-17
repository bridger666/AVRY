"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"

type Locale = "en" | "id"

const SUPPORTED_LOCALES: Locale[] = ["en", "id"]
const STORAGE_KEY = "aivory_locale"
const DEFAULT_LOCALE: Locale = "en"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocaleContext must be used within a LocaleProvider")
  return ctx
}

export function getInitialLocale(): Locale {
  try {
    if (typeof window === "undefined") return DEFAULT_LOCALE
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE
}

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  try {
    const msgs = await import(`@/messages/${locale}.json`)
    return msgs.default ?? msgs
  } catch {
    // Fallback to English if import fails
    if (locale !== DEFAULT_LOCALE) {
      const fallback = await import(`@/messages/${DEFAULT_LOCALE}.json`)
      return fallback.default ?? fallback
    }
    return {}
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null)
  const [mounted, setMounted] = useState(false)

  // Read initial locale from localStorage on mount
  useEffect(() => {
    const initial = getInitialLocale()
    setLocaleState(initial)
    setMounted(true)
  }, [])

  // Load messages when locale changes
  useEffect(() => {
    if (!mounted) return
    loadMessages(locale).then(setMessages)
  }, [locale, mounted])

  const setLocale = (newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // localStorage unavailable — still update state for session
    }
    setLocaleState(newLocale)
  }

  // Don't render until messages are loaded
  if (!messages) return null

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}