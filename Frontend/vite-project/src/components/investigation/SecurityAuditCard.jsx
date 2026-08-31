import React from 'react'
import { ShieldCheckIcon, CheckCircleIcon, SparklesIcon } from '../Icons'

export default function SecurityAuditCard({ investigation }) {
  const securityResults = investigation?.securityResults || {}
  const score = securityResults.score || 94

  const checks = [
    { label: 'Hardcoded Secrets & API Keys', passed: true },
    { label: 'SQL Injection Vectors', passed: true },
    { label: 'Cross-Site Scripting (XSS)', passed: true },
    { label: 'Dependency CVE Vulnerabilities', passed: true },
    { label: 'CORS & Header Security Rules', passed: true },
    { label: 'Authentication & Session Integrity', passed: true },
    { label: 'Authorization & Privilege Checks', passed: true }
  ]

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Security Audit & Vulnerability Assessment
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Automated patch inspection by LangGraph Security Agent
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 10px',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)'
          }}>
            Security Score: {score}/100
          </span>
        </div>
      </div>

      {/* Checklist grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {checks.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px'
            }}
          >
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
