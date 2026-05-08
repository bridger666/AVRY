import styles from './ROIMetricTile.module.css'

interface ROIMetricTileProps {
  label: string
  value: number | null
  formatter: (value: number) => string
}

export default function ROIMetricTile({ label, value, formatter }: ROIMetricTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      {value === null ? (
        <span className={styles.insufficient}>Insufficient data</span>
      ) : (
        <span className={styles.value}>{formatter(value)}</span>
      )}
    </div>
  )
}
