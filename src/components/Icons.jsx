// Warm kraft-paper folders, each with a small mark on the front so they are easy to tell apart.
export function FolderIcon({ glyph = 'doc', size = 64 }) {
  const id = `fold-${glyph}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a35f" />
          <stop offset="1" stopColor="#b97c3c" />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6cf8e" />
          <stop offset="1" stopColor="#e0a65a" />
        </linearGradient>
      </defs>
      <path d="M6 15a4 4 0 0 1 4-4h13.5l5 5H54a4 4 0 0 1 4 4v4H6z" fill={`url(#${id}-back)`} />
      <rect x="6" y="21" width="52" height="34" rx="5" fill={`url(#${id}-front)`} />
      <rect x="6" y="21" width="52" height="3" rx="1.5" fill="#fff" opacity="0.35" />
      <g fill="none" stroke="#8a5523" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
        {glyph === 'doc' && (
          <>
            <path d="M26 30h9l4 4v12a1 1 0 0 1-1 1H26a1 1 0 0 1-1-1V31a1 1 0 0 1 1-1z" />
            <path d="M28.5 38h7M28.5 42h7" />
          </>
        )}
        {glyph === 'code' && (
          <>
            <path d="M27 33l-5 5 5 5" />
            <path d="M37 33l5 5-5 5" />
            <path d="M34 31l-4 14" />
          </>
        )}
        {glyph === 'mail' && (
          <>
            <rect x="22" y="31" width="20" height="14" rx="2" />
            <path d="M23 33l9 6.5 9-6.5" />
          </>
        )}
      </g>
    </svg>
  )
}

export function MailGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}

export function LinkedInGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM10 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.79-1.7-2.79-1.7 0-1.96 1.33-1.96 2.7V21H10z" />
    </svg>
  )
}

export function GithubGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  )
}
