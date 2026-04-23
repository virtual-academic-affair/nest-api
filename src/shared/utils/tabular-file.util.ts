import { BadRequestException } from '@nestjs/common';

export type TabularColumnMap<T extends Record<string, any>> = {
  [K in keyof T]: number;
};

export async function* readTabularFileRows<T extends Record<string, any>>(
  file: Express.Multer.File,
  opts: {
    startRow?: number;
    columns: TabularColumnMap<T>;
  },
): AsyncGenerator<T> {
  const name = (file.originalname ?? '').toLowerCase();
  const startRow = Math.max(1, opts.startRow ?? 2);

  const xlsx = await import('xlsx');
  const workbook = name.endsWith('.csv')
    ? xlsx.read(file.buffer.toString('utf-8'), { type: 'string' })
    : xlsx.read(file.buffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' }) as any[][];

  const entries = Object.entries(opts.columns) as Array<[keyof T, number]>;
  for (const [key, col] of entries) {
    if (!Number.isInteger(col) || col < 1) {
      throw new BadRequestException(`Invalid column index for ${String(key)}`);
    }
  }

  for (const row of grid.slice(startRow - 1)) {
    const out: any = {};
    let hasAny = false;

    for (const [key, col] of entries) {
      const value = row?.[col - 1];
      const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      out[key as string] = v;
      if (v) {
        hasAny = true;
      }
    }

    if (hasAny) {
      yield out as T;
    }
  }
}
