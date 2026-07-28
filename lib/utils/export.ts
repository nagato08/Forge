/**
 * Export générique de données tabulaires vers Excel (.xlsx) et PDF.
 *
 * Volontairement indépendant du journal d'audit : n'importe quel écran
 * (tâches, membres, temps passé) peut décrire ses colonnes et réutiliser ces
 * deux fonctions.
 *
 * Les bibliothèques sont chargées en import dynamique : elles pèsent lourd et
 * ne servent qu'au clic sur « Exporter », jamais au premier rendu.
 */

export interface ExportColumn<T> {
  /** Titre affiché en en-tête de colonne. */
  header: string;
  /** Valeur de la cellule pour une ligne donnée. */
  value: (row: T) => string | number | null | undefined;
  /**
   * Largeur de colonne dans Excel, en caractères.
   *
   * N'est PAS appliquée au PDF : une largeur en caractères interprétée en
   * points y écrasait le texte en colonnes de lettres. Le PDF répartit
   * automatiquement la largeur disponible entre les colonnes.
   */
  width?: number;
  /**
   * Poids relatif de la colonne dans le PDF. Par défaut 1 : toutes les
   * colonnes se partagent la place à parts égales. Monter à 2 ou 3 pour un
   * libellé long, descendre en dessous de 1 n'a pas d'effet utile.
   */
  pdfWeight?: number;
  /**
   * Exclut la colonne du PDF sans la retirer d'Excel.
   *
   * À réserver aux colonnes techniques (identifiants, requestId, IP) : elles
   * sont indispensables à une exploitation machine mais volent une place que
   * le PDF, lu par un humain, ne peut pas se permettre.
   */
  excelOnly?: boolean;
}

export interface ExportOptions {
  /** Nom du fichier, sans extension. */
  filename: string;
  /** Titre imprimé en tête de document. */
  title?: string;
  /** Ligne de contexte sous le titre : filtres appliqués, période, volume. */
  subtitle?: string;
}

/** Normalise une cellule : `null`/`undefined` deviennent une chaîne vide. */
function cellValue<T>(column: ExportColumn<T>, row: T): string | number {
  const value = column.value(row);
  if (value === null || value === undefined) return '';
  return value;
}

/** Déclenche le téléchargement d'un blob sous le nom voulu. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Libère la mémoire : sans cela l'objet reste retenu jusqu'au rechargement.
  URL.revokeObjectURL(url);
}

/** Horodatage compact pour distinguer deux exports successifs. */
export function exportTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

/**
 * Génère un vrai classeur .xlsx : en-têtes en gras, ligne figée, largeurs de
 * colonnes et filtre automatique.
 */
export async function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.title ?? 'Export', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.header,
    width: column.width ?? 22,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
  headerRow.alignment = { vertical: 'middle' };

  for (const row of rows) {
    sheet.addRow(columns.map((column) => cellValue(column, row)));
  }

  // Filtre automatique sur l'en-tête : le fichier est exploitable tel quel.
  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${options.filename}.xlsx`
  );
}

/**
 * Génère un PDF paysage avec en-tête, sous-titre et pagination.
 *
 * Le paysage est imposé : ces tableaux ont beaucoup de colonnes et deviennent
 * illisibles en portrait.
 */
export async function exportToPdf<T>(
  rows: T[],
  allColumns: ExportColumn<T>[],
  options: ExportOptions
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const columns = allColumns.filter((column) => !column.excelOnly);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  // Largeur réellement disponible pour le tableau, marges déduites.
  const usableWidth = pageWidth - 80;
  const totalWeight = columns.reduce(
    (sum, column) => sum + (column.pdfWeight ?? 1),
    0
  );
  // Largeur d'une colonne de poids 1. Toutes les colonnes sont dimensionnées
  // explicitement : laisser autoTable improviser sur une partie seulement
  // produisait des colonnes d'une lettre de large.
  const unitWidth = totalWeight > 0 ? usableWidth / totalWeight : usableWidth;

  doc.setFontSize(14);
  doc.text(options.title ?? options.filename, 40, 40);

  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(options.subtitle, 40, 58);
    doc.setTextColor(0);
  }

  autoTable(doc, {
    startY: options.subtitle ? 74 : 58,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) =>
      columns.map((column) => String(cellValue(column, row)))
    ),
    styles: {
      fontSize: 7,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 8,
      // Sans quoi un en-tête long se coupe au lieu de passer à la ligne.
      overflow: 'linebreak',
      valign: 'middle',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    tableWidth: usableWidth,
    columnStyles: Object.fromEntries(
      columns.map((column, index) => [
        index,
        { cellWidth: unitWidth * (column.pdfWeight ?? 1) },
      ])
    ),
  });

  // Pagination ajoutée APRÈS le rendu complet : pendant le rendu, le nombre
  // total de pages n'est pas encore connu et on afficherait « Page 2 / 2 »
  // sur chaque page.
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(`Page ${page} / ${pageCount}`, pageWidth - 40, pageHeight - 20, {
      align: 'right',
    });
  }

  doc.save(`${options.filename}.pdf`);
}
