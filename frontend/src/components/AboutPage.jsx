const STEPS = [
  {
    number: '01',
    title: 'Upload your content',
    description: 'Add music theory PDFs, MusicXML sheet music, or audio recordings through the Upload tab. Files are stored securely on Cloudinary.',
  },
  {
    number: '02',
    title: 'Content gets indexed',
    description: 'Documents are split into chunks, converted into semantic embeddings using Hugging Face, and stored in a vector database (Neon + pgvector).',
  },
  {
    number: '03',
    title: 'Ask a question',
    description: 'Type any music theory question in the Chat tab. The system retrieves the most relevant passages using hybrid semantic + full-text search.',
  },
  {
    number: '04',
    title: 'Get a cited answer',
    description: 'Groq\'s LLaMA 3.3 70B model generates a precise, grounded answer with inline citations — no hallucinated facts, no guessing.',
  },
]


const FEATURES = [
  {
    icon: '🎵',
    title: 'Sheet Music Analysis',
    description: 'Upload a MusicXML or MIDI file and instantly extract the key signature, time signature, chord progression, tempo, and suggested theory topics.',
  },
  {
    icon: '📖',
    title: 'RAG-Powered Chat',
    description: 'Answers are grounded in your uploaded knowledge base using Retrieval-Augmented Generation — not generic internet data.',
  },
  {
    icon: '🎼',
    title: 'Score Viewer',
    description: 'Uploaded sheet music is rendered live in the browser using OpenSheetMusicDisplay, with a full analysis sidebar alongside it.',
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    description: 'Admins manage the knowledge base — uploading documents, browsing the library, and analysing audio. Regular users focus on learning through chat.',
  },
  {
    icon: '💬',
    title: 'Conversation History',
    description: 'Every chat session is saved and organised by conversation so you can pick up where you left off at any time.',
  },
  {
    icon: '🎤',
    title: 'Audio Analysis',
    description: 'Upload MP3, WAV, M4A, or FLAC recordings for AI-powered audio analysis alongside your other music resources.',
  },
]

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-16">

      {/* Hero */}
      <div
        className="rounded-2xl p-10 md:p-14 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #124170 0%, #215B63 60%, #124170 100%)' }}
      >
        <div className="absolute top-6 right-10 text-7xl opacity-10 select-none">🎼</div>
        <div className="absolute bottom-4 left-8 text-5xl opacity-10 select-none rotate-12">♫</div>
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#AAFFC7' }}>
            About MusicScholar
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            AI-powered music education,<br />grounded in your own resources
          </h1>
          <p className="text-base leading-relaxed opacity-85" style={{ color: '#AAFFC7' }}>
            MusicScholar is a Retrieval-Augmented Generation (RAG) platform built for musicians, students,
            and educators. Upload your textbooks, sheet music, and recordings — then have a real conversation
            with that content. Every answer is cited back to the source.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-bold mb-8" style={{ color: '#124170' }}>How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(step => (
            <div key={step.number} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
              <span
                className="text-2xl font-extrabold"
                style={{ color: '#67C090' }}
              >
                {step.number}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold mb-8" style={{ color: '#124170' }}>Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: '#AAFFC722' }}
              >
                {f.icon}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

{/* Links */}
      <div className="flex flex-wrap gap-4">
        <a
          href="https://music-scholar.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #124170, #215B63)' }}
        >
          Live Demo →
        </a>
      </div>

    </div>
  )
}
