import { Injectable } from '@angular/core';

export interface JourFerie {
  date: string; // format YYYY-MM-DD
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class JoursFeriesService {

  // Jours fériés fixes (civils) - mois/jour
  private feriesFixes = [
    { mois: 1, jour: 1, nom: 'Nouvel An' },
    { mois: 1, jour: 11, nom: 'Manifeste de l\'Indépendance' },
    { mois: 5, jour: 1, nom: 'Fête du Travail' },
    { mois: 7, jour: 30, nom: 'Fête du Trône' },
    { mois: 8, jour: 14, nom: 'Allégeance Oued Eddahab' },
    { mois: 8, jour: 20, nom: 'Révolution du Roi et du Peuple' },
    { mois: 8, jour: 21, nom: 'Fête de la Jeunesse' },
    { mois: 11, jour: 6, nom: 'Marche Verte' },
    { mois: 11, jour: 18, nom: 'Fête de l\'Indépendance' },
  ];

  // Jours fériés religieux (mobiles) - à mettre à jour chaque année
  private feriesMobiles: JourFerie[] = [
    // 2026
    { date: '2026-01-17', nom: '1er Moharram' },
    { date: '2026-03-20', nom: 'Aid Al Fitr (1er jour)' },
    { date: '2026-03-21', nom: 'Aid Al Fitr (2e jour)' },
    { date: '2026-05-27', nom: 'Aid Al Adha (1er jour)' },
    { date: '2026-05-28', nom: 'Aid Al Adha (2e jour)' },
    { date: '2026-08-26', nom: 'Fête Al Mawlid' },
  ];

  getJoursFeries(annee: number): JourFerie[] {
    const fixes = this.feriesFixes.map(f => ({
      date: `${annee}-${String(f.mois).padStart(2, '0')}-${String(f.jour).padStart(2, '0')}`,
      nom: f.nom
    }));
    const mobiles = this.feriesMobiles.filter(f => f.date.startsWith(`${annee}-`));
    return [...fixes, ...mobiles];
  }

  estFerie(date: Date, annee: number): JourFerie | undefined {
    const dateStr = date.toISOString().split('T')[0];
    return this.getJoursFeries(annee).find(f => f.date === dateStr);
  }
}