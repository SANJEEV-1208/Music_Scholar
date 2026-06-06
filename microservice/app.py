import os
import tempfile
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import music21
import librosa

load_dotenv()

app = Flask(__name__)
CORS(app)


# ── Sheet music helpers ──────────────────────────────────────────────────────

def derive_theory_topics(key_label, chord_progression, is_minor=False):
    topics = [f"Diatonic harmony in {key_label}", "Reading key signatures"]
    if is_minor:
        topics += [
            "Natural minor scale",
            "Harmonic minor scale",
            "Relative major/minor relationship",
            "Minor key chord functions",
        ]
    else:
        topics += [
            "Major scale construction",
            "Circle of fifths",
            "Functional harmony (tonic, subdominant, dominant)",
        ]
    all_chords = [c for bar in chord_progression for c in bar.get("chords", [])]
    if len(set(all_chords)) > 4:
        topics.append("Secondary dominants and borrowed chords")
    return list(dict.fromkeys(topics))


def analyze_score(score):
    key_obj = score.analyze("key")
    key_signature = str(key_obj)
    scale = f"{key_obj.tonic.name} {key_obj.type}"

    time_sig = None
    for part in score.parts:
        for measure in part.getElementsByClass("Measure"):
            ts_elements = measure.getElementsByClass("TimeSignature")
            if ts_elements:
                time_sig = str(ts_elements[0])
                break
        if time_sig:
            break

    tempo_markings = []
    for el in score.flatten().getElementsByClass("MetronomeMark"):
        tempo_markings.append({"text": el.text or "", "bpm": el.number})

    chord_progression = []
    try:
        chordified = score.chordify()
        for measure in chordified.getElementsByClass("Measure"):
            bar_chords = []
            for chord in measure.getElementsByClass("Chord"):
                if chord.pitches:
                    if len(chord.pitches) == 1:
                        bar_chords.append(chord.pitches[0].name)
                    else:
                        name = chord.commonName
                        bar_chords.append(name if name != "note" else chord.pitches[0].name)
            if bar_chords:
                chord_progression.append({"bar": measure.number, "chords": bar_chords})
            if len(chord_progression) >= 32:
                break
    except Exception:
        chord_progression = []

    theory_topics = derive_theory_topics(key_signature, chord_progression, key_obj.type == "minor")
    return {
        "keySignature": key_signature,
        "timeSignature": time_sig or "Unknown",
        "chordProgression": chord_progression,
        "scale": scale,
        "tempoMarkings": tempo_markings,
        "theoryTopics": theory_topics,
    }


# ── Audio analysis helpers ───────────────────────────────────────────────────

CHORD_TEMPLATES = {
    "C major":  [1,0,0,0,1,0,0,1,0,0,0,0],
    "C# major": [0,1,0,0,0,1,0,0,1,0,0,0],
    "D major":  [0,0,1,0,0,0,1,0,0,1,0,0],
    "Eb major": [0,0,0,1,0,0,0,1,0,0,1,0],
    "E major":  [0,0,0,0,1,0,0,0,1,0,0,1],
    "F major":  [1,0,0,0,0,1,0,0,0,1,0,0],
    "F# major": [0,1,0,0,0,0,1,0,0,0,1,0],
    "G major":  [0,0,1,0,0,0,0,1,0,0,0,1],
    "Ab major": [1,0,0,1,0,0,0,0,1,0,0,0],
    "A major":  [0,1,0,0,1,0,0,0,0,1,0,0],
    "Bb major": [0,0,1,0,0,1,0,0,0,0,1,0],
    "B major":  [0,0,0,1,0,0,1,0,0,0,0,1],
    "C minor":  [1,0,0,1,0,0,0,1,0,0,0,0],
    "C# minor": [0,1,0,0,1,0,0,0,1,0,0,0],
    "D minor":  [0,0,1,0,0,1,0,0,0,1,0,0],
    "Eb minor": [0,0,0,1,0,0,1,0,0,0,1,0],
    "E minor":  [0,0,0,0,1,0,0,1,0,0,0,1],
    "F minor":  [1,0,0,0,0,1,0,0,1,0,0,0],
    "F# minor": [0,1,0,0,0,0,1,0,0,1,0,0],
    "G minor":  [0,0,1,0,0,0,0,1,0,0,1,0],
    "Ab minor": [1,0,0,1,0,0,0,0,1,0,0,0],
    "A minor":  [1,0,0,0,1,0,0,0,0,1,0,0],
    "Bb minor": [0,1,0,0,0,1,0,0,0,0,1,0],
    "B minor":  [0,0,1,0,0,0,1,0,0,0,0,1],
}

NOTE_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']

def hz_to_note_name(freq):
    if freq <= 0 or np.isnan(freq):
        return None
    midi = 69 + 12 * np.log2(freq / 440.0)
    midi_int = int(round(midi))
    note = NOTE_NAMES[midi_int % 12]
    octave = (midi_int // 12) - 1
    return f"{note}{octave}"

def match_chord(chroma_vector):
    chroma = np.array(chroma_vector)
    if chroma.sum() == 0:
        return None
    chroma = chroma / chroma.sum()
    best, best_score = None, -1
    for name, template in CHORD_TEMPLATES.items():
        score = float(np.dot(chroma, template))
        if score > best_score:
            best_score = score
            best = name
    return best if best_score > 0.3 else None

def analyze_audio_file(tmp_path):
    SR = 22050  # fixed sample rate for speed
    MAX_DURATION = 60  # only analyze first 60 seconds

    # Get total duration before loading
    duration_sec = float(librosa.get_duration(path=tmp_path))
    minutes = int(duration_sec // 60)
    seconds = int(duration_sec % 60)

    # Load only first 60s at fixed sample rate
    y, sr = librosa.load(tmp_path, sr=SR, mono=True, duration=MAX_DURATION)

    # Tempo and beats (fast)
    hop_length = 1024  # larger hop = faster
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
    tempo_val = float(tempo) if np.ndim(tempo) == 0 else float(tempo[0])
    beat_count = int(len(beat_frames))

    # Key detection via chroma
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop_length)
    mean_chroma = chroma.mean(axis=1)
    key_idx = int(np.argmax(mean_chroma))
    key_name = NOTE_NAMES[key_idx]

    # Major vs minor correlation
    major_profile = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
    minor_profile = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
    shifted_major = np.roll(major_profile, key_idx)
    shifted_minor = np.roll(minor_profile, key_idx)
    major_corr = float(np.corrcoef(mean_chroma, shifted_major)[0,1])
    minor_corr = float(np.corrcoef(mean_chroma, shifted_minor)[0,1])
    mode = "major" if major_corr >= minor_corr else "minor"
    detected_key = f"{key_name} {mode}"

    # Chord progression — one chord per beat
    chroma_frames = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop_length)
    beat_chroma = librosa.util.sync(chroma_frames, beat_frames, aggregate=np.median)
    chord_sequence = []
    prev = None
    for i in range(beat_chroma.shape[1]):
        chord = match_chord(beat_chroma[:, i].tolist())
        if chord and chord != prev:
            chord_sequence.append(chord)
            prev = chord
        if len(chord_sequence) >= 24:
            break

    # Pitch/note detection — run only on first 20 seconds for speed
    note_sequence = []
    try:
        y_short = y[:SR * 20]  # first 20 seconds only
        f0, voiced_flag, _ = librosa.pyin(
            y_short,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr,
            hop_length=hop_length * 2,  # coarser resolution = faster
        )
        prev_note = None
        for freq, voiced in zip(f0, voiced_flag):
            if voiced and freq is not None:
                note = hz_to_note_name(float(freq))
                if note and note != prev_note:
                    note_sequence.append(note)
                    prev_note = note
            if len(note_sequence) >= 40:
                break
    except Exception:
        note_sequence = []

    # Theory topics
    is_minor = mode == "minor"
    topics = [f"Melody and pitch recognition in {detected_key}", "Rhythm and tempo analysis"]
    if is_minor:
        topics += ["Natural minor scale", "Minor key harmony"]
    else:
        topics += ["Major scale construction", "Circle of fifths"]
    if len(set(chord_sequence)) > 3:
        topics.append("Chord progressions and harmonic analysis")
    topics.append("Ear training and transcription")

    return {
        "detectedKey": detected_key,
        "tempo": round(tempo_val, 1),
        "duration": f"{minutes}:{seconds:02d}",
        "chordProgression": chord_sequence,
        "noteSequence": note_sequence[:40],
        "theoryTopics": list(dict.fromkeys(topics)),
        "beatCount": beat_count,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    filename = file.filename or "upload"
    _, ext = os.path.splitext(filename)
    ext = ext.lower() or ".xml"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        score = music21.converter.parse(tmp_path)
        result = analyze_score(score)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route("/analyze-audio", methods=["POST"])
def analyze_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    filename = file.filename or "audio"
    _, ext = os.path.splitext(filename)
    ext = ext.lower() or ".wav"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        result = analyze_audio_file(tmp_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
