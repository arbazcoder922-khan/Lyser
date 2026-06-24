import { useRef, useState } from 'react'
import { analyzeResume, extractTextFromPdf } from './Lyser'
import './App.css'

const BREAKDOWN_LABELS = {
  contact: 'Contact Info',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  structure: 'Structure',
}

function App() {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const processFile = async (file) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.')
      return
    }

    setLoading(true)
    setError('')
    setFileName(file.name)

    try {
      const text = await extractTextFromPdf(file)
      if (!text) {
        setError('Could not read text from this PDF. Try a text-based resume.')
        setResumeText('')
        setAnalysis(null)
        return
      }

      setResumeText(text)
      setAnalysis(analyzeResume(text))
    } catch {
      setError('Failed to read PDF. Make sure the file is not corrupted.')
      setResumeText('')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  const reset = () => {
    setFileName('')
    setResumeText('')
    setAnalysis(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="app">
      <header className="header">
        <h1>AI Resume Analyzer</h1>
        <p>Upload your resume PDF and get an instant score with improvement tips.</p>
      </header>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !loading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          hidden
        />
        {loading ? (
          <p className="upload-text">Reading your resume...</p>
        ) : (
          <>
            <div className="upload-icon">PDF</div>
            <p className="upload-text">
              {fileName ? fileName : 'Click or drag & drop your resume PDF here'}
            </p>
            <span className="upload-hint">Only PDF files supported</span>
          </>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {analysis && (
        <>
          <section className="score-section">
            <div className="score-circle" data-grade={analysis.grade}>
              <span className="score-number">{analysis.score}</span>
              <span className="score-max">/ 100</span>
            </div>
            <div className="score-info">
              <h2>{analysis.grade}</h2>
              <p>{analysis.wordCount} words detected</p>
            </div>
          </section>

          <section className="breakdown">
            <h2>Score Breakdown</h2>
            <div className="breakdown-list">
              {Object.entries(analysis.breakdown).map(([key, value]) => {
                const max = key === 'contact' ? 15 : key === 'structure' ? 20 : key === 'education' ? 20 : 25
                return (
                  <div key={key} className="breakdown-item">
                    <div className="breakdown-header">
                      <span>{BREAKDOWN_LABELS[key]}</span>
                      <span>{value}/{max}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {analysis.skills.length > 0 && (
            <section className="tags-section">
              <h2>Skills Found</h2>
              <div className="tags">
                {analysis.skills.map((skill) => (
                  <span key={skill} className="tag tag-skill">{skill}</span>
                ))}
              </div>
            </section>
          )}

          <section className="tags-section">
            <h2>Contact Check</h2>
            <div className="tags">
              <span className={`tag ${analysis.hasEmail ? 'tag-ok' : 'tag-miss'}`}>
                {analysis.hasEmail ? 'Email found' : 'Email missing'}
              </span>
              <span className={`tag ${analysis.hasPhone ? 'tag-ok' : 'tag-miss'}`}>
                {analysis.hasPhone ? 'Phone found' : 'Phone missing'}
              </span>
            </div>
          </section>

          {analysis.suggestions.length > 0 && (
            <section className="suggestions">
              <h2>Suggestions to Improve</h2>
              <ul>
                {analysis.suggestions.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="preview">
            <h2>Extracted Text</h2>
            <textarea
              className="input"
              value={resumeText}
              
              readOnly
              rows={12}
            />
          </section>

          <button type="button" className="clear-btn" onClick={reset}>
            Upload another resume
          </button>
        </>
      )}
    </div>
  )
}

export default App
