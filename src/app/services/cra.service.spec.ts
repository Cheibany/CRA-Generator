import { CraService } from './cra.service';
import { JoursFeriesService } from './jours-feries.service';
import { formaterFacture, formaterTotal, totalJours } from '../models/cra.models';

describe('CraService', () => {
  const service = new CraService(new JoursFeriesService());

  it('ignore la semaine entièrement hors période quand le 1er tombe un dimanche', () => {
    // Novembre 2026 : le 1er est un dimanche
    const semaines = service.genererSemainesDuMois(11, 2026);
    expect(semaines[0].periodeDebut).toBe('02/11/2026');
    expect(semaines.every(s => s.jours.some(j => !j.horsPeriode))).toBe(true);
  });

  it('ignore la semaine entièrement hors période quand le 1er tombe un samedi', () => {
    // Août 2026 : le 1er est un samedi
    expect(service.genererSemainesDuMois(8, 2026)[0].periodeDebut).toBe('03/08/2026');
  });

  it('couvre tous les jours ouvrés du mois, une seule fois', () => {
    for (let mois = 1; mois <= 12; mois++) {
      const cles = service.genererSemainesDuMois(mois, 2026)
        .flatMap(s => s.jours).filter(j => !j.horsPeriode).map(j => j.cle);
      let attendus = 0;
      for (const d = new Date(2026, mois - 1, 1); d.getMonth() === mois - 1; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) attendus++;
      }
      expect(cles.length).toBe(attendus);
      expect(new Set(cles).size).toBe(attendus);
    }
  });

  it('marque les jours des mois voisins comme hors période et non facturés', () => {
    // Avril 2026 commence un mercredi : lundi 30 et mardi 31 mars sont hors période
    const [premiere] = service.genererSemainesDuMois(4, 2026);
    expect(premiere.jours.map(j => j.horsPeriode)).toEqual([true, true, false, false, false]);
    expect(premiere.jours[0].facture).toBe(0);
    expect(premiere.jours[0].ferie).toBe(false);
    expect(totalJours(premiere.jours)).toBe(3);
  });

  it('pré-remplit les jours fériés', () => {
    const jours = service.genererSemainesDuMois(5, 2026).flatMap(s => s.jours);
    const premierMai = jours.find(j => j.cle === '2026-05-01')!;
    expect(premierMai.ferie).toBe(true);
    expect(premierMai.facture).toBe(0);
    expect(premierMai.natureIntervention).toBe('Férié - Fête du Travail');
  });

  it('gère le passage d\'année', () => {
    const semaines = service.genererSemainesDuMois(12, 2026);
    const derniere = semaines[semaines.length - 1];
    expect(derniere.periodeDebut).toBe('28/12/2026');
    expect(derniere.periodeFin).toBe('01/01/2027');
    expect(derniere.jours[4].horsPeriode).toBe(true);
  });
});

describe('formatage', () => {
  it('formate les totaux comme sur la fiche', () => {
    expect(formaterTotal(5)).toBe('05');
    expect(formaterTotal(4.5)).toBe('04,5');
    expect(formaterTotal(0)).toBe('00');
    expect(formaterTotal(21.5)).toBe('21,5');
  });

  it('formate les demi-journées avec une virgule', () => {
    expect(formaterFacture(0.5)).toBe('0,5');
    expect(formaterFacture(1)).toBe('1');
  });
});
