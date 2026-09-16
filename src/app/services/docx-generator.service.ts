import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, AlignmentType, BorderStyle, ShadingType,
  VerticalAlign, Header, ImageRun, PageBreak, HeightRule
} from 'docx';
import { saveAs } from 'file-saver';
import { SemaineCRA } from './cra.service';

export interface InfosCRA {
  marche: string;
  prestation: string;
  consultant: string;
  profil: string;
  pourClient: string;
}

const FONT = 'Times New Roman';
const TEXT_COLOR = '0D0D0D';
const GRIS_LABEL = 'E6E6E6';
const GRIS_TOTAL = 'CCCCCC';
const SZ = 20; // 9pt

// Largeurs de colonnes exactes (en twips), total = 10680
const C = { c1: 1061, c2: 834, c3: 661, c4: 155, c5: 2288, c6: 768, c7: 456, c8: 4457 };

@Injectable({ providedIn: 'root' })
export class DocxGeneratorService {

  private borders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
  };

  constructor(private http: HttpClient) { }

  private async chargerLogo(): Promise<ArrayBuffer> {
    return this.http.get('assets/logo-ca.jpg', { responseType: 'arraybuffer' }).toPromise();
  }

private cell(text: string, opts: {
  bold?: boolean, width?: number, shade?: string, colSpan?: number,
  align?: any, verticalCenter?: boolean, marginTop?: number, marginLeft?: number, marginBottom?: number,
  size?: number
} = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    columnSpan: opts.colSpan,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    verticalAlign: opts.verticalCenter ? VerticalAlign.CENTER : undefined,
    margins: (opts.marginTop || opts.marginLeft || opts.marginBottom) ? {
      top: opts.marginTop ?? 0,
      left: opts.marginLeft ?? 0,
      bottom: opts.marginBottom ?? 0,
    } : undefined,
    borders: this.borders,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, bold: opts.bold ?? false, font: FONT, size: opts.size ?? SZ, color: TEXT_COLOR })]
    })]
  });
}

  private creerEntete(logoBuffer: ArrayBuffer): Header {
    return new Header({
      children: [
        new Table({
          width: { size: 10700, type: WidthType.DXA },
          indent: { size: -493, type: WidthType.DXA },
          rows: [
            new TableRow({
              height: { value: 1400, rule: HeightRule.ATLEAST }, // ~2.5cm au lieu de ~1cm
              children: [
                new TableCell({
                  width: { size: 2184, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new ImageRun({ data: logoBuffer, transformation: { width: 90, height: 57 }, type: 'jpg' })] // agrandi de 63x40 → 90x57
                  })]
                }),
                new TableCell({
                  width: { size: 5976, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: 'Prestations en régie', bold: true, smallCaps: true, underline: {}, font: 'Arial Narrow', size: 32 }), // 28 → 32
                        new TextRun({ break: 1 }),
                        new TextRun({ text: 'Fiche d\u2019activité', bold: true, smallCaps: true, underline: {}, font: 'Arial Narrow', size: 32 })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 2520, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '01 Talent', bold: true, color: '000000', font: 'Arial Narrow', size: 26 })] // 22 → 26
                  })]
                })
              ]
            })
          ]
        }),
        new Paragraph({ text: '' })
      ]
    });
  }

  private creerTableauSemaine(infos: InfosCRA, semaine: SemaineCRA, premiereSemaine: boolean): (Paragraph | Table)[] {
    const rows: TableRow[] = [];

    rows.push(new TableRow({
      height: { value: 700, rule: HeightRule.ATLEAST },
      children: [
        this.cell('Mission', { width: C.c1 + C.c2, colSpan: 2, shade: GRIS_LABEL, verticalCenter: true }),
        new TableCell({
          width: { size: C.c3 + C.c4 + C.c5 + C.c6 + C.c7 + C.c8, type: WidthType.DXA },
          columnSpan: 6,
          shading: { fill: GRIS_LABEL, type: ShadingType.CLEAR },
          borders: this.borders,
          children: [
            new Paragraph({
              spacing: { after: 150 }, // petit espace entre les 2 lignes
              children: [new TextRun({ text: infos.marche, bold: true, underline: {}, font: FONT, size: SZ, color: TEXT_COLOR })]
            }),
            new Paragraph({
              children: [new TextRun({ text: infos.prestation, bold: true, font: FONT, size: SZ, color: TEXT_COLOR })]
            })
          ]
        })
      ]
    }));
    rows.push(new TableRow({
      children: [
        this.cell('Période', { width: C.c1 + C.c2, colSpan: 2, shade: GRIS_LABEL, verticalCenter: true }),
        this.cell('Du', { width: C.c3, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell(semaine.periodeDebut, { width: C.c4 + C.c5 + C.c6, colSpan: 3, bold: true, align: AlignmentType.CENTER, marginTop: 80, marginBottom: 80 }),
        this.cell('Au', { width: C.c7, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell(semaine.periodeFin, { width: C.c8, bold: true, align: AlignmentType.CENTER, marginTop: 80, marginBottom: 80 })
      ]
    }));

    rows.push(new TableRow({
      children: [
        this.cell('Consultant', { width: C.c1 + C.c2, colSpan: 2, shade: GRIS_LABEL, verticalCenter: true }),
        this.cell(infos.consultant, { width: C.c3 + C.c4 + C.c5 + C.c6 + C.c7 + C.c8, colSpan: 6, bold: true, marginTop: 80, marginLeft: 50, marginBottom: 80 })]
    }));

    rows.push(new TableRow({
      children: [
        this.cell('Profil', { width: C.c1 + C.c2, colSpan: 2, shade: GRIS_LABEL, verticalCenter: true }),
        this.cell(infos.profil, { width: C.c3 + C.c4 + C.c5 + C.c6 + C.c7 + C.c8, colSpan: 6, bold: true, marginTop: 80, marginLeft: 50, marginBottom: 80 })]
    }));

    rows.push(new TableRow({
      children: [
        this.cell('Jour', { width: C.c1, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell('Date', { width: C.c2, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell('Facturé J/H', { width: C.c3 + C.c4, colSpan: 2, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell('Nature Intervention', { width: C.c5 + C.c6 + C.c7 + C.c8, colSpan: 4, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true })
      ]
    }));

    semaine.jours.forEach(j => {
      rows.push(new TableRow({
        height: { value: 1700, rule: HeightRule.ATLEAST },
        children: [
          this.cell(j.jour, { width: C.c1, align: AlignmentType.CENTER, verticalCenter: true }),
          this.cell(j.date, { width: C.c2, align: AlignmentType.CENTER, verticalCenter: true }),
          this.cell(j.facture, { width: C.c3 + C.c4, colSpan: 2, align: AlignmentType.CENTER, verticalCenter: true }),
          this.cell(j.natureIntervention, { width: C.c5 + C.c6 + C.c7 + C.c8, colSpan: 4, size: 22, verticalCenter: true })
        ]
      }));
    });

    const nbJoursTravailles = semaine.jours.filter(j => j.facture === '1').length;

    rows.push(new TableRow({
      height: { value: 500, rule: HeightRule.ATLEAST },
      children: [
        this.cell('Total', { width: C.c1, shade: GRIS_TOTAL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell('', { width: C.c2, shade: GRIS_TOTAL }),
        this.cell('', { width: C.c3 + C.c4, colSpan: 2, shade: GRIS_TOTAL }),
        this.cell(`(${String(nbJoursTravailles).padStart(2, '0')}) jours Profil ${infos.profil}`, { width: C.c5 + C.c6 + C.c7 + C.c8, colSpan: 4, shade: GRIS_TOTAL, bold: true })
      ]
    }));

    rows.push(new TableRow({
      height: { value: 500, rule: HeightRule.ATLEAST },
      children: [
        this.cell('Pour 01 Talent', { width: C.c1 + C.c2 + C.c3 + C.c4 + C.c5, colSpan: 5, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true }),
        this.cell(infos.pourClient, { width: C.c6 + C.c7 + C.c8, colSpan: 3, shade: GRIS_LABEL, bold: true, align: AlignmentType.CENTER, verticalCenter: true })
      ]
    }));

    rows.push(new TableRow({
      height: { value: 1400, rule: HeightRule.ATLEAST },
      children: [
        this.cell('', { width: C.c1 + C.c2 + C.c3 + C.c4 + C.c5, colSpan: 5 }),
        this.cell('', { width: C.c6 + C.c7 + C.c8, colSpan: 3 })
      ]
    }));

    const table = new Table({
      width: { size: 10680, type: WidthType.DXA },
      indent: { size: -493, type: WidthType.DXA },
      rows
    });

    if (premiereSemaine) {
      return [table];
    }
    return [new Paragraph({ children: [new PageBreak()] }), table];
  }

  async genererDocx(infos: InfosCRA, semaines: SemaineCRA[], mois: number, annee: number): Promise<void> {
    const logoBuffer = await this.chargerLogo();
    const header = this.creerEntete(logoBuffer);

    let children: (Paragraph | Table)[] = [];
    semaines.forEach((semaine, index) => {
      children = children.concat(this.creerTableauSemaine(infos, semaine, index === 0));
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 737, right: 1134, bottom: 567, left: 1134, header: 709, footer: 709 }
          }
        },
        headers: { default: header },
        children
      }]
    });;

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CRA_${infos.consultant.replace(' ', '_')}_${String(mois).padStart(2, '0')}_${annee}.docx`);
  }
}