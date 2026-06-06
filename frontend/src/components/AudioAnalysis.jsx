function isMinorChord(chord) {
  return chord?.toLowerCase().includes('minor')
}

function isSharpOrFlat(note) {
  return note?.includes('#') || (note?.includes('b') && note?.length > 1)
}

export default function AudioAnalysis({ analysis, title }) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center text-4xl shadow-sm">
          🎵
        </div>
        <p className="text-lg font-semibold text-gray-500">No audio analyzed yet</p>
        <p className="text-sm text-gray-400">Upload an audio recording from the Upload tab</p>
      </div>
    )
  }

  const {
    detectedKey,
    tempo,
    duration,
    chordProgression = [],
    noteSequence = [],
    theoryTopics = [],
    beatCount,
  } = analysis

  const statCards = [
    { label: 'Key',      value: detectedKey,    icon: '🎼', gradient: 'from-indigo-500 to-violet-600' },
    { label: 'Tempo',    value: `${tempo} BPM`, icon: '♩',  gradient: 'from-violet-500 to-purple-600' },
    { label: 'Duration', value: duration,        icon: '⏱',  gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Beats',    value: beatCount,       icon: '🥁', gradient: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Audio Analysis</h2>
        {title && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span>🎤</span>
            <span>{title}</span>
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{card.label}</p>
            <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chord Progression */}
        {chordProgression.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">🎹</span>
              Chord Progression
            </h3>
            <div className="flex flex-wrap gap-2">
              {chordProgression.map((chord, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isMinorChord(chord)
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {chord}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-blue-200" /> major
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-purple-200" /> minor
              </span>
            </div>
          </div>
        )}

        {/* Note Sequence */}
        {noteSequence.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">🎶</span>
              Detected Melody
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {noteSequence.map((note, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold border ${
                    isSharpOrFlat(note)
                      ? 'bg-gray-800 text-white border-gray-700'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-white border border-gray-300" /> natural
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-gray-800" /> sharp / flat
              </span>
            </div>
          </div>
        )}

        {/* Theory Topics */}
        {theoryTopics.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 md:col-span-2 shadow-sm">
            <h3 className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">📖</span>
              Suggested Topics to Study
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {theoryTopics.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">♩</span>
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat tip */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-indigo-800">💬 Ask about this audio in Chat!</p>
        <p className="text-xs text-indigo-500 mt-1">
          Try: <em>"What chords are in my recording?"</em> · <em>"Explain the key of {detectedKey}"</em> · <em>"What scale fits {detectedKey}?"</em>
        </p>
      </div>
    </div>
  )
}
