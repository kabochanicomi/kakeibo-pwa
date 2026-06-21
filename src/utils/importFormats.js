function parseETCDate(raw) {
  const s = raw.trim();
  // YYYY/MM/DD
  const m4 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m4) return `${m4[1]}-${m4[2].padStart(2, '0')}-${m4[3].padStart(2, '0')}`;
  // YY/MM/DD (2桁年 → 2000年代と見なす)
  const m2 = s.match(/^(\d{2})\/(\d{1,2})\/(\d{1,2})$/);
  if (m2) return `${2000 + parseInt(m2[1], 10)}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`;
  // YYYYMMDD
  const c = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (c) return `${c[1]}-${c[2]}-${c[3]}`;
  return s;
}

function mapETCRows(headers, rows) {
  return rows
    .map((row) => {
      const date = parseETCDate(row[0] ?? '');
      const entry = (row[4] ?? '').trim();
      const exit = (row[5] ?? '').trim();
      const rawAmount = (row[10] ?? '').replace(/,/g, '').trim();
      const cardNumber = (row[13] ?? '').trim();

      if (!date || !rawAmount) return null;
      const amount = parseInt(rawAmount, 10) || 0;
      if (amount <= 0) return null;

      return {
        date,
        type: 'expense',
        expense_type: 'variable',
        category: 'expressway',
        category_label: '高速道路',
        group_label: '交通費',
        amount,
        payment_method: cardNumber === '*******14640001' ? 'aeon_highway' : null,
        store_name: '高速道路',
        memo: entry && exit ? `${entry} → ${exit}` : entry || exit || '',
        _unknown: false,
        _raw_bunrui: 'ETC',
      };
    })
    .filter(Boolean);
}

export const IMPORT_FORMATS = [
  {
    id: 'etc_mileage',
    label: 'ETCマイレージ',
    description: 'ETCマイレージサービスの利用明細CSV',
    icon: '🛣️',
    encoding: 'shift-jis',
    allowedEmails: ['gotopin691@gmail.com'],
    mapper: mapETCRows,
    filterDuplicates: (rows, existing) => {
      const existingDates = new Set(
        existing.filter((t) => t.category === 'expressway').map((t) => t.date)
      );
      return rows.filter((r) => !existingDates.has(r.date));
    },
  },
];
