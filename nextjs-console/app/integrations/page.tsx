import Link from "next/link"
import styles from "../diagnostics/placeholder.module.css"

export default function IntegrationsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>Integrations</h1>
        <p className={styles.description}>
          Connect Aivory with your existing tools and platforms. Manage API keys, webhooks, and third-party service integrations.
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
