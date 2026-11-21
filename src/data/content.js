// ─────────────────────────────────────────────────────────────
//  ALL SITE CONTENT LIVES HERE.
//  Edit this file to update your name, projects and resume.
//  Anything marked TODO is placeholder text.
// ─────────────────────────────────────────────────────────────

const GITHUB_USER = 'jagjotsingh244-source'

export const profile = {
  name: 'Jagjot Singh',
  role: 'AI & Software Engineer', // TODO
  location: 'Your City, Country', // TODO
  email: 'you@example.com', // TODO
  github: `https://github.com/${GITHUB_USER}`,
  linkedin: 'https://www.linkedin.com/in/your-profile', // TODO
  // Put your resume PDF in the /public folder as resume.pdf, then set this to 'resume.pdf'
  resumePdf: '', // TODO
}

export const about = [
  "Hi, I'm Jagjot 👋",
  'I build things with code — from small language models to the systems that keep them running.', // TODO
  'This little room is my corner of the internet. Open the Projects folder to see what I have been working on, or the Resume to see where I have been.',
  'Tip: drag windows around, press Esc to step back from the desk.',
]

// Each project is a folder on the desktop. Clicking it opens `github` in a new tab.
export const projects = [
  {
    name: 'customer-support-SLM',
    description:
      'A small language model fine-tuned to answer customer support questions. TODO: describe the dataset, model and results.',
    tech: ['Python', 'PyTorch', 'Hugging Face'], // TODO
    github: `https://github.com/${GITHUB_USER}/customer-support-SLM`,
    demo: '', // TODO: add a Hugging Face Spaces link when it is live
    color: '#6c8cff',
  },
  {
    name: 'project-two',
    description: 'TODO: short description of your second project.',
    tech: ['TODO'],
    github: `https://github.com/${GITHUB_USER}`,
    demo: '',
    color: '#ff8a65',
  },
  {
    name: 'project-three',
    description: 'TODO: short description of your third project.',
    tech: ['TODO'],
    github: `https://github.com/${GITHUB_USER}`,
    demo: '',
    color: '#4dd0a1',
  },
]

export const resume = {
  summary:
    'TODO: two or three lines about who you are, what you are good at and what you are looking for.',
  experience: [
    {
      title: 'TODO Job Title',
      org: 'TODO Company',
      period: '2024 — Present',
      points: ['TODO: what you built or improved, with a number if possible.', 'TODO: another achievement.'],
    },
    {
      title: 'TODO Job Title',
      org: 'TODO Company',
      period: '2022 — 2024',
      points: ['TODO: what you built or improved.'],
    },
  ],
  education: [{ degree: 'TODO Degree', school: 'TODO University', period: '2018 — 2022' }],
  skills: ['Python', 'Machine Learning', 'LLMs', 'SRE / DevOps', 'Data Structures & Algorithms'], // TODO
}

// Labels on the spines of the book stacks on the desk (up to 11).
export const bookSpines = [
  'Python',
  'PyTorch',
  'Hugging Face',
  'LLMs',
  'SRE',
  'Kubernetes',
  'Docker',
  'DSA',
  'Machine Learning',
  'SQL',
  'Linux',
]
