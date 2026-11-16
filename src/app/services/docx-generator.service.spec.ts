import { DocxGeneratorService } from './docx-generator.service';

describe('DocxGeneratorService', () => {
  const service = new DocxGeneratorService();

  it('remplace tous les espaces du nom du consultant', () => {
    expect(service.nomFichier('Jean Pierre De La Fontaine', 3, 2026))
      .toBe('CRA_Jean_Pierre_De_La_Fontaine_03_2026.docx');
  });

  it('retire les caractères interdits dans un nom de fichier', () => {
    expect(service.nomFichier(' A/B: C? ', 11, 2026)).toBe('CRA_AB_C_11_2026.docx');
  });

  it('reste valide sans nom de consultant', () => {
    expect(service.nomFichier('', 1, 2026)).toBe('CRA_Consultant_01_2026.docx');
  });
});
