import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql',
  'mongodb', 'html', 'css', 'git', 'docker', 'aws', 'c++', 'angular',
  'vue', 'spring', 'express', 'firebase', 'figma', 'tailwind',
]

const EXPERIENCE_KEYWORDS = [
  'project', 'experience', 'internship', 'worked', 'developed',
  'built', 'led', 'managed', 'implemented',
]

const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'degree', 'university', 'college', 'b.tech',
  'b.e', 'm.tech', 'diploma', 'school', 'cgpa', 'gpa',
]

const STRUCTURE_KEYWORDS = [
  'summary', 'objective', 'skill', 'education', 'certification',
]

export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    text += pageText + '\n'
  }

  return text.trim()
}

function findMatches(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.filter((word) => lower.includes(word))
}

export function analyzeResume(text) {
  const lower = text.toLowerCase()
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text)
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text)

  const skills = findMatches(text, SKILL_KEYWORDS)
  const experience = findMatches(text, EXPERIENCE_KEYWORDS)
  const education = findMatches(text, EDUCATION_KEYWORDS)
  const structure = findMatches(text, STRUCTURE_KEYWORDS)

  const wordCount = text.split(/\s+/).filter(Boolean).length

  const breakdown = {
    contact: (hasEmail ? 10 : 0) + (hasPhone ? 5 : 0),
    skills: Math.min(skills.length * 5, 25),
    experience: Math.min(experience.length * 4, 25),
    education: Math.min(education.length * 4, 20),
    structure: Math.min(structure.length * 3, 15) + (wordCount >= 150 ? 5 : wordCount >= 80 ? 3 : 0),
  }

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  const suggestions = []
  if (!hasEmail) suggestions.push('Add a professional email address.')
  if (!hasPhone) suggestions.push('Include a phone number for recruiters.')
  if (skills.length < 3) suggestions.push('List more technical skills (React, Java, SQL, etc.).')
  if (experience.length < 2) suggestions.push('Add project or work experience details.')
  if (education.length < 1) suggestions.push('Mention your education (degree, college, CGPA).')
  if (!lower.includes('summary') && !lower.includes('objective')) {
    suggestions.push('Add a short summary or career objective at the top.')
  }
  if (wordCount < 80) suggestions.push('Resume looks too short — add more detail.')
  if (wordCount > 900) suggestions.push('Resume may be too long — keep it under 2 pages.')

  let grade = 'Needs Work'
  if (score >= 80) grade = 'Excellent'
  else if (score >= 60) grade = 'Good'
  else if (score >= 40) grade = 'Average'

  return {
    score,
    grade,
    breakdown,
    skills,
    experience,
    education,
    structure,
    hasEmail,
    hasPhone,
    wordCount,
    suggestions,
  }
}
