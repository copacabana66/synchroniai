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
  | 'compte-rendu'
  | 'candidat'
  | 'candidat-profil'
  | 'candidat-avancement';

export type UserRole = 'recruteur' | 'candidat' | null;

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}
