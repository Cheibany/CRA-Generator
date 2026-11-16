import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoGrowDirective } from '../../directives/auto-grow.directive';
import {
  Facture, InfosCRA, JourCRA, SaisiesMois, SemaineCRA,
  cleDate, formaterFacture, formaterTotal, totalJours
} from '../../models/cra.models';
import { CraService } from '../../services/cra.service';
import { DocxGeneratorService } from '../../services/docx-generator.service';
import { JoursFeriesService } from '../../services/jours-feries.service';
import { StockageService } from '../../services/stockage.service';

interface Toast {
  message: string;
  type: 'succes' | 'erreur' | 'info';
}

const INFOS_PAR_DEFAUT: InfosCRA = {
  marche: 'Marché n° MAR2025 00058',
  prestation: 'PRESTATION REGIE DE RESSOURCES JUNIOR EN PRE-RECRUTEMENT',
  consultant: 'Cire SALL',
  profil: 'Développeur Full-Stack',
  societe: '01 Talent',
  pourClient: 'Crédit Agricole',
  logo: ''
};

const TAILLE_MAX_LOGO = 300 * 1024; // 300 Ko
const ANNEE_MIN = 2000;
const ANNEE_MAX = 2100;

@Component({
  selector: 'app-cra-form',
  templateUrl: './cra-form.component.html',
  styleUrls: ['./cra-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, AutoGrowDirective]
})
export class CraFormComponent implements OnInit, OnDestroy {

  mois = new Date().getMonth() + 1;
  annee = new Date().getFullYear();
  /** Dernière période valide réellement affichée. */
  private periode = { mois: 0, annee: 0 };

  semaines: SemaineCRA[] = [];
  semaineActive = 0;
  /** Sens de la dernière navigation, pour l'animation de glissement. */
  direction: 'avant' | 'arriere' = 'avant';

  showPreview = true;
  parametresOuverts = false;
  isGenerating = false;
  succes = false;
  toast: Toast | null = null;

  infos: InfosCRA = { ...INFOS_PAR_DEFAUT };

  readonly moisListe = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ].map((nom, i) => ({ valeur: i + 1, nom }));

  readonly formaterFacture = formaterFacture;
  readonly formaterTotal = formaterTotal;

  private toastTimer?: ReturnType<typeof setTimeout>;
  private succesTimer?: ReturnType<typeof setTimeout>;
  private touchStartX = 0;

  constructor(
    private craService: CraService,
    private docxGeneratorService: DocxGeneratorService,
    private joursFeriesService: JoursFeriesService,
    private stockage: StockageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.infos = { ...INFOS_PAR_DEFAUT, ...this.stockage.chargerInfos() };
    this.chargerPeriode();
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
    clearTimeout(this.succesTimer);
  }

  // ----- Période -----

  get anneeValide(): boolean {
    return Number.isInteger(this.annee) && this.annee >= ANNEE_MIN && this.annee <= ANNEE_MAX;
  }

  get nomMois(): string {
    return this.moisListe[this.mois - 1]?.nom ?? '';
  }

  /** Les fêtes religieuses de l'année affichée sont-elles renseignées ? */
  get feriesMobilesConnus(): boolean {
    return this.joursFeriesService.feriesMobilesConnus(this.periode.annee);
  }

  /** (Re)génère les semaines si la période a changé, en restaurant les saisies enregistrées. */
  chargerPeriode(forcer = false): void {
    if (!this.anneeValide) return;
    if (!forcer && this.mois === this.periode.mois && this.annee === this.periode.annee) return;

    this.semaines = this.craService.genererSemainesDuMois(this.mois, this.annee);
    this.periode = { mois: this.mois, annee: this.annee };

    const saisies = this.stockage.chargerSaisies(this.mois, this.annee);
    if (saisies) {
      for (const j of this.joursDuMois) {
        const s = saisies[j.cle];
        if (!s) continue;
        if (s.facture === 0 || s.facture === 0.5 || s.facture === 1) j.facture = s.facture;
        if (typeof s.natureIntervention === 'string') j.natureIntervention = s.natureIntervention;
      }
    }

    // On ouvre sur la semaine en cours quand on consulte le mois courant
    const aujourdhui = cleDate(new Date());
    const index = this.semaines.findIndex(s => s.jours.some(j => j.cle === aujourdhui));
    this.direction = 'avant';
    this.semaineActive = Math.max(index, 0);
  }

  moisVoisin(delta: number): void {
    if (!this.anneeValide) return;
    const d = new Date(this.annee, this.mois - 1 + delta, 1);
    this.mois = d.getMonth() + 1;
    this.annee = d.getFullYear();
    this.chargerPeriode();
  }

  // ----- Totaux -----

  private get joursDuMois(): JourCRA[] {
    return this.semaines.flatMap(s => s.jours).filter(j => !j.horsPeriode);
  }

  totalSemaine(semaine: SemaineCRA): number {
    return totalJours(semaine.jours);
  }

  joursOuvresSemaine(semaine: SemaineCRA): number {
    return semaine.jours.filter(j => !j.horsPeriode).length;
  }

  get totalMois(): number {
    return totalJours(this.joursDuMois);
  }

  /** Jours ouvrés du mois, hors jours fériés. */
  get joursOuvresMois(): number {
    return this.joursDuMois.filter(j => !j.ferie).length;
  }

  get nbFeriesMois(): number {
    return this.joursDuMois.filter(j => j.ferie).length;
  }

  /** Avancement 0 → 1 pour l'anneau de progression. */
  get progressionMois(): number {
    return this.joursOuvresMois ? Math.min(this.totalMois / this.joursOuvresMois, 1) : 0;
  }

  // ----- Saisie -----

  cyclerFacture(j: JourCRA): void {
    const suivant: Record<string, Facture> = { '1': 0.5, '0.5': 0, '0': 1 };
    j.facture = suivant[String(j.facture)];
    this.sauverSaisies();
  }

  /** Recopie l'intervention sur les jours suivants de la semaine encore vides. */
  dupliquerSurSemaine(semaine: SemaineCRA, source: JourCRA): void {
    const index = semaine.jours.indexOf(source);
    const cibles = semaine.jours
      .slice(index + 1)
      .filter(j => !j.horsPeriode && !j.ferie && !j.natureIntervention.trim());

    if (!cibles.length) {
      this.afficherToast('Aucun jour vide à remplir dans la suite de la semaine.', 'info');
      return;
    }
    cibles.forEach(j => j.natureIntervention = source.natureIntervention);
    // Recrée les lignes pour que les zones de texte se redimensionnent
    semaine.jours = [...semaine.jours];
    this.sauverSaisies();
    this.afficherToast(`Intervention recopiée sur ${cibles.length} jour${cibles.length > 1 ? 's' : ''}.`, 'succes');
  }

  peutDupliquer(semaine: SemaineCRA, j: JourCRA): boolean {
    return !!j.natureIntervention.trim() && semaine.jours.indexOf(j) < semaine.jours.length - 1;
  }

  sauverSaisies(): void {
    const saisies: SaisiesMois = {};
    for (const j of this.joursDuMois) {
      saisies[j.cle] = { facture: j.facture, natureIntervention: j.natureIntervention };
    }
    this.stockage.sauverSaisies(this.periode.mois, this.periode.annee, saisies);
  }

  sauverInfos(): void {
    this.stockage.sauverInfos(this.infos);
  }

  reinitialiserMois(): void {
    if (!confirm(`Effacer toutes les saisies de ${this.nomMois} ${this.periode.annee} ?`)) return;
    this.stockage.effacerSaisies(this.periode.mois, this.periode.annee);
    this.chargerPeriode(true);
    this.afficherToast('Le mois a été réinitialisé.', 'info');
  }

  // ----- Logo -----

  onLogoChoisi(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';
    if (!fichier) return;

    if (!['image/png', 'image/jpeg'].includes(fichier.type)) {
      this.afficherToast('Format non pris en charge : choisissez un logo PNG ou JPEG.', 'erreur');
      return;
    }
    if (fichier.size > TAILLE_MAX_LOGO) {
      this.afficherToast('Logo trop lourd (300 Ko maximum).', 'erreur');
      return;
    }

    const lecteur = new FileReader();
    lecteur.onload = () => {
      this.infos.logo = lecteur.result as string;
      if (!this.stockage.sauverInfos(this.infos)) {
        this.afficherToast('Logo appliqué, mais il n\'a pas pu être enregistré dans le navigateur.', 'info');
      }
      this.cdr.markForCheck();
    };
    lecteur.onerror = () => {
      this.afficherToast('Impossible de lire ce fichier.', 'erreur');
      this.cdr.markForCheck();
    };
    lecteur.readAsDataURL(fichier);
  }

  supprimerLogo(): void {
    this.infos.logo = '';
    this.sauverInfos();
  }

  // ----- Génération -----

  async genererCRA(): Promise<void> {
    if (this.isGenerating) return;
    if (!this.anneeValide) {
      this.afficherToast(`Saisissez une année entre ${ANNEE_MIN} et ${ANNEE_MAX}.`, 'erreur');
      return;
    }
    if (!this.infos.consultant.trim()) {
      this.afficherToast('Renseignez le nom du consultant avant de générer.', 'erreur');
      return;
    }

    this.chargerPeriode();
    this.isGenerating = true;
    this.succes = false;
    try {
      await this.docxGeneratorService.genererDocx(this.infos, this.semaines, this.periode.mois, this.periode.annee);
      this.succes = true;
      clearTimeout(this.succesTimer);
      this.succesTimer = setTimeout(() => { this.succes = false; this.cdr.markForCheck(); }, 2600);
      this.afficherToast('Votre CRA a été généré et téléchargé.', 'succes');
    } catch (erreur) {
      console.error(erreur);
      this.afficherToast('La génération a échoué. Vérifiez le logo puis réessayez.', 'erreur');
    } finally {
      this.isGenerating = false;
      this.cdr.markForCheck();
    }
  }

  // ----- Navigation entre semaines -----

  get semaineCourante(): SemaineCRA | null {
    return this.semaines[this.semaineActive] ?? null;
  }

  allerASemaine(index: number): void {
    if (index < 0 || index >= this.semaines.length || index === this.semaineActive) return;
    this.direction = index > this.semaineActive ? 'avant' : 'arriere';
    this.semaineActive = index;
  }

  semaineSuivante(): void {
    this.allerASemaine(this.semaineActive + 1);
  }

  semainePrecedente(): void {
    this.allerASemaine(this.semaineActive - 1);
  }

  /** Libellé court d'un onglet : « 02 – 06 ». */
  libelleSemaine(semaine: SemaineCRA): string {
    const jours = semaine.jours.filter(j => !j.horsPeriode);
    const jour = (j: JourCRA) => j.date.slice(0, 2);
    const debut = jour(jours[0]);
    const fin = jour(jours[jours.length - 1]);
    return debut === fin ? debut : `${debut} – ${fin}`;
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    // On ne change pas de semaine pendant la saisie ou le défilement du tableau
    if ((event.target as HTMLElement).closest('textarea, .apercu-scroll')) return;
    const deltaX = event.changedTouches[0].screenX - this.touchStartX;
    if (deltaX > 50) this.semainePrecedente();
    else if (deltaX < -50) this.semaineSuivante();
  }

  // ----- Notifications -----

  afficherToast(message: string, type: Toast['type']): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, 4000);
  }
}
