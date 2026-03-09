import Link from "next/link"
import styles from "../diagnostics/placeholder.module.css"

export default function LogsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>Execution Logs</h1>
        <p className={styles.description}>
          View detailed execution logs for all workflow runs, diagnostic assessments, and system activities. Monitor performance and troubleshoot issues.
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
