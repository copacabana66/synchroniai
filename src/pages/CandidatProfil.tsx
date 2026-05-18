import { useState, useRef, useEffect } from 'react';
import type { PageName, AnalysisStatus, CvAnalysisData, VideoAnalysisData, QuestionnaireData } from '../types';
import { saveCvAnalysis, saveVideoAnalysis, saveQuestionnaire, savePreferences, uploadFile } from '../lib/candidateService';

// Convertit un File en base64 pur (sans le préfixe data:...)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface CandidatProfilProps {
  setPage: (p: PageName) => void;
  userId: string;
  onAnalysisComplete: (steps: AnalysisStatus) => void;
}

const STEPS = ['CV', 'Questionnaire', 'Vidéo', 'Préférences'];

const Q1_OPTIONS = ['Management directif', 'Management bienveillant', 'Par objectifs', 'Management horizontal/agile', 'Très grande autonomie'];
const Q2_OPTIONS = ['Open-space dynamique', 'Bureau privé calme', 'Full télétravail', 'Hybride 2-3j bureau', 'Sur site / terrain'];
const Q3_OPTIONS = ['Très collaboratif', 'Mix solo + équipe', 'Majoritairement solo', 'Petite équipe soudée', 'Grande équipe diverse'];
const Q4_OPTIONS = ['Cadencé et prévisible', 'Varié avec pics d\'intensité', 'Startup velocity', 'Projets longs et profonds', 'Multiprojet simultané'];

function PillSelector({ options, selected, onSelect }: { options: string[]; selected: string | null; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onSelect(o)}
          className={`px-4 py-2 rounded-full text-sm border transition-all font-medium ${
            selected === o ? 'bg-teal-light border-teal text-primary font-semibold' : 'border-border text-muted hover:bg-bg'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#09C4A0' : score >= 60 ? '#D48A12' : '#C0392B';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#F0F4F8" strokeWidth="5" />
          <circle
            cx="28" cy="28" r="22" fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${(score / 100) * 138.2} 138.2`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">{score}</span>
      </div>
      <span className="text-xs text-muted text-center leading-tight">{label}</span>
    </div>
  );
}

const MAX_RECORD_SECONDS = 90;

export function CandidatProfil({ setPage, userId, onAnalysisComplete }: CandidatProfilProps) {
  const [step, setStep] = useState(0);

  // CV state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvData, setCvData] = useState<CvAnalysisData | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  // Questionnaire
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [q4, setQ4] = useState<string | null>(null);

  // Video/audio recording
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoData, setVideoData] = useState<VideoAnalysisData | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preferences
  const [localisation, setLocalisation] = useState('');
  const [salaire, setSalaire] = useState('');
  const [contrat, setContrat] = useState('');
  const [dispo, setDispo] = useState('');

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── CV upload & analysis ──────────────────────────────────────────────────
  async function handleCvFile(file: File) {
    if (file.type !== 'application/pdf') {
      setCvError('Seul le format PDF est accepté. Convertissez votre CV en PDF et réessayez.');
      return;
    }
    // Max 4.5 MB → base64 ≈ 6 MB, dans la limite Vercel
    if (file.size > 4.5 * 1024 * 1024) {
      setCvError('Fichier trop volumineux (max 4,5 MB). Compressez votre PDF et réessayez.');
      return;
    }

    setCvFile(file);
    setCvError(null);
    setCvLoading(true);
    setCvData(null);

    // ── Étape 1 : encodage base64 (extraction PDF faite côté serveur) ────────
    let pdfBase64: string;
    try {
      pdfBase64 = await fileToBase64(file);
    } catch {
      setCvError('Impossible de lire le fichier. Réessayez ou utilisez un autre PDF.');
      setCvLoading(false);
      return;
    }

    // ── Étape 2 : appel API (timeout 60s — extraction + analyse LLM) ─────────
    let res: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === 'AbortError';
      setCvError(isTimeout
        ? "L'analyse a pris trop de temps (>60s). Réessayez."
        : 'Impossible de joindre le serveur. Vérifiez votre connexion internet.');
      setCvLoading(false);
      return;
    }

    // ── Étape 3 : parsing JSON ────────────────────────────────────────────────
    let data: Record<string, unknown>;
    try {
      data = await res.json() as Record<string, unknown>;
    } catch {
      setCvError(`Réponse invalide du serveur (HTTP ${res.status}). Réessayez dans quelques instants.`);
      setCvLoading(false);
      return;
    }

    // ── Étape 4 : résultat ───────────────────────────────────────────────────
    if (!res.ok) {
      const errorMap: Record<string, string> = {
        AI_NOT_CONFIGURED: 'Service intelligent non configuré. Contactez le support.',
        FILE_TOO_LARGE:    'PDF trop volumineux. Compressez-le (max 4,5 MB).',
        PDF_PARSE_ERROR:   'Le PDF est illisible ou corrompu. Régénérez-le depuis Word ou LibreOffice.',
        PDF_EMPTY:         'Le PDF est vide.',
        EMPTY_CV:          'Ce PDF ne contient pas de texte lisible. Utilisez un PDF généré par Word ou LibreOffice (pas un scan).',
        EMPTY_RESPONSE:    "Le service n'a pas pu analyser ce CV. Essayez un autre fichier.",
        TOO_MANY_REQUESTS: 'Trop de requêtes. Attendez une minute et réessayez.',
      };
      setCvError(errorMap[data.error as string] ?? `Erreur : ${data.detail ?? data.error ?? `HTTP ${res.status}`}`);
    } else {
      const parsed = data as unknown as CvAnalysisData;
      setCvData(parsed);
      if (userId) {
        uploadFile('cvs', userId, file, 'pdf').then(path => {
          saveCvAnalysis(userId, parsed, path ?? undefined);
        });
      }
    }

    setCvLoading(false);
  }


  // ── Audio recording ───────────────────────────────────────────────────────
  async function startRecording() {
    setVideoError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); analyzeAudio(mimeType); };

      recorder.start(250);
      setRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          if (s + 1 >= MAX_RECORD_SECONDS) { stopRecording(); return MAX_RECORD_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setVideoError('Microphone inaccessible. Autorisez l\'accès au micro dans votre navigateur.');
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function analyzeAudio(mimeType: string) {
    setVideoLoading(true);
    setVideoData(null);
    setVideoError(null);

    const blob = new Blob(audioChunksRef.current, { type: mimeType });
    if (blob.size > 10 * 1024 * 1024) {
      setVideoError('Enregistrement trop long. Maximum 90 secondes.');
      setVideoLoading(false);
      return;
    }

    // Étape 1 : encodage base64 (erreur isolée)
    let base64: string;
    try {
      base64 = await blobToBase64(blob);
    } catch (e) {
      console.error('[Audio] Erreur encodage base64 :', e);
      setVideoError('Erreur lors de la préparation de l\'audio. Réenregistrez.');
      setVideoLoading(false);
      return;
    }

    // Étape 2 : appel API (timeout 60s — transcription peut être longue)
    let res: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      res = await fetch('/api/transcribe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === 'AbortError';
      console.error('[Audio] Erreur réseau :', e);
      setVideoError(isTimeout
        ? 'La transcription a pris trop de temps. Réessayez avec un enregistrement plus court.'
        : 'Impossible de joindre le serveur. Vérifiez votre connexion.');
      setVideoLoading(false);
      return;
    }

    // Étape 3 : parsing JSON (erreur isolée)
    let data: Record<string, unknown>;
    try {
      data = await res.json() as Record<string, unknown>;
    } catch {
      console.error('[Audio] Réponse non-JSON, statut :', res.status);
      setVideoError(`Réponse invalide du serveur (HTTP ${res.status}). Réessayez.`);
      setVideoLoading(false);
      return;
    }

    if (!res.ok) {
      const errMap: Record<string, string> = {
        AI_NOT_CONFIGURED: 'Service intelligent non configuré.',
        TOO_MANY_REQUESTS: 'Trop de requêtes. Attendez une minute.',
        AUDIO_TOO_LARGE:   'Audio trop volumineux. Enregistrement plus court requis.',
        LLM_TIMEOUT:       'L\'analyse a pris trop de temps. Réessayez avec un enregistrement plus court (30-60s).',
      };
      setVideoError(errMap[data.error as string] ?? `Erreur d'analyse audio (${data.error ?? res.status}).`);
    } else {
      const parsed = data as unknown as VideoAnalysisData;
      setVideoData(parsed);
      if (userId) {
        uploadFile('videos', userId, blob, 'webm').then(path => {
          saveVideoAnalysis(userId, parsed, path ?? undefined);
        });
      }
    }
    setVideoLoading(false);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  function finish() {
    const qData: QuestionnaireData | undefined = (q1 && q2 && q3 && q4)
      ? { managementPref: q1, environmentPref: q2, collaborationPref: q3, rhythmPref: q4 }
      : undefined;

    // Persist questionnaire + preferences to Supabase
    if (userId && qData) saveQuestionnaire(userId, qData);
    if (userId) savePreferences(userId, {
      location: localisation, salary: salaire, contractType: contrat, availability: dispo,
    });

    onAnalysisComplete({
      cv:                !!cvData,
      cvData:            cvData ?? undefined,
      questionnaire:     !!(q1 && q2 && q3 && q4),
      questionnaireData: qData,
      video:             !!videoData,
      videoData:         videoData ?? undefined,
    });
    setPage('candidat');
  }

  const recordingPct = Math.round((recordingSeconds / MAX_RECORD_SECONDS) * 100);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => setPage('candidat')} className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-card transition-all">
          ← Retour
        </button>

        <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-1">Mon analyse de compatibilité</h1>
        <p className="text-muted text-sm mb-8">Complétez les étapes — vos données alimentent un matching réel, aucune donnée fictive.</p>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                step === i ? 'bg-primary text-white' : i < step ? 'text-teal' : 'text-muted'
              }`}
            >
              {i < step ? '✓ ' : `${i + 1}. `}{s}
            </button>
          ))}
        </div>

        {/* ── STEP 0 : CV ─────────────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">Importez votre CV</h2>
            <p className="text-sm text-muted mb-4">Notre algorithme extrait vos compétences réelles — aucune donnée inventée.</p>

            {/* Drop zone — click ou glisser-déposer */}
            <label
              htmlFor="cv-upload"
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleCvFile(f);
              }}
              className={`block border-2 border-dashed rounded-xl py-12 text-center mb-4 cursor-pointer transition-all ${
                cvData ? 'border-teal bg-teal-light' : cvLoading ? 'border-teal/40 bg-bg' : 'border-border hover:border-teal/40 bg-bg'
              }`}
            >
              <input
                id="cv-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCvFile(f); }}
              />
              {cvLoading ? (
                <>
                  <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-primary font-semibold">Analyse en cours…</p>
                  <p className="text-muted text-sm mt-1">SynchroniAI analyse votre CV</p>
                </>
              ) : cvData ? (
                <>
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-teal font-bold">CV analysé — {cvFile?.name}</p>
                  <p className="text-muted text-xs mt-1">Cliquez pour changer de fichier</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-primary font-semibold mb-1">Cliquez ou glissez votre CV ici</p>
                  <p className="text-muted text-sm">PDF uniquement · max 5 MB · glisser-déposer accepté</p>
                </>
              )}
            </label>

            {cvError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{cvError}</p>
              </div>
            )}

            {/* Extracted data preview */}
            {cvData && (
              <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <p className="text-sm font-bold text-primary mb-3">✅ Données extraites de votre CV</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-muted w-28 flex-shrink-0">Nom détecté</span>
                    <span className="text-xs text-primary font-medium">{cvData.fullName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-muted w-28 flex-shrink-0">Poste actuel</span>
                    <span className="text-xs text-primary">{cvData.currentRole}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-muted w-28 flex-shrink-0">Expérience</span>
                    <span className="text-xs text-primary">{cvData.yearsOfExperience} ans</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-muted w-28 flex-shrink-0">Formation</span>
                    <span className="text-xs text-primary">{cvData.education}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted block mb-1.5">Compétences détectées</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[...cvData.skills, ...cvData.technicalSkills].slice(0, 10).map(s => (
                        <span key={s} className="px-2.5 py-1 bg-teal-light text-teal text-xs font-semibold rounded-full border border-teal/20">{s}</span>
                      ))}
                    </div>
                  </div>
                  {cvData.summary && (
                    <div>
                      <span className="text-xs font-semibold text-muted block mb-1">Synthèse compatibilité</span>
                      <p className="text-xs text-primary leading-relaxed">{cvData.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-teal-light border border-teal/25 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary">🔒 Votre CV est analysé de façon confidentielle. Seules les compétences professionnelles sont extraites. Conformité RGPD totale.</p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── STEP 1 : Questionnaire ───────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-2">Questionnaire de compatibilité</h2>
            <p className="text-sm text-muted mb-6">Vos réponses alimentent le score sur 7 dimensions de matching.</p>
            <div className="space-y-6">
              <div><p className="font-semibold text-sm text-primary">1. Style de management préféré</p><PillSelector options={Q1_OPTIONS} selected={q1} onSelect={setQ1} /></div>
              <div><p className="font-semibold text-sm text-primary">2. Environnement de travail idéal</p><PillSelector options={Q2_OPTIONS} selected={q2} onSelect={setQ2} /></div>
              <div><p className="font-semibold text-sm text-primary">3. Style de collaboration préféré</p><PillSelector options={Q3_OPTIONS} selected={q3} onSelect={setQ3} /></div>
              <div><p className="font-semibold text-sm text-primary">4. Rythme de travail</p><PillSelector options={Q4_OPTIONS} selected={q4} onSelect={setQ4} /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
              <button onClick={() => setStep(2)} disabled={!(q1 && q2 && q3 && q4)} className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40">
                Continuer →
              </button>
            </div>
            {!(q1 && q2 && q3 && q4) && <p className="text-xs text-muted mt-2">Répondez aux 4 questions pour continuer.</p>}
          </div>
        )}

        {/* ── STEP 2 : Vidéo / Audio ───────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">Présentation audio</h2>
            <p className="text-sm text-muted mb-4">Enregistrez jusqu'à 90 secondes. SynchroniAI analyse uniquement votre expression orale — pas votre apparence.</p>

            {/* Recorder */}
            {!videoData && (
              <div className={`rounded-xl py-10 text-center border mb-4 transition-all ${
                recording ? 'bg-red-50 border-red-200' : 'bg-bg border-border'
              }`}>
                {recording ? (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-bold text-red-600">Enregistrement en cours</span>
                    </div>
                    {/* Progress arc */}
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#FEE2E2" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#EF4444" strokeWidth="6"
                          strokeDasharray={`${(recordingPct / 100) * 213.6} 213.6`}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-red-600">
                        {MAX_RECORD_SECONDS - recordingSeconds}s
                      </span>
                    </div>
                    <button onClick={stopRecording} className="px-6 py-2.5 rounded-btn bg-red-500 text-white font-bold text-sm hover:opacity-90 transition-all">
                      ⏹ Arrêter et analyser
                    </button>
                  </>
                ) : videoLoading ? (
                  <>
                    <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-primary font-semibold">Transcription & analyse en cours…</p>
                    <p className="text-muted text-sm mt-1">Groq Whisper analyse votre audio</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">🎙️</div>
                    <p className="text-primary font-semibold mb-1">Parlez de votre parcours et de vos aspirations</p>
                    <p className="text-muted text-sm mb-4">Maximum 90 secondes</p>
                    <button onClick={startRecording} className="px-6 py-2.5 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all">
                      ▶ Démarrer l'enregistrement
                    </button>
                  </>
                )}
              </div>
            )}

            {videoError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{videoError}</p>
              </div>
            )}

            {/* Results */}
            {videoData && (
              <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-teal font-bold text-lg">✅</span>
                  <p className="font-bold text-primary">Analyse audio terminée</p>
                  <button
                    onClick={() => { setVideoData(null); setVideoError(null); setRecordingSeconds(0); }}
                    className="ml-auto text-xs text-muted hover:text-primary border border-border rounded px-2 py-1"
                  >
                    Recommencer
                  </button>
                </div>
                {/* Scores */}
                <div className="flex justify-around mb-4">
                  <ScoreRing score={videoData.clarityScore} label="Clarté" />
                  <ScoreRing score={videoData.structureScore} label="Structure" />
                  <ScoreRing score={videoData.fluencyScore} label="Aisance" />
                </div>
                <p className="text-xs text-muted italic mb-3">{videoData.analysisNotes}</p>
                {videoData.transcript && (
                  <div className="bg-bg border border-border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted mb-1">Transcription</p>
                    <p className="text-xs text-primary leading-relaxed">{videoData.transcript.slice(0, 300)}{videoData.transcript.length > 300 ? '…' : ''}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl p-4 border border-yellow-200 mb-6" style={{ background: '#FEF5E0' }}>
              <p className="font-semibold text-sm mb-1" style={{ color: '#D48A12' }}>⚠ Ce qui est analysé</p>
              <p className="text-sm text-primary"><strong>Analysé :</strong> Clarté d'expression, structure, aisance à l'oral.</p>
              <p className="text-sm text-primary mt-1"><strong>Non analysé :</strong> Apparence, genre, origine, âge. Conformité AI Act totale.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
              {!videoData && (
                <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">Passer →</button>
              )}
              <button onClick={() => setStep(3)} className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all">
                {videoData ? 'Continuer →' : 'Continuer sans vidéo →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 : Préférences ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-6">Mes préférences</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">Localisation souhaitée</label>
                <input type="text" value={localisation} onChange={e => setLocalisation(e.target.value)} placeholder="Ex : Paris, Montpellier, Remote…" className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">Salaire annuel souhaité (brut)</label>
                <input type="text" value={salaire} onChange={e => setSalaire(e.target.value)} placeholder="Ex : 45 000€ – 55 000€" className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">Type de contrat</label>
                <select value={contrat} onChange={e => setContrat(e.target.value)} className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all">
                  <option value="">Sélectionner…</option>
                  <option>CDI</option><option>CDD</option><option>Freelance / Mission</option><option>Stage / Alternance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">Disponibilité</label>
                <select value={dispo} onChange={e => setDispo(e.target.value)} className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all">
                  <option value="">Sélectionner…</option>
                  <option>Immédiate</option><option>Sous 1 mois</option><option>Sous 3 mois</option><option>À définir</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-teal-light border border-teal/25 rounded-xl p-4 mt-6 mb-2">
              <p className="text-sm font-semibold text-primary mb-2">Récapitulatif de votre analyse</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'CV', done: !!cvData },
                  { label: 'Questionnaire', done: !!(q1 && q2 && q3 && q4) },
                  { label: 'Audio', done: !!videoData },
                ].map(s => (
                  <span key={s.label} className={`text-xs font-semibold px-3 py-1 rounded-full ${s.done ? 'bg-teal text-white' : 'bg-white text-muted border border-border'}`}>
                    {s.done ? '✓ ' : '○ '}{s.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
              <button onClick={() => { finish(); setPage('candidat-test'); }} className="px-6 py-3 rounded-btn bg-purple-600 text-white font-bold text-sm hover:opacity-90 transition-all">
                🧠 Passer le test cognitif
              </button>
              <button onClick={finish} className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all">
                ✓ Finaliser sans test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
