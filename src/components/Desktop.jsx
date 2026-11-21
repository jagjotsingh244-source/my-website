import { useEffect, useRef, useState } from 'react'
import { profile, about, projects, resume } from '../data/content'
import { FolderIcon, DocIcon, NoteIcon, MailIcon, GithubIcon } from './Icons'

const APPS = {
  about: { title: 'About me.txt', w: 460, h: 340 },
  projects: { title: 'Projects', w: 680, h: 440 },
  resume: { title: 'Resume.pdf', w: 640, h: 560 },
  contact: { title: 'Contact', w: 420, h: 300 },
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function Window({ id, z, onFocus, onClose, children, index }) {
  const app = APPS[id]
  const [pos, setPos] = useState(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      x: Math.max(136, Math.min(vw - app.w - 16, vw / 2 - app.w / 2 + 40 + (index - 1) * 36)),
      y: Math.max(44, Math.min(vh - app.h - 16, vh / 2 - app.h / 2 + (index - 1) * 30)),
    }
  })
  const drag = useRef(null)

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    onFocus()
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setPos({
      x: Math.min(window.innerWidth - 80, Math.max(-app.w + 80, e.clientX - drag.current.dx)),
      y: Math.min(window.innerHeight - 40, Math.max(32, e.clientY - drag.current.dy)),
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

function AboutApp() {
  return (
    <div className="about">
      {about.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}

function ProjectsApp() {
  const [hover, setHover] = useState(projects[0])
  return (
    <div className="projects">
      <div className="path">~/Desktop/Projects</div>
      <div className="projects-main">
        <div className="file-grid">
          {projects.map((p) => (
            <a
              key={p.name}
              className="file"
              href={p.github}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHover(p)}
              onFocus={() => setHover(p)}
              title={`Open ${p.name} on GitHub`}
            >
              <FolderIcon color={p.color} />
              <span>{p.name}</span>
            </a>
          ))}
        </div>
        {hover && (
          <aside className="preview">
            <FolderIcon color={hover.color} size={48} />
            <h3>{hover.name}</h3>
            <p>{hover.description}</p>
            <div className="tags">
              {hover.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="preview-actions">
              <a className="btn" href={hover.github} target="_blank" rel="noopener noreferrer">
                View on GitHub ↗
              </a>
              {hover.demo && (
                <a className="btn ghost" href={hover.demo} target="_blank" rel="noopener noreferrer">
                  Live demo ↗
                </a>
              )}
            </div>
          </aside>
        )}
      </div>
      <div className="statusbar">{projects.length} items — click a folder to open it on GitHub</div>
    </div>
  )
}

function ResumeApp() {
  return (
    <div className="resume">
      <header>
        <div>
          <h2>{profile.name}</h2>
          <p className="muted">
            {profile.role} · {profile.location}
          </p>
        </div>
        {profile.resumePdf ? (
          <a className="btn" href={profile.resumePdf} download>
            Download PDF
          </a>
        ) : (
          <span className="btn disabled" title="Add resume.pdf to /public and set resumePdf in content.js">
            PDF coming soon
          </span>
        )}
      </header>
      <p>{resume.summary}</p>
      <h4>Experience</h4>
      {resume.experience.map((job, i) => (
        <div className="entry" key={i}>
          <div className="entry-head">
            <strong>{job.title}</strong> — {job.org}
            <span className="muted">{job.period}</span>
          </div>
          <ul>
            {job.points.map((pt, j) => (
              <li key={j}>{pt}</li>
            ))}
          </ul>
        </div>
      ))}
      <h4>Education</h4>
      {resume.education.map((ed, i) => (
        <div className="entry-head" key={i}>
          <strong>{ed.degree}</strong> — {ed.school}
          <span className="muted">{ed.period}</span>
        </div>
      ))}
      <h4>Skills</h4>
      <div className="tags">
        {resume.skills.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function ContactApp() {
  const links = [
    { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
    { label: 'GitHub', value: profile.github.replace('https://', ''), href: profile.github },
    { label: 'LinkedIn', value: profile.linkedin.replace('https://www.', ''), href: profile.linkedin },
  ]
  return (
    <div className="contact">
      <p className="muted">Say hi — I usually reply within a day.</p>
      {links.map((l) => (
        <a key={l.label} className="contact-row" href={l.href} target="_blank" rel="noopener noreferrer">
          <span>{l.label}</span>
          <span className="muted">{l.value} ↗</span>
        </a>
      ))}
    </div>
  )
}

const CONTENT = { about: AboutApp, projects: ProjectsApp, resume: ResumeApp, contact: ContactApp }

export default function Desktop({ visible, onExit, sound, onToggleSound }) {
  // id -> stacking order; an id being present means its window is open
  const [stack, setStack] = useState({ about: 1 })
  const top = useRef(1)
  const now = useClock()

  const openApp = (id) =>
    setStack((m) => {
      if (m[id] === top.current) return m
      top.current += 1
      return { ...m, [id]: top.current }
    })
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

  const icons = [
    { id: 'projects', label: 'Projects', icon: <FolderIcon color="#6c8cff" /> },
    { id: 'resume', label: 'Resume.pdf', icon: <DocIcon /> },
    { id: 'about', label: 'About me.txt', icon: <NoteIcon /> },
    { id: 'contact', label: 'Contact', icon: <MailIcon /> },
  ]

  return (
    <div className={`desktop ${visible ? 'show' : ''}`} aria-hidden={!visible}>
      <div className="menubar">
        <span className="menubar-name">◆ {profile.name}</span>
        <div className="menubar-right">
          <button onClick={onToggleSound} aria-label="Toggle rain sound">
            {sound ? '🔊 Rain' : '🔈 Rain'}
          </button>
          <span>
            {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button className="exit" onClick={onExit}>
            ⏻ Leave desk
          </button>
        </div>
      </div>

      <div className="icons">
        {icons.map((ic) => (
          <button key={ic.id} className="icon" onClick={() => openApp(ic.id)}>
            {ic.icon}
            <span>{ic.label}</span>
          </button>
        ))}
        <a className="icon" href={profile.github} target="_blank" rel="noopener noreferrer">
          <GithubIcon />
          <span>GitHub</span>
        </a>
      </div>

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
