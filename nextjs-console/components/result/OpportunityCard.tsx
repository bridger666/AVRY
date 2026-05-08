import type { RankedOpportunity } from '@/types/diagnostic'
import { humanizeQuadrant } from '@/lib/resultFormatters'
import styles from './OpportunityCard.module.css'

interface OpportunityCardProps {
  opportunity: RankedOpportunity
  isHighlighted: boolean
}

const dataReadinessLabel: Record<string, string> = {
  ready: 'Data Ready',
  needs_prep: 'Needs Data Prep',
  not_ready: 'Data Not Ready',
}

const dataReadinessClass: Record<string, string> = {
  ready: styles.badgeReady,
  needs_prep: styles.badgeNeedsPrep,
  not_ready: styles.badgeNotReady,
}

export default function OpportunityCard({ opportunity, isHighlighted }: OpportunityCardProps) {
  const cardClass = [styles.card, isHighlighted ? styles.highlighted : ''].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      <div className={styles.header}>
        <h3 className={styles.name}>{opportunity.name}</h3>
        <span className={styles.quadrantBadge}>{humanizeQuadrant(opportunity.quadrant)}</span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Impact</span>
          <span className={styles.metricValue}>{opportunity.impactScore}/10</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Effort</span>
          <span className={styles.metricValue}>{opportunity.effortScore}/10</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Time to Value</span>
          <span className={styles.metricValue}>{opportunity.timeToValueWeeks}w</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Complexity</span>
          <span className={styles.metricValue} style={{ textTransform: 'capitalize' }}>{opportunity.errorComplexity}</span>
        </div>
      </div>

      {opportunity.projectedROINote && (
        <p className={styles.roiNote}>{opportunity.projectedROINote}</p>
      )}

      <div className={styles.badges}>
        <span className={`${styles.badge} ${dataReadinessClass[opportunity.dataReadiness] ?? ''}`}>
          {dataReadinessLabel[opportunity.dataReadiness] ?? opportunity.dataReadiness}
        </span>
        {opportunity.prerequisites.length > 0 && (
          <span className={styles.badge}>
            Prereqs: {opportunity.prerequisites.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}
