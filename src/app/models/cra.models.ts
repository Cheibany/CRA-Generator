/** Valeur facturée pour une journée : journée complète, demi-journée ou rien. */
export type Facture = 0 | 0.5 | 1;

export interface JourCRA {
  jour: string;
  /** Date affichée, format JJ/MM */
  date: string;
  /** Clé stable, format AAAA-MM-JJ (heure locale) */
  cle: string;
  dateComplete: Date;
  ferie: boolean;
  nomFerie?: string;
  /** Jour de la semaine appartenant au mois précédent ou suivant */
  horsPeriode: boolean;
  facture: Facture;
  natureIntervention: string;
}

export interface SemaineCRA {
  periodeDebut: string;
  periodeFin: string;
  jours: JourCRA[];
}

export interface InfosCRA {
  marche: string;
  prestation: string;
  consultant: string;
  profil: string;
  /** Société prestataire (signataire de gauche et en-tête) */
  societe: string;
  /** Client (signataire de droite) */
  pourClient: string;
  /** Logo personnalisé (data URL PNG ou JPEG). Vide = logo par défaut. */
  logo?: string;
}

export interface SaisieJour {
  facture: Facture;
  natureIntervention: string;
}

/** Saisies d'un mois, indexées par clé de jour (AAAA-MM-JJ). */
export type SaisiesMois = Record<string, SaisieJour>;

/** Clé AAAA-MM-JJ calculée en heure locale (jamais en UTC). */
export function cleDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}

/** Total de jours facturés d'une liste de jours. */
export function totalJours(jours: JourCRA[]): number {
  return jours.reduce((somme, j) => somme + j.facture, 0);
}

/** « 4 » → « 04 », « 4.5 » → « 04,5 » (format de la fiche d'activité). */
export function formaterTotal(total: number): string {
  const entier = Math.floor(total);
  const reste = total - entier;
  return String(entier).padStart(2, '0') + (reste ? ',5' : '');
}

/** « 1 » → « 1 », « 0.5 » → « 0,5 ». */
export function formaterFacture(f: number): string {
  return String(f).replace('.', ',');
}
