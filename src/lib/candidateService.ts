import { supabase, isConfigured } from './supabase';
import type { CvAnalysisData, VideoAnalysisData, QuestionnaireData, AssessmentData, AnalysisStatus } from '../types';

export interface ProfileRow {
  id: string;
  full_name?: string;
  email?: string;
  cv_url?: string;
  cv_text?: string;           // JSON stringifié de CvAnalysisData
  cv_analyzed_at?: string;
  video_url?: string;
  video_transcript?: string;
  video_analysis?: string;    // JSON stringifié de VideoAnalysisData
  video_analyzed_at?: string;
  management_pref?: string;
  environment_pref?: string;
  collaboration_pref?: string;
  rhythm_pref?: string;
  location_pref?: string;
  salary_expectation?: string;
  contract_type?: string;
  availability?: string;
  analysis_cv: boolean;
  analysis_questionnaire: boolean;
  analysis_video: boolean;
  analysis_assessment?: boolean;
  // Assessment (jsonb columns — Supabase renvoie directement les objets)
  assessment_cognitive?: AssessmentData['cognitive'];
  assessment_personality?: AssessmentData['personality'];
  assessment_responses?: Record<string, number>;
  assessment_completed_at?: string;
  updated_at?: string;
}

export async function upsertProfile(userId: string, data: Partial<ProfileRow>): Promise<void> {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('candidate_profiles')
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
  if (error) console.error('upsertProfile error:', error.message);
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.error('getProfile error:', error.message); return null; }
  return data;
}

/**
 * Recharge l'AnalysisStatus complet depuis Supabase pour un candidat.
 * Permet au candidat de retrouver son profil intact après reconnexion,
 * sans devoir re-uploader son CV ni refaire le questionnaire/test/audio.
 */
export async function loadAnalysisStatus(userId: string): Promise<AnalysisStatus> {
  const empty: AnalysisStatus = { cv: false, questionnaire: false, video: false };
  if (!userId) return empty;

  const profile = await getProfile(userId);
  if (!profile) return empty;

  // CV — JSON sérialisé dans cv_text
  let cvData: CvAnalysisData | undefined;
  if (profile.cv_text) {
    try { cvData = JSON.parse(profile.cv_text); } catch { /* tolère JSON corrompu */ }
  }

  // Vidéo / audio — JSON sérialisé
  let videoData: VideoAnalysisData | undefined;
  if (profile.video_analysis) {
    try { videoData = JSON.parse(profile.video_analysis); } catch { /* idem */ }
  }

  // Questionnaire — champs séparés
  const questionnaireData: QuestionnaireData | undefined =
    profile.management_pref ? {
      managementPref:    profile.management_pref,
      environmentPref:   profile.environment_pref    ?? '',
      collaborationPref: profile.collaboration_pref ?? '',
      rhythmPref:        profile.rhythm_pref         ?? '',
    } : undefined;

  // Assessment — colonnes jsonb (Supabase parse automatiquement)
  const assessmentData: AssessmentData | undefined =
    profile.assessment_personality && profile.assessment_cognitive ? {
      cognitive:   profile.assessment_cognitive,
      personality: profile.assessment_personality,
      completedAt: profile.assessment_completed_at ?? '',
    } : undefined;

  return {
    cv:            !!profile.analysis_cv,
    cvData,
    questionnaire: !!profile.analysis_questionnaire,
    questionnaireData,
    video:         !!profile.analysis_video,
    videoData,
    assessment:    !!profile.analysis_assessment,
    assessmentData,
  };
}

// Retourne tous les candidats ayant au moins complété le CV (pour les recruteurs)
export async function fetchAllCandidates(): Promise<ProfileRow[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('analysis_cv', true)
    .order('updated_at', { ascending: false });
  if (error) { console.error('fetchAllCandidates error:', error.message); return []; }
  return data ?? [];
}

export async function saveCvAnalysis(userId: string, cvData: CvAnalysisData, cvUrl?: string): Promise<void> {
  await upsertProfile(userId, {
    full_name:      cvData.fullName,
    cv_url:         cvUrl ?? '',
    cv_text:        JSON.stringify(cvData),
    cv_analyzed_at: new Date().toISOString(),
    analysis_cv:    true,
  });
}

export async function saveVideoAnalysis(userId: string, videoData: VideoAnalysisData, videoUrl?: string): Promise<void> {
  await upsertProfile(userId, {
    video_url:        videoUrl ?? '',
    video_transcript: videoData.transcript,
    video_analysis:   JSON.stringify(videoData),
    video_analyzed_at: new Date().toISOString(),
    analysis_video:   true,
  });
}

export async function saveQuestionnaire(userId: string, q: QuestionnaireData): Promise<void> {
  await upsertProfile(userId, {
    management_pref:        q.managementPref,
    environment_pref:       q.environmentPref,
    collaboration_pref:     q.collaborationPref,
    rhythm_pref:            q.rhythmPref,
    analysis_questionnaire: true,
  });
}

export async function saveAssessment(userId: string, assessment: AssessmentData, responses: Record<string, number>): Promise<void> {
  await upsertProfile(userId, {
    assessment_cognitive:    assessment.cognitive,
    assessment_personality:  assessment.personality,
    assessment_responses:    responses,
    assessment_completed_at: assessment.completedAt,
    analysis_assessment:     true,
  });
}

export async function savePreferences(userId: string, prefs: {
  location: string; salary: string; contractType: string; availability: string;
}): Promise<void> {
  await upsertProfile(userId, {
    location_pref:      prefs.location,
    salary_expectation: prefs.salary,
    contract_type:      prefs.contractType,
    availability:       prefs.availability,
  });
}

export async function uploadFile(
  bucket: 'cvs' | 'videos',
  userId: string,
  file: File | Blob,
  extension: string,
): Promise<string | null> {
  if (!isConfigured) return null;
  const path = `${userId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) { console.error(`uploadFile (${bucket}) error:`, error.message); return null; }
  return path;
}
