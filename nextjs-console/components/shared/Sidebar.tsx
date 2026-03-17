"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { getWorkflowCount } from "@/hooks/useWorkflows"
import LanguagePill from "./LanguagePill"
import styles from "./Sidebar.module.css"

export default function Sidebar() {
  const pathname = usePathname()
  const [workflowCount, setWorkflowCount] = useState(0)
  const t = useTranslations("nav")

  useEffect(() => {
    const update = () => setWorkflowCount(getWorkflowCount())
    update()
    window.addEventListener('storage', update)
    window.addEventListener('aivory_workflows_updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('aivory_workflows_updated', update)
    }
  }, [])

  const navItems = [
    { key: "console", href: "/console" },
    { key: "dashboard", href: "/dashboard" },
    { key: "diagnostics", href: "/diagnostics" },
    { key: "blueprint", href: "/blueprint" },
    { key: "roadmap", href: "/roadmap" },
    { key: "workflows", href: "/workflows", badge: workflowCount > 0 ? workflowCount : null },
    { key: "executionLogs", href: "/logs" },
    { key: "integrations", href: "/integrations" },
    { key: "settings", href: "/settings" },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <Image 
            src="/Aivory_Avatar.svg" 
            alt="Aivory" 
            width={32} 
            height={32}
            className={styles.logoImage}
          />
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href || pathname.startsWith(item.href + '/') ? styles.active : ''}`}
          >
            <span>{t(item.key)}</span>
            {'badge' in item && item.badge !== null && (
              <span className={styles.navBadge}>{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <LanguagePill />
        <a href="/" className={styles.navItem}>
          <span>{t("home")}</span>
        </a>
      </div>
    </aside>
  )
}
