import { Injectable } from '@angular/core';
import { JoursFeriesService } from './jours-feries.service';

export interface JourCRA {
  jour: string;
  date: string;
  dateComplete: Date;
  ferie: boolean;
  nomFerie?: string;
  facture: string;              // éditable : '0' ou '1' (ou autre valeur)
  natureIntervention: string;   // éditable librement
}

export interface SemaineCRA {
  periodeDebut: string;
  periodeFin: string;
  jours: JourCRA[];
  nbJoursTravailles: number;
}

@Injectable({ providedIn: 'root' })
export class CraService {

  private nomsJours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  constructor(private joursFeriesService: JoursFeriesService) { }

  genererSemainesDuMois(mois: number, annee: number): SemaineCRA[] {
    const semaines: SemaineCRA[] = [];
    const premierJour = new Date(annee, mois - 1, 1);
    const dernierJour = new Date(annee, mois, 0);

    const jourSemaineDebut = premierJour.getDay();
    const decalageDebut = jourSemaineDebut === 0 ? -6 : 1 - jourSemaineDebut;
    let lundiCourant = new Date(premierJour);
    lundiCourant.setDate(lundiCourant.getDate() + decalageDebut);

    while (lundiCourant <= dernierJour) {
      const jours: JourCRA[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(lundiCourant);
        d.setDate(d.getDate() + i);
        const dansLeMois = d.getMonth() === mois - 1 && d.getFullYear() === annee;
        const ferieInfo = this.joursFeriesService.estFerie(d, d.getFullYear());

        jours.push({
          jour: this.nomsJours[d.getDay()],
          date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          dateComplete: new Date(d),
          ferie: !!ferieInfo || !dansLeMois,
          nomFerie: ferieInfo?.nom ?? (!dansLeMois ? 'Hors période' : undefined),
          facture: (!!ferieInfo || !dansLeMois) ? '0' : '1',
          natureIntervention: ferieInfo ? `Férié - ${ferieInfo.nom}` : ''
        });
      }

      semaines.push({
        periodeDebut: `${jours[0].date}/${jours[0].dateComplete.getFullYear()}`,
        periodeFin: `${jours[4].date}/${jours[4].dateComplete.getFullYear()}`,
        jours,
        nbJoursTravailles: jours.filter(j => !j.ferie).length
      });

      lundiCourant = new Date(lundiCourant);
      lundiCourant.setDate(lundiCourant.getDate() + 7);
    }

    return semaines;
  }
}