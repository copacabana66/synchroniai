export interface Candidate {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  applied: string;
  score: number;
  status: string;
  statusColor: string;
  statusBg: string;
  skills: number;
  experience: number;
  communication: number;
  environment: number;
  team: number;
  management: number;
  expectations: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface Testimonial {
  name: string;
  title: string;
  location: string;
  quote: string;
  kpi: string;
  accentColor: string;
}

export interface JobOffer {
  id: number;
  company: string;
  role: string;
  location: string;
  score: number;
  logoInitials: string;
  accentColor: string;
  management: string;
  team: string;
  contract: string;
  salary: string;
  status: 'Nouveau' | 'En cours' | 'En attente';
}

export interface AppStep {
  label: string;
  done: boolean;
  active: boolean;
  date: string;
  detail: string;
}

export type PageName =
  | 'landing'
  | 'login'
  | 'pricing'
  | 'register'
  | 'recruteur'
  | 'recruteur-fiche-poste'
  | 'compte-rendu'
  | 'candidat'
  | 'candidat-profil'
  | 'candidat-avancement';

export type UserRole = 'recruteur' | 'candidat' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CvAnalysisData {
  fullName: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  education: string;
  languages: string[];
  experience: string;
  summary: string;
}

export interface VideoAnalysisData {
  transcript: string;
  clarityScore: number;
  structureScore: number;
  fluencyScore: number;
  analysisNotes: string;
  keyThemes: string[];
  communicationStrengths: string[];
  communicationAreas: string[];
}

export interface QuestionnaireData {
  managementPref: string;
  environmentPref: string;
  collaborationPref: string;
  rhythmPref: string;
}

export interface AnalysisStatus {
  cv: boolean;
  cvData?: CvAnalysisData;
  questionnaire: boolean;
  questionnaireData?: QuestionnaireData;
  video: boolean;
  videoData?: VideoAnalysisData;
}

export type RecruteurPlan = 'carte' | 'pro';

export type ManagementStyle =
  | 'bienveillant'
  | 'objectifs'
  | 'directif'
  | 'horizontal'
  | 'autonomie';

export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  expectations: string;
  teamProfile: string;
  managementStyle: ManagementStyle | '';
  managementDetail: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
}
