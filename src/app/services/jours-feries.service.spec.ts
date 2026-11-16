import { JoursFeriesService } from './jours-feries.service';

describe('JoursFeriesService', () => {
  const service = new JoursFeriesService();

  it('reconnaît le 1er janvier, et non le 2 (pas de décalage UTC)', () => {
    expect(service.estFerie(new Date(2026, 0, 1))?.nom).toBe('Nouvel An');
    expect(service.estFerie(new Date(2026, 0, 2))).toBeUndefined();
    expect(service.estFerie(new Date(2025, 11, 31))).toBeUndefined();
  });

  it('reconnaît un jour férié quelle que soit l\'heure de la journée', () => {
    expect(service.estFerie(new Date(2026, 4, 1, 0, 0))?.nom).toBe('Fête du Travail');
    expect(service.estFerie(new Date(2026, 4, 1, 23, 59))?.nom).toBe('Fête du Travail');
  });

  it('applique les jours fériés récents à partir de leur année d\'entrée en vigueur', () => {
    expect(service.estFerie(new Date(2023, 0, 14))).toBeUndefined();
    expect(service.estFerie(new Date(2024, 0, 14))?.nom).toBe('Nouvel An amazigh');
    expect(service.estFerie(new Date(2025, 9, 31))).toBeUndefined();
    expect(service.estFerie(new Date(2026, 9, 31))?.nom).toBe('Aïd Al Wahda');
  });

  it('place le 1er Moharram 2026 en juin', () => {
    expect(service.estFerie(new Date(2026, 0, 17))).toBeUndefined();
    expect(service.estFerie(new Date(2026, 5, 17))?.nom).toBe('1er Moharram');
  });

  it('signale les années sans fêtes religieuses renseignées', () => {
    expect(service.feriesMobilesConnus(2026)).toBe(true);
    expect(service.feriesMobilesConnus(2040)).toBe(false);
  });
});
