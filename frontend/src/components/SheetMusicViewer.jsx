import { useEffect, useRef } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

function AnalysisSidebar({ analysis }) {
  const {
    keySignature,
    timeSignature,
    scale,
    tempoMarkings = [],
    chordProgression = [],
    theoryTopics = [],
  } = analysis

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overview */}
      <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-indigo-800 text-sm">Overview</h3>
        <p className="text-sm text-gray-700"><span className="font-medium">Key:</span> {keySignature}</p>
        <p className="text-sm text-gray-700"><span className="font-medium">Time Sig:</span> {timeSignature}</p>
        <p className="text-sm text-gray-700"><span className="font-medium">Scale:</span> {scale}</p>
        {tempoMarkings.length > 0 && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Tempo:</span>{' '}
            {tempoMarkings.map(t => `${t.text} ♩=${t.bpm}`).join(', ')}
          </p>
        )}
      </div>

      {/* Theory Topics */}
      <div className="bg-amber-50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-amber-800 text-sm">Suggested Topics to Study</h3>
        <ul className="space-y-1">
          {theoryTopics.map((topic, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
              <span className="text-amber-500 mt-0.5">•</span> {topic}
            </li>
          ))}
        </ul>
      </div>

      {/* Chord Progression */}
      {chordProgression.length > 0 && (
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Chord Progression</h3>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-1 pr-4">Bar</th>
                  <th className="pb-1">Chords</th>
                </tr>
              </thead>
              <tbody>
                {chordProgression.map(bar => (
                  <tr key={bar.bar} className="border-b border-gray-50">
                    <td className="py-1 pr-4 text-gray-500">{bar.bar}</td>
                    <td className="py-1 text-gray-700">{bar.chords.join(' → ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SheetMusicViewer({ xmlContent, analysis }) {
  const containerRef = useRef(null)
  const osmdRef = useRef(null)

  useEffect(() => {
    if (!xmlContent || !containerRef.current) return

    async function render() {
      if (!osmdRef.current) {
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          drawTitle: true,
          drawComposer: true,
          drawCredits: true,
          newSystemFromXML: true,
        })
      }
      try {
        await osmdRef.current.load(xmlContent)
        osmdRef.current.render()
      } catch (err) {
        console.error('OSMD render error:', err)
      }
    }

    render()

    return () => {
      osmdRef.current?.clear()
    }
  }, [xmlContent])

  if (!xmlContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
        <div className="text-5xl">🎵</div>
        <p className="text-lg font-medium">No sheet music loaded</p>
        <p className="text-sm">Upload a MusicXML or MIDI file from the Upload tab</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Sheet Music</h2>
      <div
        ref={containerRef}
        className="w-full min-h-96 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      />
      {analysis && <AnalysisSidebar analysis={analysis} />}
    </div>
  )
}
