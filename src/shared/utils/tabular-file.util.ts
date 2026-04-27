import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export type TabularColumnMap<T extends Record<string, any>> = {
  [K in keyof T]: number;
};

/**
 * Converts an ExcelJS cell to HTML string preserving basic formatting.
 */
export function excelCellToHtml(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (!value) return '';

  let html = '';

  // 1. Handle Rich Text (mixed formatting within cell)
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    html = value.richText
      .map((rt) => {
        let text = rt.text || '';
        if (rt.font) {
          if (rt.font.bold) text = `<b>${text}</b>`;
          if (rt.font.italic) text = `<i>${text}</i>`;
          if (rt.font.underline) text = `<u>${text}</u>`;
        }
        return text;
      })
      .join('');
  } else {
    // 2. Handle Plain Text with Cell Font
    let text = String(value ?? '').trim();
    if (cell.font) {
      if (cell.font.bold) text = `<b>${text}</b>`;
      if (cell.font.italic) text = `<i>${text}</i>`;
      if (cell.font.underline) text = `<u>${text}</u>`;
    }
    html = text;
  }

  // 3. Convert newlines to paragraphs
  if (html.includes('\n')) {
    return html
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => `<p>${line}</p>`)
      .join('');
  }

  return `<p>${html}</p>`;
}

export async function* readTabularFileRows<T extends Record<string, any>>(
  file: Express.Multer.File,
  opts: {
    startRow?: number;
    columns: TabularColumnMap<T>;
    richTextColumns?: Array<keyof T>;
  },
): AsyncGenerator<T> {
  const name = (file.originalname ?? '').toLowerCase();
  const startRow = Math.max(1, opts.startRow ?? 2);

  if (name.endsWith('.csv')) {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(file.buffer.toString('utf-8'), { type: 'string' });
    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) return;
    const sheet = workbook.Sheets[sheetName];
    const grid = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' }) as any[][];

    const entries = Object.entries(opts.columns) as Array<[keyof T, number]>;
    for (const row of grid.slice(startRow - 1)) {
      const out: any = {};
      let hasAny = false;
      for (const [key, col] of entries) {
        const val = String(row?.[col - 1] ?? '').trim();
        out[key as string] = val;
        if (val) hasAny = true;
      }
      if (hasAny) yield out as T;
    }
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return;

  const entries = Object.entries(opts.columns) as Array<[keyof T, number]>;
  const richTextCols = new Set(opts.richTextColumns || []);

  for (let i = startRow; i <= (worksheet.rowCount || 0); i++) {
    const row = worksheet.getRow(i);
    if (!row || !row.values) continue;

    const out: any = {};
    let hasAny = false;
    let extractedDisplayName: string | null = null;

    for (const [key, col] of entries) {
      const cell = row.getCell(col);
      let value: any;

      if (richTextCols.has(key)) {
        value = excelCellToHtml(cell);
      } else {
        // More aggressive Hyperlink detection
        if (cell.hyperlink) {
          // Case 1: Standard Hyperlink
          const h = (
            typeof cell.hyperlink === 'object' ? cell.hyperlink : { hyperlink: cell.hyperlink, text: '' }
          ) as any;
          value = h.hyperlink;
          if (key === 'contentLink') {
            // Get text from hyperlink object or fallback to cell.value (handling object)
            let text = h.text;
            if (!text && cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
              text = (cell.value as any).text;
            }
            extractedDisplayName = String(text || cell.value || '').trim();
            if (extractedDisplayName === '[object Object]') extractedDisplayName = '';
          }
        } else if (
          cell.type === ExcelJS.ValueType.Formula &&
          cell.value &&
          typeof cell.value === 'object' &&
          'formula' in cell.value
        ) {
          // Case 2: Formula Hyperlink e.g., =HYPERLINK("url", "text")
          const formula = String(cell.value.formula);
          if (formula.toUpperCase().startsWith('HYPERLINK')) {
            const matches = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"\s*(?:,\s*"([^"]+)"\s*)?\)/i);
            if (matches) {
              value = matches[1];
              if (key === 'contentLink') {
                extractedDisplayName = matches[2] || matches[1];
              }
            } else {
              value = String((cell.value as any).result || '');
            }
          } else {
            value = String((cell.value as any).result || '');
          }
        } else {
          // Case 3: Regular value - handling potential objects like Dates or unexpected Excel objects
          const cellVal = cell.value;
          if (cellVal && typeof cellVal === 'object') {
            if ('text' in cellVal) value = String((cellVal as any).text);
            else if ('result' in cellVal) value = String((cellVal as any).result);
            else value = String(cellVal);
          } else {
            value = cellVal;
          }
        }
      }

      // Final sanitization: convert to string if not rich text and not null
      if (!richTextCols.has(key) && value !== null && value !== undefined) {
        value = String(value).trim();
        if (value === '[object Object]') value = '';
      }

      out[key as string] = value;
      if (value !== null && value !== undefined && value !== '') hasAny = true;
    }

    // After reading all columns, decide linkDisplayName
    if (extractedDisplayName) {
      if (!out.linkDisplayName || String(out.linkDisplayName).trim() === '') {
        out.linkDisplayName = extractedDisplayName;
      }
    }

    if (hasAny) yield out as T;
  }
}
