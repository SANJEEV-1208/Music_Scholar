import { useState, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

const FILE_TYPES = [
  {
    id: 'pdf',
    icon: '📄',
    label: 'PDF / Text',
    desc: 'Music theory books & articles',
    accept: '.pdf',
  },
  {
    id: 'sheet-music',
    icon: '🎵',
    label: 'Sheet Music',
    desc: 'MusicXML or MIDI files',
    accept: '.xml,.musicxml,.mxl,.mid,.midi',
  },
  {
    id: 'audio',
    icon: '🎤',
    label: 'Audio Recording',
    desc: 'MP3, WAV, M4A, FLAC',
    accept: '.mp3,.wav,.m4a,.ogg,.flac',
  },
]

export default function FileUpload({ onMusicUploaded, onAudioUploaded, onDocumentAdded }) {
  const { token } = useAuth()
  const [fileType, setFileType] = useState('pdf')
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  const selectedType = FILE_TYPES.find(t => t.id === fileType)

  async function handleUpload(file) {
    if (!file) return
    setStatus('uploading')
    setProgress(0)
    setResult(null)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)
    const endpoint =
      fileType === 'pdf' ? '/api/upload/pdf'
      : fileType === 'sheet-music' ? '/api/upload/sheet-music'
      : '/api/upload/audio'

    try {
      const { data } = await axios.post(`${API}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      })
      setStatus('success')
      setResult(data)
      onDocumentAdded?.(data)
      if (data.analysis && fileType === 'sheet-music') {
        onMusicUploaded?.(data.analysis, data.xmlContent)
      }
      if (data.analysis && fileType === 'audio') {
        onAudioUploaded?.(data.analysis, data.title)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.response?.data?.error || 'Upload failed')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Upload Document</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add PDFs, sheet music, or audio recordings to your knowledge base
        </p>
      </div>

      {/* File type selector cards */}
      <div className="grid grid-cols-3 gap-3">
        {FILE_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => { setFileType(type.id); setStatus(null) }}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center cursor-pointer ${
              fileType === type.id
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-3xl">{type.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${fileType === type.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                {type.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <div className="text-5xl mb-3">{selectedType.icon}</div>
        <p className="text-gray-700 font-semibold">Drop your {selectedType.label} here</p>
        <p className="text-gray-400 text-sm mt-1">or click to browse files</p>
        {fileType === 'audio' && (
          <p className="text-xs text-indigo-400 mt-3 bg-indigo-50 rounded-lg px-4 py-2 inline-block">
            Best results with clear, single-instrument recordings
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={selectedType.accept}
          onChange={e => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Uploading state */}
      {status === 'uploading' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Processing your file…</p>
              <p className="text-xs text-gray-400">Uploading and indexing for search</p>
            </div>
            <span className="text-sm font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Upload Successful!</p>
              <p className="text-emerald-700 text-xs mt-0.5">{result.title}</p>
              <p className="text-emerald-600 text-xs">{result.chunksCreated} chunks indexed and ready for search</p>
              {result.analysis && fileType === 'sheet-music' && (
                <p className="text-emerald-500 text-xs mt-1.5">🎵 Sheet music analyzed — see the Sheet Music tab</p>
              )}
              {result.analysis && fileType === 'audio' && (
                <p className="text-emerald-500 text-xs mt-1.5">🎤 Audio analyzed — see the Audio tab</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg flex-shrink-0">
              ✕
            </div>
            <div>
              <p className="text-red-800 font-semibold text-sm">Upload Failed</p>
              <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
