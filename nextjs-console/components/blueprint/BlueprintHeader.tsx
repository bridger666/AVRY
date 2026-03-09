import styles from './BlueprintHeader.module.css'

interface BlueprintVersion {
  version: string
  created_at: string
  created_by: string
  status: string
}

interface BlueprintHeaderProps {
  blueprintId: string
  version: string
  status: string
  maturityLevel: string
  estimatedROI: number
  showSampleBanner?: boolean
  versions?: BlueprintVersion[]
  onVersionChange?: (version: string) => void
  onRegenerate?: () => void
}

export default function BlueprintHeader({
  blueprintId,
  version,
  status,
  maturityLevel,
  estimatedROI,
  showSampleBanner = false,
  versions = [],
  onVersionChange,
  onRegenerate
}: BlueprintHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      {showSampleBanner && (
        <div className={styles.sampleBanner}>
          <span className={styles.bannerIcon}>ℹ️</span>
          <span className={styles.bannerText}>
            This is a sample AI System Blueprint. In the next phase, this will be generated from your diagnostic.
          </span>
        </div>
      )}

      <div className={styles.headerContent}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>AI System Blueprint</h1>
          {onRegenerate && (
            <button onClick={onRegenerate} className={styles.regenerateButton}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8C13.5 10.7614 11.2614 13 8.5 13C5.73858 13 3.5 10.7614 3.5 8C3.5 5.23858 5.73858 3 8.5 3C10.0977 3 11.5 3.73858 12.3536 4.85355" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 2V5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Regenerate Blueprint
            </button>
          )}
        </div>
        
        <div className={styles.subtitle}>
          <span className={styles.metadataItem}>{blueprintId}</span>
          <span className={styles.separator}>•</span>
          {versions.length > 0 && onVersionChange ? (
            <select
              value={version}
              onChange={(e) => onVersionChange(e.target.value)}
              className={styles.versionDropdown}
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  Version {v.version}
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.metadataItem}>Version {version}</span>
          )}
          <span className={styles.separator}>•</span>
          <span className={styles.metadataItem}>{status}</span>
        </div>

        <div className={styles.pillsContainer}>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Maturity Level:</span>
            <span className={styles.pillValue}>{maturityLevel}</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Estimated ROI:</span>
            <span className={styles.pillValue}>{estimatedROI} months</span>
          </div>
        </div>
      </div>
    </div>
  )
}
