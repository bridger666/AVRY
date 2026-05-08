import type { RankedOpportunity } from '@/types/diagnostic'
import styles from './OpportunityMatrix.module.css'

interface OpportunityMatrixProps {
  opportunities: RankedOpportunity[]
  highlightedId: string | null
  onDotClick: (id: string) => void
}

// Plot region bounds
const PLOT_LEFT = 60
const PLOT_RIGHT = 380
const PLOT_TOP = 20
const PLOT_BOTTOM = 340
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT   // 320
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP  // 320

// Midpoint dividers (effort=5.5, impact=5.5)
const MID_X = PLOT_LEFT + ((5.5 - 1) / 9) * PLOT_WIDTH
const MID_Y = PLOT_TOP + ((10 - 5.5) / 9) * PLOT_HEIGHT

function dotX(effortScore: number): number {
  return PLOT_LEFT + ((effortScore - 1) / 9) * PLOT_WIDTH
}

function dotY(impactScore: number): number {
  // Inverted Y: high impact at top
  return PLOT_TOP + ((10 - impactScore) / 9) * PLOT_HEIGHT
}

// Known limitation: if opportunities array exceeds ~15 items, dots may overlap
// in the 400×400 plot area. No fix needed now — document as code comment.

export default function OpportunityMatrix({ opportunities, highlightedId, onDotClick }: OpportunityMatrixProps) {
  return (
    <div className={styles.container}>
      <svg
        viewBox="0 0 400 400"
        width="400"
        height="400"
        className={styles.svg}
        aria-label="Opportunity priority matrix"
        role="img"
      >
        {/* Axes */}
        <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="#666864" strokeWidth="1" />
        <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke="#666864" strokeWidth="1" />

        {/* Axis labels */}
        <text className={styles.axisLabel} x={(PLOT_LEFT + PLOT_RIGHT) / 2} y={390}>
          Effort →
        </text>
        <text
          className={styles.axisLabelY}
          x={14}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          transform={`rotate(-90, 14, ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
        >
          Impact ↑
        </text>

        {/* Quadrant dividers */}
        <line className={styles.divider} x1={MID_X} y1={PLOT_TOP} x2={MID_X} y2={PLOT_BOTTOM} />
        <line className={styles.divider} x1={PLOT_LEFT} y1={MID_Y} x2={PLOT_RIGHT} y2={MID_Y} />

        {/* Quadrant labels */}
        <text className={styles.quadrantLabel} x={PLOT_LEFT + 8} y={PLOT_TOP + 16}>Quick Win</text>
        <text className={styles.quadrantLabel} x={MID_X + 8} y={PLOT_TOP + 16}>Major Project</text>
        <text className={styles.quadrantLabel} x={PLOT_LEFT + 8} y={MID_Y + 16}>Fill In</text>
        <text className={styles.quadrantLabel} x={MID_X + 8} y={MID_Y + 16}>Thankless Task</text>

        {/* Dots */}
        {opportunities.map(opp => {
          const isHighlighted = opp.id === highlightedId
          const cx = dotX(opp.effortScore)
          const cy = dotY(opp.impactScore)
          return (
            <circle
              key={opp.id}
              className={styles.dot}
              role="button"
              aria-label={opp.name}
              aria-pressed={isHighlighted}
              tabIndex={0}
              onClick={() => onDotClick(opp.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onDotClick(opp.id)
                }
              }}
              cx={cx}
              cy={cy}
              r={isHighlighted ? 10 : 8}
              fill="#00e59e"
              stroke={isHighlighted ? '#fff' : '#262623'}
              strokeWidth={isHighlighted ? 2 : 1}
              opacity={isHighlighted ? 1 : 0.7}
              style={{ cursor: 'pointer' }}
            />
          )
        })}
      </svg>
    </div>
  )
}
