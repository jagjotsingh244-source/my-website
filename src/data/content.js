// ─────────────────────────────────────────────────────────────
//  ALL SITE CONTENT LIVES HERE.
//  Edit this file to update your name, projects and resume.
//  Anything marked TODO is placeholder text.
// ─────────────────────────────────────────────────────────────

const GITHUB_USER = 'jagjotsingh244-source'

export const profile = {
  name: 'Jagjot Singh',
  role: 'Forward Deployed AI Engineer',
  location: '', // TODO: e.g. 'Chandigarh, India' (hidden while empty)
  email: 'jagjotsingh244@gmail.com',
  github: `https://github.com/${GITHUB_USER}`,
  githubHandle: GITHUB_USER,
  linkedin: 'https://www.linkedin.com/in/jagjotsingh0/',
  linkedinHandle: 'jagjotsingh0',
  // Put your resume PDF in the /public folder as resume.pdf, then set this to 'resume.pdf'
  resumePdf: '',
}

// Small welcome card shown when someone sits down at the desk.
export const welcome = {
  greeting: "Hi, I'm Jagjot 👋",
  line: 'I build LLM systems end to end, from fine-tuning small models to serving them reliably in production.',
  hint: 'Open a folder to explore',
}

// Project cards. Clicking a card opens `github` in a new tab.
export const projects = [
  {
    name: 'Nova: customer-support SLM',
    repo: 'customer-support-SLM',
    status: 'In progress',
    description:
      'A customer-support assistant built on Qwen3.5-2B for a demo online store. Policies come from RAG, order data from tool calls, tone and escalation from LoRA fine-tuning, and hard rules (who can see which order, return eligibility) are enforced in code.',
    highlights: ['Served with vLLM at ~50 tok/s on a T4', 'Target: 3 s p95 reply with a tool call'],
    tech: ['Qwen3.5-2B', 'LoRA · Unsloth', 'vLLM', 'RAG · pgvector', 'PostgreSQL', 'Tool calling'],
    github: `https://github.com/${GITHUB_USER}/customer-support-SLM`,
    demo: '', // add a live demo link when there is one
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
  // from the tools used in customer-support-SLM; edit freely
  skills: ['Python', 'LLM fine-tuning (LoRA)', 'RAG', 'vLLM', 'PostgreSQL · pgvector', 'Docker', 'Evals', 'SQL'],
}
