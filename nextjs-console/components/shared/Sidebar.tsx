"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getWorkflowCount } from "@/hooks/useWorkflows"
import styles from "./Sidebar.module.css"

export default function Sidebar() {
  const pathname = usePathname()
  const [workflowCount, setWorkflowCount] = useState(0)

  useEffect(() => {
    const update = () => setWorkflowCount(getWorkflowCount())
    update()
    // Re-check when storage changes (cross-tab or same-tab via custom event)
    window.addEventListener('storage', update)
    window.addEventListener('aivory_workflows_updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('aivory_workflows_updated', update)
    }
  }, [])

  const navItems = [
    { label: "Console", href: "/console" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Diagnostics", href: "/diagnostics" },
    { label: "Blueprint", href: "/blueprint" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Workflows", href: "/workflows", badge: workflowCount > 0 ? workflowCount : null },
    { label: "Execution Logs", href: "/logs" },
    { label: "Integrations", href: "/integrations" },
    { label: "Settings", href: "/settings" },
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
            <span>{item.label}</span>
            {'badge' in item && item.badge !== null && (
              <span className={styles.navBadge}>{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <a href="/" className={styles.navItem}>
          <span>Home</span>
        </a>
      </div>
    </aside>
  )
}
