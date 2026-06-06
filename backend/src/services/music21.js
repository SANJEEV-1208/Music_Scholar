import axios from 'axios'
import FormData from 'form-data'

export async function analyzeSheetMusic(fileBuffer, filename) {
  const form = new FormData()
  form.append('file', fileBuffer, { filename })

  const { data } = await axios.post(
    `${process.env.MUSIC21_SERVICE_URL}/analyze`,
    form,
    { headers: form.getHeaders(), timeout: 120000 }
  )
  return data
}

export function sheetMusicToText(analysis) {
  const {
    keySignature = 'Unknown',
    timeSignature = 'Unknown',
    scale = 'Unknown',
    tempoMarkings = [],
    chordProgression = [],
    theoryTopics = [],
  } = analysis

  const tempoStr =
    tempoMarkings.length > 0
      ? tempoMarkings.map(t => `${t.text || ''} (♩=${t.bpm})`).join(', ')
      : 'Not specified'

  const chordsStr =
    chordProgression.length > 0
      ? chordProgression
          .slice(0, 16)
          .map(b => `Bar ${b.bar}: ${b.chords.join(', ')}`)
          .join('; ')
      : 'Not available'

  const topicsStr = theoryTopics.join(', ')

  return (
    `This piece is in the key of ${keySignature} with a time signature of ${timeSignature}. ` +
    `The detected scale is ${scale}. Tempo: ${tempoStr}. ` +
    `Chord progression: ${chordsStr}. ` +
    `Suggested music theory topics for study: ${topicsStr}.`
  )
}
