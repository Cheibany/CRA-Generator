import { Injectable } from '@angular/core';
import { InfosCRA, SemaineCRA } from '../models/cra.models';

@Injectable({ providedIn: 'root' })
export class DocxGeneratorService {

  nomFichier(consultant: string, mois: number, annee: number): string {
    const nom = consultant.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'Consultant';
    return `CRA_${nom}_${String(mois).padStart(2, '0')}_${annee}.docx`;
  }

  /** Génère la fiche d'activité et lance son téléchargement. */
  async genererDocx(infos: InfosCRA, semaines: SemaineCRA[], mois: number, annee: number): Promise<void> {
    // `docx` est chargé à la demande pour alléger le démarrage de l'application
    const { DocxBuilder } = await import('./docx-builder');
    const blob = await new DocxBuilder().versBlob(infos, semaines);
    this.telecharger(blob, this.nomFichier(infos.consultant, mois, annee));
  }

  private telecharger(blob: Blob, nom: string): void {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
