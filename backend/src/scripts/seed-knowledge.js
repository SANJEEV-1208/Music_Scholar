/**
 * Seed the MusicScholar knowledge base with pre-written music theory content.
 * Run once: node src/scripts/seed-knowledge.js
 * Safe to re-run — skips documents that already exist by title.
 */

import 'dotenv/config'
import { pool } from '../services/retrieval.js'
import { chunkText } from '../services/chunker.js'
import { embedTexts } from '../services/embeddings.js'

const KNOWLEDGE_DOCUMENTS = [
  {
    title: 'Music Theory Fundamentals – Notes, Pitch, and the Musical Alphabet',
    content: `Music is built on pitch — the highness or lowness of a sound. Western music uses twelve distinct pitches within each octave, named using the musical alphabet: A, B, C, D, E, F, G. After G, the alphabet repeats at a higher pitch level. The note A above middle C vibrates at 440 Hz; each octave doubles that frequency.

Between most adjacent letter names there is a half step (semitone) — the smallest interval in Western music. However, between E and F, and between B and C, there are naturally only half steps with no note in between. Between all other adjacent letter names (A–B, C–D, D–E, F–G, G–A) there is a whole step (two semitones).

The twelve pitches are created by adding sharps (#) and flats (b) to the seven letter names. A sharp raises a note by one half step; a flat lowers it by one half step. A natural sign (♮) cancels a sharp or flat and returns the note to its unaltered pitch.

Enharmonic equivalents are notes that sound identical but are written differently. For example, C# and Db are enharmonic equivalents — the same pitch with two different names. Similarly, F# = Gb, G# = Ab, A# = Bb, D# = Eb. Context (the key you are in) determines which name to use.

The octave divides into twelve equally spaced half steps in equal temperament — the tuning system used in modern Western music. Middle C (C4) sits at the middle of the piano keyboard. Notes are labelled with octave numbers: C4 is middle C, C5 is one octave above, C3 one octave below.

Clefs are symbols placed at the beginning of a staff to define the pitch of each line and space. The treble clef (G clef) has its curl on the G above middle C (second line from the bottom). The bass clef (F clef) anchors F below middle C on the fourth line. The alto clef and tenor clef are C clefs used for viola and trombone respectively, placing middle C on different lines.

Ledger lines extend the staff above or below its five lines. Middle C sits on its own ledger line directly between the treble and bass staves in grand staff notation. Reading ledger lines fluently is essential for all instrumentalists and singers.`,
  },

  {
    title: 'Scales – Major, Minor, Pentatonic, and Modal Scales',
    content: `A scale is an ordered sequence of pitches spanning one octave, following a specific pattern of whole steps (W) and half steps (H). The particular pattern of intervals gives each scale its distinctive sound or "colour."

THE MAJOR SCALE
The major scale follows the pattern W–W–H–W–W–W–H. Starting on any note and applying this pattern produces a major scale. The C major scale — C D E F G A B C — uses only white keys on the piano and is the reference scale from which all others are derived. Its sound is generally described as bright, happy, or resolved. The seven notes of a scale are called scale degrees: tonic (1), supertonic (2), mediant (3), subdominant (4), dominant (5), submediant (6), and leading tone (7).

THE NATURAL MINOR SCALE
The natural minor scale follows the pattern W–H–W–W–H–W–W. The A natural minor scale — A B C D E F G A — also uses only white keys and is the relative minor of C major. Minor scales generally sound darker, sadder, or more serious than major scales. The crucial difference from major is the lowered third degree (minor third) and lowered sixth and seventh degrees.

THE HARMONIC MINOR SCALE
The harmonic minor scale raises the seventh degree of the natural minor by one half step, creating a leading tone that pulls strongly toward the tonic. The raised seventh creates an augmented second (three half steps) between the sixth and seventh degrees — a distinctive interval that gives harmonic minor its exotic, tense quality. The A harmonic minor scale: A B C D E F G# A.

THE MELODIC MINOR SCALE
The melodic minor scale traditionally uses different notes ascending and descending to smooth out the awkward augmented second. Ascending: raise both the sixth and seventh degrees (A B C D E F# G# A). Descending: use the natural minor (A G F E D C B A). In jazz and modern usage, the ascending form is often used in both directions and is called the jazz melodic minor.

THE PENTATONIC SCALE
The pentatonic scale has five notes per octave. The major pentatonic (C D E G A) removes the fourth and seventh degrees from the major scale. The minor pentatonic (A C D E G) removes the second and sixth from the natural minor. The minor pentatonic plus a flattened fifth creates the blues scale (A C D Eb E G), widely used in rock, blues, and jazz.

THE MODES
The seven diatonic modes are built by starting a major scale on each of its seven degrees:
- Ionian (starts on 1): same as major scale — bright, stable.
- Dorian (starts on 2): minor with a raised sixth — used in jazz and folk (D E F G A B C D).
- Phrygian (starts on 3): minor with a flattened second — dark, Spanish or Middle Eastern flavour.
- Lydian (starts on 4): major with a raised fourth — dreamy, floating character.
- Mixolydian (starts on 5): major with a flattened seventh — bluesy, rock, and folk feel.
- Aeolian (starts on 6): same as natural minor — the default minor sound.
- Locrian (starts on 7): diminished quality; rarely used as a tonal centre but common in jazz.

Other scales: the whole tone scale (all whole steps, 6 notes: C D E F# G# A# C) produces a hazy, unresolved sound. The diminished (octatonic) scale alternates half and whole steps and contains 8 notes — used extensively in jazz and 20th-century music. The chromatic scale uses all twelve half steps.`,
  },

  {
    title: 'Intervals – Understanding Distance Between Notes',
    content: `An interval is the distance in pitch between two notes. Intervals are fundamental to understanding melody, harmony, chords, and voice leading. Two notes played simultaneously form a harmonic interval; two notes played in sequence form a melodic interval.

INTERVAL NAMING
Intervals are named by two components: a number (quality-count) and a quality. The number counts the letter names from the lower to the upper note, including both notes. C to G counts C(1)–D(2)–E(3)–F(4)–G(5), so the interval is a fifth. C to E = third. C to A = sixth.

INTERVAL QUALITY
The quality refines the size:
- Perfect: applies to unisons, fourths, fifths, and octaves. These intervals appear in pure, natural resonance.
- Major: the larger version of seconds, thirds, sixths, and sevenths found in the major scale above the tonic.
- Minor: one half step smaller than major (m2, m3, m6, m7).
- Augmented: one half step larger than perfect or major.
- Diminished: one half step smaller than perfect or minor.

HALF-STEP COUNTS FOR COMMON INTERVALS
- Minor second (m2): 1 half step — E to F, B to C.
- Major second (M2): 2 half steps — C to D.
- Minor third (m3): 3 half steps — A to C.
- Major third (M3): 4 half steps — C to E.
- Perfect fourth (P4): 5 half steps — C to F.
- Tritone / Augmented fourth / Diminished fifth: 6 half steps — C to F# or C to Gb. The most dissonant interval in Western music; historically called "diabolus in musica."
- Perfect fifth (P5): 7 half steps — C to G. Highly consonant and stable.
- Minor sixth (m6): 8 half steps.
- Major sixth (M6): 9 half steps — C to A.
- Minor seventh (m7): 10 half steps.
- Major seventh (M7): 11 half steps — C to B. Very tense, wants to resolve to the octave.
- Perfect octave (P8): 12 half steps.

CONSONANCE AND DISSONANCE
Consonant intervals sound stable and restful: perfect unison, perfect fifth, perfect octave, and all thirds and sixths. Dissonant intervals sound tense and want to resolve: seconds, sevenths, and the tritone. In tonal music, dissonance creates tension that drives harmonic motion toward consonant resolution.

INTERVAL INVERSION
Inverting an interval means flipping the two notes so the lower note becomes the upper note (or moving it up an octave). An inverted interval produces its complement: seconds become sevenths, thirds become sixths, fourths become fifths. Perfect stays perfect; major becomes minor and vice versa; augmented becomes diminished.

COMPOUND INTERVALS
Intervals larger than an octave are compound intervals. A ninth is an octave plus a second; a tenth is an octave plus a third. In analysis they are often reduced to their simple equivalents but are named as compound intervals in voice leading and orchestration.`,
  },

  {
    title: 'Chords – Triads, Seventh Chords, and Extensions',
    content: `A chord is three or more notes sounded simultaneously. Chords are the building blocks of harmony. Most tonal chords are built in thirds — stacking notes every other scale degree.

TRIADS
A triad has three notes: root, third, and fifth.
- Major triad: root + major third (4 half steps) + perfect fifth (7 half steps). Formula: M3 + m3. Example: C–E–G. Bright, stable sound.
- Minor triad: root + minor third (3 half steps) + perfect fifth (7 half steps). Formula: m3 + M3. Example: A–C–E. Darker, more melancholic.
- Diminished triad: root + minor third + diminished fifth (6 half steps). Formula: m3 + m3. Example: B–D–F. Tense, unstable — rarely used as a resting point.
- Augmented triad: root + major third + augmented fifth (8 half steps). Formula: M3 + M3. Example: C–E–G#. Exotic, floating, unresolved quality.

CHORD INVERSIONS
A triad in root position has the root as the lowest note. First inversion places the third in the bass. Second inversion places the fifth in the bass. Inversions change the stability and colour of a chord without changing its harmonic function. Second inversion chords are particularly unstable and require careful treatment.

SEVENTH CHORDS
A seventh chord adds a fourth note — the seventh — to a triad.
- Major seventh chord (Maj7): major triad + major seventh. C–E–G–B. Warm, jazzy, luminous.
- Dominant seventh chord (7): major triad + minor seventh. C–E–G–Bb. Highly tense; the most important chord for establishing key. Always wants to resolve to the tonic.
- Minor seventh chord (m7): minor triad + minor seventh. A–C–E–G. Smooth, common in jazz and R&B.
- Half-diminished chord (ø7 or m7b5): diminished triad + minor seventh. B–D–F–A. Used as the ii chord in minor keys.
- Diminished seventh chord (°7): diminished triad + diminished seventh. B–D–F–Ab. Extremely tense; symmetrical — every note can function as the root. Common in Baroque and Romantic music for dramatic effect.
- Minor-major seventh chord (mMaj7): minor triad + major seventh. A–C–E–G#. Dark and sophisticated; common in film scores and jazz.

CHORD EXTENSIONS
Extended chords add notes beyond the seventh: ninths (9th), elevenths (11th), and thirteenths (13th). These are the "colour tones" in jazz harmony. A Cmaj9 = C–E–G–B–D. A C13 = C–E–G–Bb–D–A. Extensions add richness and complexity. In jazz, certain chord tones are often omitted (particularly the fifth) to keep voicings clear and let the essential colour tones stand out.

SUSPENDED CHORDS
Suspended chords replace the third with either a second (sus2) or fourth (sus4). Csus4 = C–F–G. Csus2 = C–D–G. Suspended chords have an open, unresolved quality and typically resolve to the regular triad when the suspended note moves back to the third.

POWER CHORDS
A power chord (used in rock guitar) contains only the root and perfect fifth — no third. The absence of the third means it is neither major nor minor, allowing it to work over heavily distorted guitar without clashing harmonics.`,
  },

  {
    title: 'Harmony and Chord Progressions – Functional Harmony',
    content: `Functional harmony describes how chords relate to each other and to a tonal centre (the key). Each chord has a function — a role it plays in the harmonic drama of a piece.

DIATONIC CHORDS IN MAJOR
Every major key contains seven diatonic chords built on each scale degree using only notes from that scale. In the key of C major:
- I: C major (tonic) — home, rest, stability
- ii: D minor (supertonic) — pre-dominant function
- iii: E minor (mediant) — tonic function, less stable
- IV: F major (subdominant) — pre-dominant, departure from home
- V: G major (dominant) — tension, strongest pull toward tonic
- vi: A minor (submediant) — tonic function, the "relative minor"
- vii°: B diminished (leading tone chord) — dominant function, very tense

DIATONIC CHORDS IN MINOR
Using the harmonic minor scale for the dominant chord:
- i: A minor — tonic
- ii°: B diminished — pre-dominant
- III: C major — tonic/mediant
- iv: D minor — subdominant
- V: E major (using raised 7th G#) — dominant, strong pull to tonic
- VI: F major — submediant
- VII: G major — subtonic (less tension than raised leading tone)

THE THREE HARMONIC FUNCTIONS
1. Tonic (T): stability and rest — chords I, iii, vi.
2. Pre-dominant / Subdominant (PD): tension building — chords ii, IV.
3. Dominant (D): maximum tension, pulls toward tonic — chords V, vii°.

The basic harmonic motion T → PD → D → T creates forward momentum and resolution. This is the engine of tonal music.

COMMON CHORD PROGRESSIONS
- I–IV–V–I: the most fundamental progression in Western music. Used in blues, country, classical, and pop.
- I–V–vi–IV: the "four-chord pop progression" (also called the Axis progression). Used in thousands of pop songs from the Beatles to modern chart music.
- ii–V–I: the cornerstone of jazz harmony. The ii chord prepares the V; the V resolves to I. Extended: ii7–V7–Imaj7.
- I–vi–IV–V: the "50s progression" or "doo-wop changes." Common in ballads and early rock and roll.
- vi–IV–I–V: the minor-feel variant of the pop progression.
- I–IV–I–V–I: 12-bar blues uses I, IV, and V chords in a specific 12-measure repeating form.

SECONDARY DOMINANTS
Any chord can be temporarily tonicised by placing its own dominant chord before it. V/V (the dominant of the dominant) is the most common secondary dominant. In C major, the V/V is D7 (dominant seventh of G). Secondary dominants create brief excursions to other tonal areas and add harmonic colour. They are written V/x, meaning "the dominant of chord x."

BORROWED CHORDS (MODAL MIXTURE)
Borrowing chords from the parallel minor (or major) adds emotional depth. In C major, the iv chord (F minor) borrowed from C minor creates a poignant effect. The bVII (Bb major in C major, borrowed from Mixolydian) is common in rock. The bVI (Ab major in C major) is dramatic — used in film scores for emotional peaks.

DECEPTIVE CADENCES
A deceptive cadence occurs when V resolves unexpectedly to vi instead of I. The ear expects the home chord but gets the submediant — a surprising but consonant substitute. Composers use this to extend phrases and avoid an early conclusion.

CADENCES
A cadence is a harmonic formula that creates a sense of pause or ending.
- Authentic (perfect) cadence: V–I with both chords in root position and tonic in soprano. The strongest ending.
- Half cadence: any progression ending on V. Creates expectation and forward motion.
- Plagal cadence: IV–I. The "Amen" cadence; gentle, religious character.
- Deceptive cadence: V–vi. Surprising but not jarring.`,
  },

  {
    title: 'Key Signatures and the Circle of Fifths',
    content: `Key signatures appear at the beginning of each staff and indicate which notes are consistently raised or lowered throughout a piece. They tell the performer which key the music is in and eliminate the need to write accidentals on every affected note.

THE CIRCLE OF FIFTHS
The circle of fifths is the most important diagram in music theory. It arranges all 12 major keys (and their relative minors) in a circle based on the interval of a perfect fifth. Moving clockwise adds one sharp; moving counter-clockwise adds one flat.

Clockwise (sharps): C – G – D – A – E – B – F#/Gb – Db – Ab – Eb – Bb – F – C
Each key going right adds one sharp to the key signature.

MAJOR KEY SIGNATURES WITH SHARPS
- C major: 0 sharps
- G major: 1 sharp (F#)
- D major: 2 sharps (F#, C#)
- A major: 3 sharps (F#, C#, G#)
- E major: 4 sharps (F#, C#, G#, D#)
- B major: 5 sharps (F#, C#, G#, D#, A#)
- F# major: 6 sharps
- C# major: 7 sharps

MAJOR KEY SIGNATURES WITH FLATS
- F major: 1 flat (Bb)
- Bb major: 2 flats (Bb, Eb)
- Eb major: 3 flats (Bb, Eb, Ab)
- Ab major: 4 flats (Bb, Eb, Ab, Db)
- Db major: 5 flats (Bb, Eb, Ab, Db, Gb)
- Gb major: 6 flats
- Cb major: 7 flats

TRICKS FOR IDENTIFYING KEY SIGNATURES
For sharp keys: the last sharp is the leading tone (seventh degree). Add one half step to find the tonic. Example: three sharps = F#, C#, G# — G# is the leading tone, so the key is A major.
For flat keys: the second-to-last flat is the tonic. Example: four flats = Bb, Eb, Ab, Db — the second-to-last flat is Ab, so the key is Ab major. Exception: one flat = F major (memorise this one).

RELATIVE MAJOR AND MINOR
Every major key shares its key signature with a relative minor key. The relative minor starts on the sixth degree of the major scale (or equivalently, three half steps below the major tonic). C major ↔ A minor. G major ↔ E minor. F major ↔ D minor. The relative pair shares all the same notes but has a different tonal centre.

PARALLEL MAJOR AND MINOR
The parallel minor shares the same tonic but has a different key signature. C major and C minor are parallel keys. C minor has three flats (Bb, Eb, Ab) while C major has none. Borrowing chords between parallel keys is called modal mixture.

TRANSPOSITION
To transpose a piece to a different key, move every note by the same interval. If transposing from C major to G major (up a perfect fifth), raise every note by a perfect fifth and change the key signature from 0 sharps to 1 sharp. Transposition is essential for arranging music for different instruments and voice types.

ENHARMONIC KEYS
Some keys sound identical but are written differently: F# major = Gb major, C# major = Db major, B major = Cb major. Composers and arrangers choose the enharmonic spelling based on which is easier to read in context — generally the one with fewer accidentals.`,
  },

  {
    title: 'Rhythm, Meter, and Time Signatures',
    content: `Rhythm describes the organisation of music in time — the pattern of long and short durations, strong and weak beats, and the overall pulse of a piece. Meter is the regular grouping of beats into recurring patterns.

NOTE VALUES AND THEIR DURATIONS
In 4/4 time (the most common time signature):
- Whole note (semibreve): 4 beats. Open note head with no stem.
- Half note (minim): 2 beats. Open note head with stem.
- Quarter note (crotchet): 1 beat. Filled note head with stem. The standard pulse unit.
- Eighth note (quaver): half a beat. Filled note head with stem and one flag (or beam).
- Sixteenth note (semiquaver): quarter of a beat. Two flags or beams.
- Thirty-second note: eighth of a beat. Three flags or beams.

Rests indicate silence for the corresponding duration: whole rest (rectangular block hanging from line), half rest (block sitting on line), quarter rest (squiggly symbol), eighth rest, etc.

DOTTED NOTES
A dot after a note increases its duration by half. A dotted quarter note = 1.5 beats. A dotted half note = 3 beats. A double dot adds half of the dot's value again (e.g., double-dotted quarter = 1.75 beats). Dotted rhythms appear in marches, baroque music (French overture style), and jazz.

TIES AND SLURS
A tie connects two notes of the same pitch, combining their durations. A tied quarter + quarter = half note sound but written as two notes (used when the note extends across a barline). A slur connects notes of different pitches, indicating they should be played smoothly (legato).

TIME SIGNATURES
The top number tells how many beats per measure; the bottom number tells which note value gets one beat.
- 4/4 (common time, C): 4 quarter note beats. The most common time signature in Western music.
- 3/4: 3 quarter note beats. Waltz feel. Strong–weak–weak.
- 2/4: 2 quarter note beats. March feel. Strong–weak.
- 6/8: 6 eighth note beats, but felt in 2 (two groups of three). Lilting, compound duple.
- 9/8: 9 eighth notes, felt in 3. Compound triple.
- 12/8: 12 eighth notes, felt in 4. Compound quadruple. Common in slow blues and gospel.
- 5/4: 5 beats — asymmetric, heard in progressive rock and jazz (Dave Brubeck's "Take Five").
- 7/8: 7 eighth note beats — asymmetric, common in Balkan music and progressive rock.

SIMPLE VS COMPOUND METER
In simple meter the beat divides naturally into two equal parts (2/4, 3/4, 4/4). In compound meter the beat divides naturally into three equal parts (6/8, 9/8, 12/8). The difference creates fundamentally different rhythmic feels.

TUPLETS
A tuplet divides a beat into a number of equal parts different from the natural division. A triplet fits three notes into the space of two. In 4/4, an eighth-note triplet fits three eighth notes into one quarter beat. Duplets, quintuplets, septuplets and other tuplets are also used for expressive flexibility.

SYNCOPATION
Syncopation places rhythmic emphasis on normally weak beats or between beats. It creates energy, forward motion, and rhythmic surprise. Syncopation is essential in jazz, funk, reggae, and most popular music. Common syncopation: tying from a weak beat to the following strong beat (so the strong beat's note is "tied over" rather than attacked).

TEMPO MARKINGS
Traditional Italian tempo markings from slowest to fastest:
- Grave: very slow and solemn
- Largo: broad and slow
- Adagio: slow and stately
- Andante: walking pace (~76–108 BPM)
- Moderato: moderate (~108–120 BPM)
- Allegretto: moderately fast
- Allegro: fast and lively (~120–156 BPM)
- Vivace: lively and brisk
- Presto: very fast
- Prestissimo: as fast as possible

Metronome markings (e.g., ♩ = 120) indicate exact beats per minute.`,
  },

  {
    title: 'Musical Forms and Structures',
    content: `Musical form describes how a composition is organised at the large scale — how sections relate to each other, how themes are presented and developed, and how a piece achieves unity and variety. Understanding form helps listeners and performers navigate a piece and understand its expressive logic.

BINARY FORM (AB)
Binary form has two distinct sections, each usually repeated. Section A establishes the tonic, section B provides contrast (often moving to the dominant or relative major/minor) before returning to the tonic at the end. Common in Baroque dance movements (minuets, sarabandes, gigues). Rounded binary adds a return of A's opening material within the B section.

TERNARY FORM (ABA)
Ternary form has three sections: the first A section, a contrasting B section, and a return of A. The return creates symmetry and a satisfying sense of arrival. Common in da capo arias (Baroque opera), minuet and trio movements (Classical symphonies), and art songs. The B section contrasts in key, melody, texture, or mode.

RONDO FORM (ABACADA…)
A rondo has a recurring main theme (A, the refrain) alternating with contrasting episodes (B, C, D). The refrain always returns in the home key. Common as the final movement of Classical concertos and sonatas (Beethoven and Mozart rondos). Creates a feeling of celebration and return.

SONATA FORM (SONATA-ALLEGRO FORM)
The most important large-scale form in Western classical music. Used in the first movements (and often others) of symphonies, sonatas, string quartets, and concertos from the Classical era onward.

Three main sections:
1. Exposition: Presents the main thematic material. First theme group in the tonic key; transition modulates; second theme group in the dominant (major keys) or relative major (minor keys); closing section. Often repeated.
2. Development: Themes are fragmented, transformed, combined, and explored in various keys. Creates maximum tension and instability. Harmonic instability and motivic development are the hallmarks.
3. Recapitulation: Returns to the tonic key and restates material from the exposition. Both theme groups now appear in the tonic — this resolves the earlier tonal tension. Coda may follow.

THEME AND VARIATIONS
A theme is stated, then repeated in modified versions (variations) that alter melody, harmony, rhythm, texture, or mood while preserving the underlying harmonic structure. Examples: Beethoven's Diabelli Variations, Bach's Goldberg Variations, Mozart's "Ah vous dirai-je, Maman."

THROUGH-COMPOSED FORM
Each section presents new material without returning to earlier material. Common in ballads, lieder (German art songs), and progressive compositions where narrative or text drives the form. Schubert's "Erlkönig" is a famous through-composed song.

THE 12-BAR BLUES
A foundational form in blues, jazz, rock, and R&B. A 12-measure progression using I, IV, and V chords:
Bars 1–4: I chord
Bars 5–6: IV chord
Bars 7–8: I chord
Bars 9–10: V chord (or V–IV)
Bars 11–12: I chord (with turnaround)

THE 32-BAR AABA FORM
Standard form for Broadway and jazz "standards" (Great American Songbook). Four 8-bar phrases: A (statement), A (restatement), B (the "bridge" or "release" — contrasting key/mood), A (return). Examples: "I Got Rhythm" (Gershwin), "Autumn Leaves," hundreds of jazz standards.

FUGUE
A fugue is a contrapuntal composition built on a subject (short theme) that enters successively in different voices. The subject is answered at the interval of a fifth (the answer), then all voices develop the subject through episodes and stretto (overlapping entries). Bach's Well-Tempered Clavier contains 48 preludes and fugues.`,
  },

  {
    title: 'Voice Leading, Counterpoint, and Part Writing',
    content: `Voice leading is the art of connecting chords smoothly by moving each individual voice (melodic line) as efficiently as possible. Good voice leading is the foundation of Classical harmony and is crucial in jazz, orchestration, and composition.

FOUR-PART HARMONY (SATB)
Traditional harmony is written for four voices: Soprano (highest), Alto, Tenor, Bass. Each voice has a comfortable range:
- Soprano: C4–G5
- Alto: G3–C5
- Tenor: C3–G4
- Bass: E2–C4

Voice spacing: keep the upper three voices (SAT) within an octave of each other when possible. A gap larger than an octave between adjacent voices (except between tenor and bass) is called voice crossing or an overlap, generally avoided.

BASIC VOICE LEADING RULES
1. Prefer stepwise (conjunct) motion — move by half step or whole step where possible. Leaps are fine but should be approached and left carefully.
2. After a leap, move in the opposite direction by step (to balance the phrase).
3. The leading tone (seventh degree) must resolve upward by step to the tonic. In V7 chords, the leading tone is in the third of the chord.
4. The chordal seventh (in seventh chords) must resolve downward by step.
5. Avoid voice crossing — voices should not trade places (soprano going below alto, etc.).

PARALLEL MOTION AND FORBIDDEN PARALLELS
Parallel perfect fifths and parallel perfect octaves (P5s or P8s) between any two voices are strictly forbidden in traditional four-part harmony. They cause two voices to lose their independence. Parallel thirds and sixths are perfectly acceptable and contribute warmth. Hidden (direct) fifths and octaves occur when two voices move in the same direction to a perfect interval — generally avoided in outer voices.

CONTRARY AND OBLIQUE MOTION
Contrary motion (voices moving in opposite directions) is the safest and most elegant motion. It maximises independence. Oblique motion (one voice holds while another moves) is also good. Similar motion (both voices moving in the same direction to different intervals) is fine if not creating parallel fifths or octaves. Contrary motion between bass and soprano is especially valued.

SPECIES COUNTERPOINT
Species counterpoint is a pedagogical system for learning to write melodies against a cantus firmus (fixed melody). Five species:
1. First species (1:1): one note in the counterpoint against each note in the cantus — consonances only.
2. Second species (2:1): two notes against each cantus note — passing tones allowed on weak beats.
3. Third species (4:1): four notes against each cantus note — passing tones, neighbour tones.
4. Fourth species: tied notes creating suspensions — the most expressive type.
5. Fifth species (florid): combines all previous species freely.

SUSPENSIONS
A suspension occurs when a note is held from a consonant position into a dissonance, then resolves downward by step. Suspensions are labelled by the intervals they form before and after resolution: 4–3, 7–6, 9–8, 2–3 (bass). The 4–3 suspension (holding a fourth that resolves to a third) is particularly common over dominant chords.

JAZZ VOICE LEADING
In jazz, voice leading in chord voicings is equally important. The guide tones (third and seventh of a chord) define the harmony and move smoothly between chords. In a ii–V–I progression, the seventh of the ii chord typically moves down by half step to the third of the V chord, and the seventh of V moves down to the third of I — creating smooth stepwise voice leading even as the bass leaps.`,
  },

  {
    title: 'Music Notation, Dynamics, Articulation, and Performance Markings',
    content: `Reading and writing music notation is the universal language of Western music. Beyond notes and rhythms, a score contains a rich vocabulary of symbols that guide performance.

DYNAMICS
Dynamic markings indicate volume and intensity:
- ppp (pianississimo): extremely soft
- pp (pianissimo): very soft
- p (piano): soft
- mp (mezzo-piano): moderately soft
- mf (mezzo-forte): moderately loud
- f (forte): loud
- ff (fortissimo): very loud
- fff (fortississimo): extremely loud
- crescendo (cresc. or hairpin <): gradually getting louder
- decrescendo / diminuendo (decresc. / dim. or hairpin >): gradually getting softer
- sforzando (sfz or sf): suddenly loud and accented — one note is forced
- fp (fortepiano): suddenly loud then immediately soft

ARTICULATION
Articulation markings shape how individual notes are played:
- Staccato (dot above/below note): short, detached — played about half the written length.
- Legato (slur over groups of notes): smooth and connected.
- Accent (> above/below note): emphasise this note with more attack.
- Tenuto (line above/below note): hold the note for its full length, even slightly longer; slightly emphasised.
- Marcato (^ above note): strongly accented, like a hammer blow.
- Fermata (𝄐): hold the note longer than written — duration at performer's/conductor's discretion.
- Tremolo (diagonal lines through stem): rapidly repeat the note (or alternate between two notes).

ORNAMENTS
Ornaments decorate a melody:
- Trill (tr or ~~~): rapidly alternate between the written note and the note a half or whole step above.
- Mordent: quickly play the written note, the note below, and return.
- Inverted mordent (or upper mordent): written note, note above, return.
- Turn (∞): four-note ornament — note above, main note, note below, main note.
- Grace note / Appoggiatura: small note before the main note, taking value from it.

TEMPO AND EXPRESSION WORDS
Italian words appear throughout scores:
- a tempo: return to the original tempo after a deviation
- rubato: with flexibility; stealing and returning time expressively
- ritardando (rit.): gradually slowing
- rallentando (rall.): gradually slowing (similar to ritardando)
- accelerando (accel.): gradually speeding up
- stringendo: pressing forward, getting faster
- dolce: sweetly
- espressivo: expressively
- con brio: with vigour
- cantabile: in a singing style
- grazioso: gracefully
- agitato: agitated, restlessly
- maestoso: majestically
- scherzando: playfully, jokingly
- sostenuto: sustained; held back

REPEAT SIGNS AND NAVIGATION
- Repeat signs (|: and :|): go back to the start (or the beginning repeat sign) and play again.
- First and second endings (1. and 2. brackets): play first ending on the first pass, skip to second ending on the repeat.
- Da Capo (D.C.): go back to the beginning.
- Dal Segno (D.S.): go back to the sign (𝄋).
- al Fine: go to the marking "Fine" (the end).
- Coda (⊕): skip to the coda (ending section) at the indicated point.

SCORE READING AND TRANSPOSING INSTRUMENTS
In an orchestral score, all instruments are listed from top to bottom: woodwinds, brass, percussion, strings. Transposing instruments sound at a different pitch from what is written: a Bb clarinet sounds a major second lower than written; an F horn sounds a perfect fifth lower; an Eb alto saxophone sounds a major sixth lower. The conductor's full score shows concert pitch in modern editions, but individual parts are transposed.`,
  },
]

async function seedKnowledge() {
  console.log('🎼 MusicScholar — Seeding knowledge base...\n')

  const client = await pool.connect()
  let inserted = 0
  let skipped = 0

  try {
    for (const doc of KNOWLEDGE_DOCUMENTS) {
      // Check if already seeded
      const existing = await client.query(
        'SELECT id FROM documents WHERE title = $1 AND type = $2',
        [doc.title, 'preloaded']
      )
      if (existing.rows.length > 0) {
        console.log(`  ⏭  Skipped (already exists): ${doc.title.slice(0, 60)}…`)
        skipped++
        continue
      }

      await client.query('BEGIN')
      try {
        const docResult = await client.query(
          'INSERT INTO documents (title, source, type) VALUES ($1, $2, $3) RETURNING id',
          [doc.title, null, 'preloaded']
        )
        const documentId = docResult.rows[0].id

        const chunks = chunkText(doc.content)
        const embeddings = await embedTexts(chunks.map(c => c.content))

        for (let i = 0; i < chunks.length; i++) {
          const vec = '[' + embeddings[i].join(',') + ']'
          await client.query(
            'INSERT INTO chunks (document_id, content, embedding, metadata) VALUES ($1, $2, $3::vector, $4)',
            [documentId, chunks[i].content, vec, JSON.stringify(chunks[i].metadata)]
          )
        }

        await client.query('COMMIT')
        console.log(`  ✓  Inserted: "${doc.title.slice(0, 60)}…" → ${chunks.length} chunks`)
        inserted++
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  ✕  Failed: ${doc.title}\n     ${err.message}`)
      }
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log(`\n✅ Done. Inserted: ${inserted}  |  Skipped: ${skipped}`)
}

seedKnowledge().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
