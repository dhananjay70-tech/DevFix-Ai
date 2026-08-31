import React, { useState } from 'react'
import { FolderIcon, SearchIcon } from '../Icons'

export default function RepoExplorerModal({ isOpen, onClose, repositoryFullName, affectedFiles = [] }) {
  const [selectedFile, setSelectedFile] = useState(affectedFiles[0] || 'src/index.js')
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const sampleTree = [
    'src/index.js',
    'src/app.js',
    'src/controllers/authController.js',
    'src/services/userService.js',
    'src/routes/api.js',
    'src/utils/helpers.js',
    'tests/suite.test.js',
    'package.json',
    'README.md'
  ]

  const allFiles = Array.from(new Set([...affectedFiles, ...sampleTree]))
  const filtered = allFiles.filter(f => f.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderIcon className="w-4 h-4 text-blue-400" />
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Repository File Explorer • {repositoryFullName}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, minHeight: '350px', overflow: 'hidden' }}>
          {/* Left file tree */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '12px', overflowY: 'auto' }}>
            <div className="search-bar" style={{ marginBottom: '10px', padding: '4px 8px' }}>
              <SearchIcon className="search-icon w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Filter files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map((file) => {
                const isAffected = affectedFiles.includes(file)
                const isSelected = selectedFile === file

                return (
                  <div
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--accent-indigo)' : isAffected ? '#fbbf24' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{file}</span>
                    {isAffected && (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 4px', borderRadius: '3px' }}>
                        DEFECT
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right file preview */}
          <div style={{ padding: '16px', overflowY: 'auto', backgroundColor: '#07090e' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              // {selectedFile}
            </div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {`// Inspecting source file from repository sandbox
// File: ${selectedFile}

import { config } from '../config/env.js';

export const handleExecution = async (req, res) => {
  try {
    const payload = req.body;
    // Parameter validation and defensive safety bounds
    if (!payload) {
      return res.status(400).json({ error: 'Missing required payload' });
    }
    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
