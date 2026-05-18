// ============================================================
// Tests cognitif + personnalité — questions réelles validées
// Personnalité : Big Five / IPIP-NEO (domaine public, scientifiquement validé)
// Cognitif    : raisonnement logique, verbal, numérique
// ============================================================

export type BigFiveDimension = 'O' | 'C' | 'E' | 'A' | 'N';
// O = Ouverture, C = Conscience, E = Extraversion, A = Agréabilité, N = Stabilité émotionnelle (inversée de Névrosisme)

export interface PersonalityItem {
  id: string;
  text: string;
  dimension: BigFiveDimension;
  reverse: boolean;            // true = score inversé (6 - réponse)
}

// 25 items — 5 par dimension — issus du International Personality Item Pool (IPIP, domaine public)
// Adaptés en français. Source : https://ipip.ori.org/
export const PERSONALITY_ITEMS: PersonalityItem[] = [
  // Ouverture (O)
  { id: 'O1', text: "J'ai une imagination débordante",                             dimension: 'O', reverse: false },
  { id: 'O2', text: "Je suis curieux(se) de découvrir de nouvelles idées",         dimension: 'O', reverse: false },
  { id: 'O3', text: "J'apprécie réfléchir à des concepts abstraits",               dimension: 'O', reverse: false },
  { id: 'O4', text: "Je préfère la routine aux nouveautés",                        dimension: 'O', reverse: true  },
  { id: 'O5', text: "Je m'intéresse à l'art, à la musique ou à la littérature",    dimension: 'O', reverse: false },

  // Conscience (C)
  { id: 'C1', text: "Je suis toujours bien préparé(e)",                            dimension: 'C', reverse: false },
  { id: 'C2', text: "Je respecte les échéances et tiens mes engagements",          dimension: 'C', reverse: false },
  { id: 'C3', text: "Je laisse souvent les choses à la dernière minute",           dimension: 'C', reverse: true  },
  { id: 'C4', text: "Je fais attention aux détails dans mon travail",              dimension: 'C', reverse: false },
  { id: 'C5', text: "Je suis désorganisé(e) dans mon quotidien",                   dimension: 'C', reverse: true  },

  // Extraversion (E)
  { id: 'E1', text: "Je me sens à l'aise au milieu de personnes que je ne connais pas", dimension: 'E', reverse: false },
  { id: 'E2', text: "Je prends l'initiative dans les conversations de groupe",     dimension: 'E', reverse: false },
  { id: 'E3', text: "Je préfère travailler seul(e) plutôt qu'en équipe",           dimension: 'E', reverse: true  },
  { id: 'E4', text: "Je suis énergique et dynamique",                              dimension: 'E', reverse: false },
  { id: 'E5', text: "Je reste plutôt en retrait dans les nouveaux contextes",      dimension: 'E', reverse: true  },

  // Agréabilité (A)
  { id: 'A1', text: "Je m'intéresse sincèrement aux autres",                       dimension: 'A', reverse: false },
  { id: 'A2', text: "Je prends le temps d'écouter les problèmes des collègues",    dimension: 'A', reverse: false },
  { id: 'A3', text: "Je peux être critique ou tranchant(e) avec les autres",       dimension: 'A', reverse: true  },
  { id: 'A4', text: "Je fais facilement confiance aux personnes que je rencontre", dimension: 'A', reverse: false },
  { id: 'A5', text: "Je trouve qu'il est important de coopérer",                   dimension: 'A', reverse: false },

  // Stabilité émotionnelle (N inversé)
  { id: 'N1', text: "Je reste calme dans les situations stressantes",              dimension: 'N', reverse: false },
  { id: 'N2', text: "Je m'inquiète facilement",                                    dimension: 'N', reverse: true  },
  { id: 'N3', text: "Je gère bien la pression et les imprévus",                    dimension: 'N', reverse: false },
  { id: 'N4', text: "Je suis souvent tendu(e) ou anxieux(se)",                     dimension: 'N', reverse: true  },
  { id: 'N5', text: "Je récupère vite après un échec",                             dimension: 'N', reverse: false },
];

export const LIKERT_LABELS = [
  '1 — Pas du tout d\'accord',
  '2 — Plutôt pas d\'accord',
  '3 — Neutre',
  '4 — Plutôt d\'accord',
  '5 — Tout à fait d\'accord',
];

// ============================================================
// Test cognitif — 10 items chronométrés (90s par item max)
// Couvre : logique, verbal, numérique, mémoire de travail
// ============================================================

export type CognitiveCategory = 'logique' | 'verbal' | 'numerique' | 'attention';

export interface CognitiveItem {
  id: string;
  category: CognitiveCategory;
  question: string;
  choices: string[];
  correctIndex: number;
  timeLimit: number; // secondes
}

export const COGNITIVE_ITEMS: CognitiveItem[] = [
  {
    id: 'L1', category: 'logique',
    question: "Complétez la suite : 2, 6, 12, 20, 30, ?",
    choices: ['36', '40', '42', '44'],
    correctIndex: 2, // 42 (différences +4, +6, +8, +10, +12)
    timeLimit: 60,
  },
  {
    id: 'L2', category: 'logique',
    question: "Tous les chats sont des mammifères. Aucun mammifère n'est un reptile. Donc :",
    choices: [
      "Aucun chat n'est un reptile",
      "Certains chats sont des reptiles",
      "Les reptiles sont des chats",
      "On ne peut rien conclure",
    ],
    correctIndex: 0,
    timeLimit: 60,
  },
  {
    id: 'V1', category: 'verbal',
    question: "Quel mot est l'antonyme de PROLIXE ?",
    choices: ['Bavard', 'Concis', 'Verbeux', 'Long'],
    correctIndex: 1,
    timeLimit: 45,
  },
  {
    id: 'V2', category: 'verbal',
    question: "MÉDECIN est à HÔPITAL ce que PROFESSEUR est à :",
    choices: ['Élève', 'Cours', 'Livre', 'École'],
    correctIndex: 3,
    timeLimit: 45,
  },
  {
    id: 'N1', category: 'numerique',
    question: "Si un produit coûtait 80€ et augmente de 25%, son nouveau prix est :",
    choices: ['100€', '105€', '120€', '125€'],
    correctIndex: 0,
    timeLimit: 60,
  },
  {
    id: 'N2', category: 'numerique',
    question: "Trois ouvriers réalisent un travail en 12 jours. Combien de temps mettront 4 ouvriers (même rythme) ?",
    choices: ['8 jours', '9 jours', '10 jours', '16 jours'],
    correctIndex: 1,
    timeLimit: 90,
  },
  {
    id: 'L3', category: 'logique',
    question: "Quelle figure complète la suite : ▲ ▲▲ ▲▲▲ ?",
    choices: ['▲▲', '▲▲▲▲', '▲▲▲▲▲', '◯◯◯◯'],
    correctIndex: 1,
    timeLimit: 45,
  },
  {
    id: 'A1', category: 'attention',
    question: "Combien de fois la lettre A apparaît-elle ? « BANANA-AVOCADO-PAPAYA »",
    choices: ['6', '7', '8', '9'],
    correctIndex: 2, // B-A-N-A-N-A-A-V-O-C-A-D-O-P-A-P-A-Y-A = 8 A
    timeLimit: 45,
  },
  {
    id: 'V3', category: 'verbal',
    question: "Quel mot ne fait PAS partie de la liste ?",
    choices: ['Saxophone', 'Trompette', 'Violon', 'Clarinette'],
    correctIndex: 2, // les autres sont à vent
    timeLimit: 45,
  },
  {
    id: 'N3', category: 'numerique',
    question: "Sur 200 candidats, 60% sont retenus. Combien de candidats ne sont pas retenus ?",
    choices: ['60', '80', '100', '120'],
    correctIndex: 1,
    timeLimit: 60,
  },
];

// ============================================================
// Mapping Big Five → archétype comportemental
// ============================================================
export interface BigFiveScores {
  O: number; C: number; E: number; A: number; N: number; // chaque score = moyenne 1-5
}

export interface BehavioralProfile {
  type: string;
  description: string;
  strengths: string[];
  bestEnvironments: string[];
}

export function deriveBehavioralType(s: BigFiveScores): BehavioralProfile {
  const high = (v: number) => v >= 3.5;
  const low  = (v: number) => v <= 2.5;

  // Heuristique : on identifie les 2 dimensions dominantes
  if (high(s.O) && high(s.E))                          return PROFILES.innovateur;
  if (high(s.C) && high(s.N))                          return PROFILES.strategiste;
  if (high(s.A) && high(s.E))                          return PROFILES.fédérateur;
  if (high(s.C) && low(s.E))                           return PROFILES.analyste;
  if (high(s.O) && high(s.C))                          return PROFILES.architecte;
  if (high(s.E) && high(s.C))                          return PROFILES.leader;
  if (high(s.A) && high(s.N))                          return PROFILES.mediateur;
  if (high(s.O) && low(s.E))                           return PROFILES.contemplatif;
  return PROFILES.equilibre;
}

const PROFILES: Record<string, BehavioralProfile> = {
  innovateur: {
    type: 'Innovateur',
    description: 'Curieux, créatif et énergique. Vous voyez les opportunités là où d\'autres voient des problèmes.',
    strengths: ['Créativité', 'Vision long-terme', 'Communication', 'Entrepreneuriat'],
    bestEnvironments: ['Startup', 'R&D', 'Marketing', 'Innovation produit'],
  },
  strategiste: {
    type: 'Stratège',
    description: 'Méthodique et serein face à la pression. Vous excellez dans la planification et l\'exécution rigoureuse.',
    strengths: ['Planification', 'Gestion de crise', 'Fiabilité', 'Vision globale'],
    bestEnvironments: ['Direction d\'opérations', 'Gestion de projet', 'Conseil', 'Finance'],
  },
  fédérateur: {
    type: 'Fédérateur',
    description: 'Charismatique et empathique. Vous rassemblez les équipes autour d\'objectifs communs.',
    strengths: ['Leadership', 'Empathie', 'Communication', 'Cohésion d\'équipe'],
    bestEnvironments: ['Management', 'RH', 'Commercial', 'Relation client'],
  },
  analyste: {
    type: 'Analyste',
    description: 'Précis, concentré et exigeant. Vous excellez sur des tâches techniques complexes.',
    strengths: ['Rigueur', 'Concentration', 'Résolution de problèmes', 'Expertise technique'],
    bestEnvironments: ['Data', 'Recherche', 'Développement', 'Audit', 'Finance technique'],
  },
  architecte: {
    type: 'Architecte',
    description: 'Visionnaire et structuré. Vous concevez des systèmes ambitieux et savez les exécuter.',
    strengths: ['Vision stratégique', 'Structure', 'Innovation', 'Excellence'],
    bestEnvironments: ['Direction technique', 'Conseil stratégique', 'Architecture SI', 'Product Management'],
  },
  leader: {
    type: 'Leader',
    description: 'Affirmé, organisé et orienté résultats. Vous prenez les décisions et entraînez les autres.',
    strengths: ['Décision', 'Organisation', 'Influence', 'Performance'],
    bestEnvironments: ['Direction générale', 'Management d\'équipe', 'Commerce B2B', 'Opérations'],
  },
  mediateur: {
    type: 'Médiateur',
    description: 'Empathique et attentif aux dynamiques humaines. Vous créez de l\'harmonie dans les équipes.',
    strengths: ['Écoute', 'Diplomatie', 'Sensibilité', 'Conseil humain'],
    bestEnvironments: ['Coaching', 'RH', 'Médiation', 'Accompagnement'],
  },
  contemplatif: {
    type: 'Contemplatif',
    description: 'Réflexif, créatif et indépendant. Vous produisez vos meilleurs résultats en autonomie.',
    strengths: ['Créativité', 'Profondeur d\'analyse', 'Autonomie', 'Originalité'],
    bestEnvironments: ['Recherche', 'Écriture', 'Design', 'Freelance', 'R&D'],
  },
  equilibre: {
    type: 'Équilibré',
    description: 'Profil polyvalent avec des forces réparties sur plusieurs dimensions. Vous vous adaptez à de nombreux contextes.',
    strengths: ['Adaptabilité', 'Polyvalence', 'Équilibre', 'Apprentissage'],
    bestEnvironments: ['Postes transverses', 'Conseil', 'Management généraliste', 'Communication'],
  },
};
