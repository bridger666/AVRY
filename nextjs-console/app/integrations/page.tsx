'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import styles from './integrations.module.css'
import type { AivoryApp, AivoryConnection, CreateConnectionPayload } from '@/types/integrations'
import { useRouterContext } from '@/contexts/RouterContext'
import { ContinuedFromConsole } from '@/components/routing/ContinuedFromConsole'

// ── Helpers ──────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Connect / Reconnect Modal ────────────────────────────

interface ConnectModalProps {
  app: AivoryApp
  existingId?: string   // set when reconnecting
  onClose: () => void
  onSaved: () => void
}

function ConnectModal({ app, existingId, onClose, onSaved }: ConnectModalProps) {
  const t = useTranslations("integrations")
  const tCommon = useTranslations("common")
  const [displayName, setDisplayName] = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isReconnect = !!existingId

  const handleSubmit = async () => {
    if (!isReconnect && !displayName.trim()) {
      setError(t('connectionNameRequired'))
      return
    }
    for (const f of app.fields) {
      if (f.required && !fieldValues[f.key]?.trim()) {
        setError(`${f.label} is required`)
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      let res: Response
      if (isReconnect) {
        res = await fetch(`/api/integrations/connections/${existingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: fieldValues }),
        })
      } else {
        const payload: CreateConnectionPayload = {
          appId: app.id,
          displayName: displayName.trim(),
          credentials: fieldValues,
        }
        res = await fetch('/api/integrations/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed (${res.status})`)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {app.iconPath ? (
            <img src={app.iconPath} alt="" className={styles.modalAppIcon} data-brand={app.id.toLowerCase()} style={{ width: 28, height: 28 }} />
          ) : (
            <span className={styles.modalAppIcon}>{app.icon}</span>
          )}
          <div>
            <p className={styles.modalTitle}>{isReconnect ? `Reconnect ${app.name}` : `Connect ${app.name}`}</p>
            <p className={styles.modalSubtitle}>{app.description}</p>
          </div>
        </div>

        <p className={styles.securityNote}>
          {t("securityNote")}
        </p>

        {!isReconnect && (
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t("connectionName")}</label>
            <input
              className={styles.formInput}
              placeholder={`e.g. ${app.name} Production`}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {app.fields.map(f => (
          <div key={f.key} className={styles.formField}>
            <label className={styles.formLabel}>
              {f.label}{!f.required && <span className={styles.optionalTag}> optional</span>}
            </label>
            <input
              className={styles.formInput}
              type={f.type === 'password' ? 'password' : f.type === 'url' ? 'url' : 'text'}
              placeholder={f.placeholder}
              value={fieldValues[f.key] ?? ''}
              onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>{tCommon("cancel")}</button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? t("saving") : isReconnect ? t("updateCredentials") : t("saveConnection")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────

function StatusBadge({ status }: { status: AivoryConnection['status'] }) {
  const map = {
    connected: { label: 'Connected', cls: styles.statusConnected },
    revoked: { label: 'Revoked', cls: styles.statusRevoked },
    needs_reauth: { label: 'Needs re-auth', cls: styles.statusReauth },
  }
  const { label, cls } = map[status]
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>
}

// ── Main Page ────────────────────────────────────────────

export default function IntegrationsPage() {
  const [apps, setApps] = useState<AivoryApp[]>([])
  const [connections, setConnections] = useState<AivoryConnection[]>([])
  const [connectingApp, setConnectingApp] = useState<AivoryApp | null>(null)
  const [reconnectTarget, setReconnectTarget] = useState<{ app: AivoryApp; connId: string } | null>(null)
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingConns, setLoadingConns] = useState(true)
  const t = useTranslations("integrations")
  const tCommon = useTranslations("common")

  const { pendingContext, clearPendingContext } = useRouterContext()
  const [routingNotice, setRoutingNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingContext) return
    if (Date.now() - pendingContext.timestamp > 300000) { clearPendingContext(); return }
    if (pendingContext.targetRoute !== 'integrations') return
    setRoutingNotice(pendingContext.aiReplySummary || pendingContext.triggerMessage)
    clearPendingContext()
  }, [pendingContext, clearPendingContext])

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/apps')
      if (res.ok) setApps(await res.json())
    } finally {
      setLoadingApps(false)
    }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/connections')
      if (res.ok) setConnections(await res.json())
    } finally {
      setLoadingConns(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
    fetchConnections()
  }, [fetchApps, fetchConnections])

  const handleRevoke = async (id: string, displayName: string) => {
    if (!confirm(`Revoke "${displayName}"? Workflows using this connection will stop working.`)) return
    await fetch(`/api/integrations/connections/${id}`, { method: 'DELETE' })
    fetchConnections()
  }

  const handleReconnect = (conn: AivoryConnection) => {
    const app = apps.find(a => a.id === conn.appId)
    if (app) setReconnectTarget({ app, connId: conn.id })
  }

  const connectedAppIds = new Set(
    connections.filter(c => c.status === 'connected').map(c => c.appId)
  )

  return (
    <div className={styles.page}>
      {routingNotice !== null && (
        <ContinuedFromConsole summary={routingNotice} onDismiss={() => setRoutingNotice(null)} />
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("description")}</p>
      </div>

      {/* ── Your Connections ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t("connected")}</p>
        {loadingConns ? (
          <p className={styles.emptyMsg}>{tCommon("loading")}...</p>
        ) : connections.length === 0 ? (
          <p className={styles.emptyMsg}>{t("noIntegrations")}</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>{t("app")}</span>
              <span>{t("name")}</span>
              <span>{t("status")}</span>
              <span>{t("lastUsed")}</span>
              <span>{t("actions")}</span>
            </div>
            {connections.map(conn => {
              const app = apps.find(a => a.id === conn.appId)
              return (
                <div key={conn.id} className={styles.tableRow}>
                  <span className={styles.tableAppCell}>
                    {app?.iconPath ? (
                      <img src={app.iconPath} alt="" className={styles.tableAppIcon} data-brand={app.id.toLowerCase()} style={{ width: 20, height: 20 }} />
                    ) : (
                      <span className={styles.tableAppIcon}>{conn.appIcon}</span>
                    )}
                    <span className={styles.tableAppName}>{conn.appName}</span>
                  </span>
                  <span className={styles.tableDisplayName}>{conn.displayName}</span>
                  <span><StatusBadge status={conn.status} /></span>
                  <span className={styles.tableLastUsed}>{relativeTime(conn.lastUsedAt)}</span>
                  <span className={styles.tableActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleReconnect(conn)}
                      title={t("reconnect")}
                    >
                      {t("reconnect")}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleRevoke(conn.id, conn.displayName)}
                      title={t("revoke")}
                    >
                      {t("revoke")}
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Available Apps ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t("available")}</p>
        {loadingApps ? (
          <p className={styles.emptyMsg}>{tCommon("loading")}...</p>
        ) : (
          <div className={styles.appGrid}>
            {apps.map(app => (
              <div key={app.id} className={styles.appCard}>
                <div className={styles.appCardTop}>
                  {app.iconPath ? (
                    <img src={app.iconPath} alt="" className={styles.appIcon} data-brand={app.id.toLowerCase()} style={{ width: 32, height: 32 }} />
                  ) : (
                    <div className={styles.appIcon}>{app.icon}</div>
                  )}
                  <div>
                    <p className={styles.appName}>{app.name}</p>
                    {app.categories.length > 0 && (
                      <p className={styles.appCategory}>{app.categories[0]}</p>
                    )}
                  </div>
                </div>
                <p className={styles.appDesc}>{app.description}</p>
                <button
                  className={styles.connectBtn}
                  onClick={() => setConnectingApp(app)}
                >
                  {connectedAppIds.has(app.id) ? t("addAnother") : t("connect")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {connectingApp && (
        <ConnectModal
          app={connectingApp}
          onClose={() => setConnectingApp(null)}
          onSaved={fetchConnections}
        />
      )}
      {reconnectTarget && (
        <ConnectModal
          app={reconnectTarget.app}
          existingId={reconnectTarget.connId}
          onClose={() => setReconnectTarget(null)}
          onSaved={fetchConnections}
        />
      )}
    </div>
  )
}
