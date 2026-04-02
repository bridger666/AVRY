"use client"
"use client"
import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "aivory_sidebar_collapsed"

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return { collapsed, toggle }
}
