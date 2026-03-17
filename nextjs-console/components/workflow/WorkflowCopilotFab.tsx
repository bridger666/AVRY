'use client'

import styles from './WorkflowCopilotFab.module.css'

interface WorkflowCopilotFabProps {
  isOpen: boolean
  onClick: () => void
}

export function WorkflowCopilotFab({ isOpen, onClick }: WorkflowCopilotFabProps) {
  return (
    <button
      className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close AIRA Copilot' : 'Open AIRA Copilot'}
      title={isOpen ? 'Close AIRA Copilot' : 'Open AIRA Copilot'}
    >
      {isOpen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ) : (
        <img src="/Aivory_Avatar.svg" alt="" width={20} height={20} aria-hidden="true" />
      )}
      <span className={styles.fabLabel}>{isOpen ? 'Close' : 'AIRA Copilot'}</span>
    </button>
  )
}
