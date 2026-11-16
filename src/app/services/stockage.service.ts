import { Injectable } from '@angular/core';
import { InfosCRA, SaisiesMois } from '../models/cra.models';

const CLE_INFOS = 'cra.infos';
const cleMois = (mois: number, annee: number) =>
  `cra.saisies.${annee}-${String(mois).padStart(2, '0')}`;

/** Persistance locale (navigateur) des paramètres et des saisies mensuelles. */
@Injectable({ providedIn: 'root' })
export class StockageService {

  chargerInfos(): Partial<InfosCRA> | null {
    return this.lire<Partial<InfosCRA>>(CLE_INFOS);
  }

  /** Renvoie false si l'écriture a échoué (quota dépassé, stockage désactivé…). */
  sauverInfos(infos: InfosCRA): boolean {
    return this.ecrire(CLE_INFOS, infos);
  }

  chargerSaisies(mois: number, annee: number): SaisiesMois | null {
    return this.lire<SaisiesMois>(cleMois(mois, annee));
  }

  sauverSaisies(mois: number, annee: number, saisies: SaisiesMois): boolean {
    return this.ecrire(cleMois(mois, annee), saisies);
  }

  effacerSaisies(mois: number, annee: number): void {
    try {
      localStorage.removeItem(cleMois(mois, annee));
    } catch { /* stockage indisponible */ }
  }

  private lire<T>(cle: string): T | null {
    try {
      const brut = localStorage.getItem(cle);
      const valeur = brut ? JSON.parse(brut) : null;
      return valeur && typeof valeur === 'object' ? valeur as T : null;
    } catch {
      return null;
    }
  }

  private ecrire(cle: string, valeur: unknown): boolean {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
      return true;
    } catch {
      return false;
    }
  }
}
