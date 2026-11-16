import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CraFormComponent } from './cra-form.component';
import { DocxGeneratorService } from '../../services/docx-generator.service';

describe('CraFormComponent', () => {
  let fixture: ComponentFixture<CraFormComponent>;
  let component: CraFormComponent;
  const genererDocx = vi.fn();

  function creer(): void {
    fixture = TestBed.createComponent(CraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    genererDocx.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [CraFormComponent],
      providers: [{ provide: DocxGeneratorService, useValue: { genererDocx } }]
    });
    creer();
    component.mois = 11;
    component.annee = 2026;
    component.chargerPeriode();
  });

  it('affiche les semaines du mois choisi', () => {
    expect(component.semaines.length).toBe(5);
    expect(component.joursOuvresMois).toBe(19); // 21 jours ouvrés - 2 fériés (6 et 18 novembre)
    expect(component.totalMois).toBe(19);
  });

  it('fait défiler la valeur facturée : 1 → 0,5 → 0 → 1', () => {
    const jour = component.semaines[0].jours[0];
    component.cyclerFacture(jour);
    expect(jour.facture).toBe(0.5);
    expect(component.totalMois).toBe(18.5);
    component.cyclerFacture(jour);
    expect(jour.facture).toBe(0);
    component.cyclerFacture(jour);
    expect(jour.facture).toBe(1);
  });

  it('restaure les saisies après rechargement', () => {
    const jour = component.semaines[0].jours[0];
    jour.natureIntervention = 'Développement du module X';
    component.cyclerFacture(jour);
    component.infos.consultant = 'Test Consultant';
    component.sauverInfos();

    creer();
    component.mois = 11;
    component.annee = 2026;
    component.chargerPeriode();

    expect(component.infos.consultant).toBe('Test Consultant');
    expect(component.semaines[0].jours[0].natureIntervention).toBe('Développement du module X');
    expect(component.semaines[0].jours[0].facture).toBe(0.5);
  });

  it('conserve les saisies de chaque mois séparément', () => {
    component.semaines[0].jours[0].natureIntervention = 'Novembre';
    component.sauverSaisies();
    component.moisVoisin(1);
    expect(component.mois).toBe(12);
    expect(component.semaines[0].jours.every(j => j.natureIntervention !== 'Novembre')).toBe(true);
    component.moisVoisin(-1);
    expect(component.semaines[0].jours[0].natureIntervention).toBe('Novembre');
  });

  it('recopie une intervention sur les jours vides suivants, sans toucher aux fériés', () => {
    // Semaine du 2 au 6 novembre 2026 : le vendredi 6 est férié
    const semaine = component.semaines[0];
    semaine.jours[0].natureIntervention = 'Recette';
    semaine.jours[2].natureIntervention = 'Déjà saisi';
    component.dupliquerSurSemaine(semaine, semaine.jours[0]);
    expect(semaine.jours.map(j => j.natureIntervention))
      .toEqual(['Recette', 'Recette', 'Déjà saisi', 'Recette', 'Férié - Marche Verte']);
  });

  it('ignore une année invalide au lieu de générer un calendrier faux', () => {
    component.annee = null as unknown as number;
    component.chargerPeriode();
    expect(component.anneeValide).toBe(false);
    expect(component.semaines[0].periodeDebut).toBe('02/11/2026');
  });

  it('passe d\'une année à l\'autre avec les flèches de mois', () => {
    component.moisVoisin(2);
    expect([component.mois, component.annee]).toEqual([1, 2027]);
  });

  it('prévient l\'utilisateur quand la génération échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    genererDocx.mockRejectedValue(new Error('logo'));
    await component.genererCRA();
    expect(component.toast?.type).toBe('erreur');
    expect(component.isGenerating).toBe(false);
  });

  it('génère le document pour la période affichée', async () => {
    await component.genererCRA();
    expect(genererDocx).toHaveBeenCalledWith(component.infos, component.semaines, 11, 2026);
    expect(component.succes).toBe(true);
  });
});
