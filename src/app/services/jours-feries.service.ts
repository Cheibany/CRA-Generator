import { Injectable } from '@angular/core';
import { cleDate } from '../models/cra.models';

export interface JourFerie {
  date: string; // format AAAA-MM-JJ
  nom: string;
}

interface FerieFixe {
  mois: number;
  jour: number;
  nom: string;
  /** Première année d'application (incluse). */
  depuis?: number;
}

/** Jours fériés du Maroc. */
@Injectable({ providedIn: 'root' })
export class JoursFeriesService {

  private readonly feriesFixes: FerieFixe[] = [
    { mois: 1, jour: 1, nom: 'Nouvel An' },
    { mois: 1, jour: 11, nom: 'Manifeste de l\'Indépendance' },
    { mois: 1, jour: 14, nom: 'Nouvel An amazigh', depuis: 2024 },
    { mois: 5, jour: 1, nom: 'Fête du Travail' },
    { mois: 7, jour: 30, nom: 'Fête du Trône' },
    { mois: 8, jour: 14, nom: 'Allégeance Oued Eddahab' },
    { mois: 8, jour: 20, nom: 'Révolution du Roi et du Peuple' },
    { mois: 8, jour: 21, nom: 'Fête de la Jeunesse' },
    { mois: 10, jour: 31, nom: 'Aïd Al Wahda', depuis: 2026 },
    { mois: 11, jour: 6, nom: 'Marche Verte' },
    { mois: 11, jour: 18, nom: 'Fête de l\'Indépendance' },
  ];

  /**
   * Jours fériés religieux (mobiles).
   * Les dates dépendent de l'observation lunaire : elles sont prévisionnelles
   * et peuvent varier d'un jour. À compléter chaque année ; l'utilisateur peut
   * toujours corriger un jour directement dans l'aperçu.
   */
  private readonly feriesMobiles: JourFerie[] = [
    // 2025
    { date: '2025-03-31', nom: 'Aïd Al Fitr (1er jour)' },
    { date: '2025-04-01', nom: 'Aïd Al Fitr (2e jour)' },
    { date: '2025-06-07', nom: 'Aïd Al Adha (1er jour)' },
    { date: '2025-06-08', nom: 'Aïd Al Adha (2e jour)' },
    { date: '2025-06-27', nom: '1er Moharram' },
    { date: '2025-09-05', nom: 'Aïd Al Mawlid (1er jour)' },
    { date: '2025-09-06', nom: 'Aïd Al Mawlid (2e jour)' },
    // 2026
    { date: '2026-03-20', nom: 'Aïd Al Fitr (1er jour)' },
    { date: '2026-03-21', nom: 'Aïd Al Fitr (2e jour)' },
    { date: '2026-05-27', nom: 'Aïd Al Adha (1er jour)' },
    { date: '2026-05-28', nom: 'Aïd Al Adha (2e jour)' },
    { date: '2026-06-17', nom: '1er Moharram' },
    { date: '2026-08-26', nom: 'Aïd Al Mawlid (1er jour)' },
    { date: '2026-08-27', nom: 'Aïd Al Mawlid (2e jour)' },
    // 2027
    { date: '2027-03-10', nom: 'Aïd Al Fitr (1er jour)' },
    { date: '2027-03-11', nom: 'Aïd Al Fitr (2e jour)' },
    { date: '2027-05-17', nom: 'Aïd Al Adha (1er jour)' },
    { date: '2027-05-18', nom: 'Aïd Al Adha (2e jour)' },
    { date: '2027-06-07', nom: '1er Moharram' },
    { date: '2027-08-15', nom: 'Aïd Al Mawlid (1er jour)' },
    { date: '2027-08-16', nom: 'Aïd Al Mawlid (2e jour)' },
  ];

  getJoursFeries(annee: number): JourFerie[] {
    const fixes = this.feriesFixes
      .filter(f => !f.depuis || annee >= f.depuis)
      .map(f => ({
        date: `${annee}-${String(f.mois).padStart(2, '0')}-${String(f.jour).padStart(2, '0')}`,
        nom: f.nom
      }));
    const mobiles = this.feriesMobiles.filter(f => f.date.startsWith(`${annee}-`));
    return [...fixes, ...mobiles];
  }

  /** Vrai si les fêtes religieuses de cette année sont renseignées. */
  feriesMobilesConnus(annee: number): boolean {
    return this.feriesMobiles.some(f => f.date.startsWith(`${annee}-`));
  }

  estFerie(date: Date): JourFerie | undefined {
    const cle = cleDate(date);
    return this.getJoursFeries(date.getFullYear()).find(f => f.date === cle);
  }
}
