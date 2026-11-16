import { Injectable } from '@angular/core';
import { JoursFeriesService } from './jours-feries.service';
import { JourCRA, SemaineCRA, cleDate } from '../models/cra.models';

const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const jjmm = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

@Injectable({ providedIn: 'root' })
export class CraService {

  constructor(private joursFeriesService: JoursFeriesService) { }

  /**
   * Découpe un mois en semaines du lundi au vendredi.
   * Les semaines sans aucun jour ouvré dans le mois sont ignorées
   * (ex. quand le 1er tombe un samedi ou un dimanche).
   */
  genererSemainesDuMois(mois: number, annee: number): SemaineCRA[] {
    const semaines: SemaineCRA[] = [];
    const premierJour = new Date(annee, mois - 1, 1);
    const dernierJour = new Date(annee, mois, 0);

    const jourSemaineDebut = premierJour.getDay();
    const decalageDebut = jourSemaineDebut === 0 ? -6 : 1 - jourSemaineDebut;
    const lundi = new Date(annee, mois - 1, 1 + decalageDebut);

    while (lundi <= dernierJour) {
      const jours: JourCRA[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i);
        const horsPeriode = d.getMonth() !== mois - 1 || d.getFullYear() !== annee;
        const ferieInfo = horsPeriode ? undefined : this.joursFeriesService.estFerie(d);

        jours.push({
          jour: NOMS_JOURS[d.getDay()],
          date: jjmm(d),
          cle: cleDate(d),
          dateComplete: d,
          ferie: !!ferieInfo,
          nomFerie: ferieInfo?.nom,
          horsPeriode,
          facture: ferieInfo || horsPeriode ? 0 : 1,
          natureIntervention: ferieInfo ? `Férié - ${ferieInfo.nom}` : ''
        });
      }

      if (jours.some(j => !j.horsPeriode)) {
        semaines.push({
          periodeDebut: `${jours[0].date}/${jours[0].dateComplete.getFullYear()}`,
          periodeFin: `${jours[4].date}/${jours[4].dateComplete.getFullYear()}`,
          jours
        });
      }

      lundi.setDate(lundi.getDate() + 7);
    }

    return semaines;
  }
}
