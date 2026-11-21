import { useEffect, useRef, useState } from 'react'
import { profile, welcome, projects, resume } from '../data/content'
import { FolderIcon, MailGlyph, LinkedInGlyph, GithubGlyph } from './Icons'

const APPS = {
  resume: { title: 'Resume', w: 560, h: 470 },
  projects: { title: 'Projects', w: 600, h: 420 },
  contact: { title: 'Contact me', w: 420, h: 330 },
}

const FOLDERS = [
  { id: 'resume', label: 'Resume', glyph: 'doc' },
  { id: 'projects', label: 'Projects', glyph: 'code' },
  { id: 'contact', label: 'Contact me', glyph: 'mail' },
]

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// bounds: size of the desktop in CSS px. getScale: on-screen px per CSS px
// (the desktop is scaled when it is shown on the iMac).
function Window({ id, z, onFocus, onClose, children, index, bounds, getScale }) {
  const app = APPS[id]
  const [pos, setPos] = useState(() => ({
    x: Math.max(132, Math.min(bounds.w - app.w - 16, bounds.w / 2 - app.w / 2 + 40 + index * 26)),
    y: Math.max(46, Math.min(bounds.h - app.h - 14, bounds.h / 2 - app.h / 2 + 12 + index * 18)),
  }))
  const drag = useRef(null)

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    onFocus()
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y, k: getScale() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    setPos({
      x: Math.min(bounds.w - 80, Math.max(-app.w + 80, d.px + (e.clientX - d.sx) / d.k)),
      y: Math.min(bounds.h - 40, Math.max(34, d.py + (e.clientY - d.sy) / d.k)),
    })
  }
  const onPointerUp = () => (drag.current = null)

  return (
    <div
      className="window"
      style={{ left: pos.x, top: pos.y, width: app.w, height: app.h, zIndex: z }}
      onPointerDown={onFocus}
      role="dialog"
      aria-label={app.title}
    >
      <div className="titlebar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="lights">
          <button className="light close" onClick={onClose} aria-label={`Close ${app.title}`} />
          <span className="light min" />
          <span className="light max" />
        </div>
        <span className="title">{app.title}</span>
      </div>
      <div className="window-body">{children}</div>
    </div>
  )
}

function Welcome({ onClose, onOpen }) {
  return (
    <div className="welcome" role="note">
      <button className="welcome-close" onClick={onClose} aria-label="Close welcome note">
        ×
      </button>
      <h2>{welcome.greeting}</h2>
      <div className="welcome-role">{profile.role}</div>
      <p>{welcome.line}</p>
      <div className="welcome-actions">
        <span className="muted">{welcome.hint}</span>
        <button className="chip-btn" onClick={() => onOpen('projects')}>
          Projects →
        </button>
      </div>
    </div>
  )
}

function ResumeApp() {
  return (
    <div className="resume">
      <header className="resume-head">
        <div>
          <h2>{profile.name}</h2>
          <div className="resume-role">{profile.role}</div>
          <div className="resume-links">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <span>·</span>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <span>·</span>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            {profile.location && (
              <>
                <span>·</span>
                <span>{profile.location}</span>
              </>
            )}
          </div>
        </div>
        {profile.resumePdf && (
          <a className="btn" href={`${import.meta.env.BASE_URL}${profile.resumePdf}`} download>
            Download PDF
          </a>
        )}
      </header>

      <section>
        <h4>Summary</h4>
        <p>{resume.summary}</p>
      </section>

      <section>
        <h4>Experience</h4>
        <ol className="timeline">
          {resume.experience.map((job, i) => (
            <li key={i}>
              <div className="tl-head">
                <strong>{job.title}</strong>
                <span className="muted">{job.period}</span>
              </div>
              <div className="tl-org">{job.org}</div>
              <ul>
                {job.points.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h4>Education</h4>
        {resume.education.map((ed, i) => (
          <div className="tl-head" key={i}>
            <span>
              <strong>{ed.degree}</strong> · {ed.school}
            </span>
            <span className="muted">{ed.period}</span>
          </div>
        ))}
      </section>

      <section>
        <h4>Skills</h4>
        <div className="tags">
          {resume.skills.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </section>
    </div>
  )
}

function ProjectsApp() {
  return (
    <div className="projects">
      <div className="cards">
        {projects.map((p) => (
          <a key={p.repo} className="card" href={p.github} target="_blank" rel="noopener noreferrer">
            <div className="card-top">
              <span className="card-repo">
                <GithubGlyph /> {profile.githubHandle}/{p.repo}
              </span>
              {p.status && <span className="pill">{p.status}</span>}
            </div>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            {p.highlights?.length > 0 && (
              <ul className="card-highlights">
                {p.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <div className="tags">
              {p.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="card-foot">
              View on GitHub <span aria-hidden="true">↗</span>
            </div>
          </a>
        ))}
      </div>
      <div className="more-soon muted">More projects coming soon.</div>
    </div>
  )
}

function ContactApp() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }
  return (
    <div className="contact">
      <p className="contact-intro">Happy to talk about AI roles, projects, or anything you saw here.</p>
      <div className="contact-row">
        <a href={`mailto:${profile.email}`} className="contact-main">
          <span className="contact-icon">
            <MailGlyph />
          </span>
          <span>
            <span className="contact-label">Email</span>
            <span className="contact-value">{profile.email}</span>
          </span>
        </a>
        <button className="chip-btn" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <a className="contact-row contact-main" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
        <span className="contact-icon">
          <LinkedInGlyph />
        </span>
        <span>
          <span className="contact-label">LinkedIn</span>
          <span className="contact-value">in/{profile.linkedinHandle}</span>
        </span>
        <span className="contact-arrow">↗</span>
      </a>
      <a className="contact-row contact-main" href={profile.github} target="_blank" rel="noopener noreferrer">
        <span className="contact-icon">
          <GithubGlyph />
        </span>
        <span>
          <span className="contact-label">GitHub</span>
          <span className="contact-value">{profile.githubHandle}</span>
        </span>
        <span className="contact-arrow">↗</span>
      </a>
    </div>
  )
}

const CONTENT = { resume: ResumeApp, projects: ProjectsApp, contact: ContactApp }

// Keep clicks on the on-screen desktop from also reaching the room behind it
// (which would treat them as "clicked outside the iMac" and zoom out).
const stop = (e) => e.stopPropagation()
const stopToScene = { onClick: stop, onPointerDown: stop, onPointerUp: stop, onPointerMove: stop, onWheel: stop }

// embedded = shown on the iMac at a fixed 1024x576 size;
// otherwise it covers the whole browser window (phones, simple view).
export default function Desktop({ visible, onExit, embedded = false }) {
  const root = useRef(null)
  const bounds = embedded ? { w: 1024, h: 576 } : { w: window.innerWidth, h: window.innerHeight }
  const getScale = () => (root.current ? root.current.getBoundingClientRect().width / root.current.offsetWidth || 1 : 1)
  // id -> stacking order; an id being present means its window is open
  const [stack, setStack] = useState({})
  const [showWelcome, setShowWelcome] = useState(true)
  const top = useRef(0)
  const now = useClock()

  const openApp = (id) => {
    setShowWelcome(false)
    setStack((m) => {
      if (m[id] === top.current) return m
      top.current += 1
      return { ...m, [id]: top.current }
    })
  }
  const closeApp = (id) =>
    setStack((m) => {
      const next = { ...m }
      delete next[id]
      return next
    })

  useEffect(() => {
    if (!visible) return
    const onKey = (e) => e.key === 'Escape' && onExit()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onExit])

  return (
    <div
      ref={root}
      className={`desktop ${embedded ? 'embedded' : ''} ${visible ? 'show' : ''}`}
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}scene/wallpaper.jpg)` }}
      aria-hidden={!visible}
      {...(embedded ? stopToScene : {})}
    >
      <div className="menubar">
        <span className="menubar-name">
          <span className="menubar-mark">◆</span> {profile.name}
        </span>
        <div className="menubar-right">
          <span className="menubar-clock">
            {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
            <span className="menubar-time">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
          <button className="exit" onClick={onExit}>
            Leave desk
          </button>
        </div>
      </div>

      <div className="icons">
        {FOLDERS.map((f) => (
          <button key={f.id} className={`icon ${f.id in stack ? 'open' : ''}`} onClick={() => openApp(f.id)}>
            <FolderIcon glyph={f.glyph} />
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {showWelcome && Object.keys(stack).length === 0 && (
        <Welcome onClose={() => setShowWelcome(false)} onOpen={openApp} />
      )}

      {Object.keys(APPS)
        .filter((id) => id in stack)
        .map((id) => {
          const Content = CONTENT[id]
          const index = Object.keys(APPS).indexOf(id)
          return (
            <Window
              key={id}
              id={id}
              index={index}
              bounds={bounds}
              getScale={getScale}
              z={10 + stack[id]}
              onFocus={() => openApp(id)}
              onClose={() => closeApp(id)}
            >
              <Content />
            </Window>
          )
        })}
    </div>
  )
}
