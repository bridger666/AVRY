import styles from './ConsoleTopBar.module.css'

interface ConsoleTopBarProps {
  onNewChat: () => void
}

export default function ConsoleTopBar({ onNewChat }: ConsoleTopBarProps) {
  return (
    <div className={styles.consoleTopbar}>
      <div className={styles.consoleBrand}>
        <span className={styles.consoleBrandLabel}>Console</span>
      </div>
      <div className={styles.topbarRight}>
        <button 
          className={styles.newChatButton}
          onClick={onNewChat}
          title="Start a new conversation"
        >
          New chat
        </button>
      </div>
    </div>
  )
}
