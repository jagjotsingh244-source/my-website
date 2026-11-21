export function FolderIcon({ color = '#6c8cff', size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M6 14a4 4 0 0 1 4-4h14l5 5h25a4 4 0 0 1 4 4v4H6z" fill={color} opacity="0.75" />
      <rect x="6" y="20" width="52" height="34" rx="4" fill={color} />
      <rect x="6" y="20" width="52" height="6" rx="3" fill="#fff" opacity="0.18" />
    </svg>
  )
}

export function DocIcon({ size = 64, label = 'PDF', color = '#ff5a5f' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M16 6h22l12 12v38a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#f4f5f8" />
      <path d="M38 6v10a2 2 0 0 0 2 2h10z" fill="#cfd3dc" />
      <rect x="20" y="26" width="24" height="3" rx="1.5" fill="#c3c8d2" />
      <rect x="20" y="32" width="20" height="3" rx="1.5" fill="#c3c8d2" />
      <rect x="14" y="42" width="30" height="12" rx="3" fill={color} />
      <text x="29" y="51.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial">
        {label}
      </text>
    </svg>
  )
}

export function NoteIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="12" y="8" width="40" height="48" rx="4" fill="#ffe08a" />
      <rect x="12" y="8" width="40" height="10" rx="4" fill="#f5c542" />
      {[26, 33, 40, 47].map((y) => (
        <rect key={y} x="18" y={y} width={y === 47 ? 18 : 28} height="3" rx="1.5" fill="#c9a43a" />
      ))}
    </svg>
  )
}

export function MailIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="14" width="48" height="36" rx="6" fill="#4dd0a1" />
      <path d="M10 18l22 16 22-16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GithubIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#1b1f24" />
      <path
        transform="translate(14 14) scale(1.5)"
        fill="#fff"
        d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
      />
    </svg>
  )
}
