import Link from "next/link"
import styles from "../diagnostics/placeholder.module.css"

export default function SettingsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>
          Manage your account preferences, subscription tier, notification settings, and system configuration options.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryButton}>
            Back to Dashboard
          </Link>
          <Link href="/console" className={styles.secondaryButton}>
            Open Console
          </Link>
        </div>
      </div>
    </div>
  )
}
