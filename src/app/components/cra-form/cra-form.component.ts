import { Component, OnInit } from '@angular/core';
import { CraService, SemaineCRA, JourCRA } from '../../services/cra.service';
import { DocxGeneratorService, InfosCRA } from '../../services/docx-generator.service';

@Component({
    selector: 'app-cra-form',
    templateUrl: './cra-form.component.html',
    styleUrls: ['./cra-form.component.scss'],
    standalone: false
})
export class CraFormComponent implements OnInit {

  mois: number = new Date().getMonth() + 1;
  annee: number = new Date().getFullYear();
  private dernierMoisGenere = 0;
  private dernierAnneeGenere = 0;
  semaines: SemaineCRA[] = [];
  showPreview = true;
  isGenerating = false;

  infos: InfosCRA = {
    marche: 'Marché n° MAR2025 00058',
    prestation: 'PRESTATION REGIE DE RESSOURCES JUNIOR EN PRE-RECRUTEMENT',
    consultant: 'Cire SALL',
    profil: 'Développeur Full-Stack',
    pourClient: 'Crédit Agricole'
  };

  mois_liste = [
    { valeur: 1, nom: 'Janvier' }, { valeur: 2, nom: 'Février' }, { valeur: 3, nom: 'Mars' },
    { valeur: 4, nom: 'Avril' }, { valeur: 5, nom: 'Mai' }, { valeur: 6, nom: 'Juin' },
    { valeur: 7, nom: 'Juillet' }, { valeur: 8, nom: 'Août' }, { valeur: 9, nom: 'Septembre' },
    { valeur: 10, nom: 'Octobre' }, { valeur: 11, nom: 'Novembre' }, { valeur: 12, nom: 'Décembre' }
  ];

  constructor(
    private craService: CraService,
    private docxGeneratorService: DocxGeneratorService
  ) {}

  ngOnInit(): void {
    this.genererApercu();
  }

 genererApercu(): void {
  if (this.mois !== this.dernierMoisGenere || this.annee !== this.dernierAnneeGenere) {
    this.semaines = this.craService.genererSemainesDuMois(this.mois, this.annee);
    this.dernierMoisGenere = this.mois;
    this.dernierAnneeGenere = this.annee;
    this.semaineActive = 0; // ajoute cette ligne
  }
}

  toggleFacture(j: JourCRA): void {
    j.facture = j.facture === '1' ? '0' : '1';
  }

  getNbJoursTravailles(semaine: SemaineCRA): number {
    return semaine.jours.filter(j => j.facture === '1').length;
  }

  autoGrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  async genererCRA(): Promise<void> {
    this.genererApercu();
    this.isGenerating = true;
    try {
      await this.docxGeneratorService.genererDocx(this.infos, this.semaines, this.mois, this.annee);
    } finally {
      this.isGenerating = false;
    }
  }

  semaineActive = 0;

get semaineCourante(): SemaineCRA | null {
  return this.semaines[this.semaineActive] ?? null;
}

semaineSuivante(): void {
  if (this.semaineActive < this.semaines.length - 1) this.semaineActive++;
}

semainePrecedente(): void {
  if (this.semaineActive > 0) this.semaineActive--;
}

allerASemaine(index: number): void {
  this.semaineActive = index;
}

private touchStartX = 0;

onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent): void {
  const deltaX = event.changedTouches[0].screenX - this.touchStartX;
  if (deltaX > 50) this.semainePrecedente();
  else if (deltaX < -50) this.semaineSuivante();
}
}