import { CATEGORIES, PAYMENT_METHODS } from '../constants/categories';

const CAT_BY_ID = {};
CATEGORIES.income.forEach((c) => { CAT_BY_ID[c.id] = c; });
Object.entries(CATEGORIES.expense).forEach(([expType, cats]) => {
  cats.forEach((c) => { CAT_BY_ID[c.id] = { ...c, expense_type: expType }; });
});
CATEGORIES.saving.forEach((c) => { CAT_BY_ID[c.id] = c; });

function catEntry(id, expenseType) {
  const c = CAT_BY_ID[id];
  return { id, label: c?.label ?? id, expense_type: expenseType, group_label: c?.group_label ?? null };
}

// CSV「分類」→ 支出カテゴリ
const DIVISION_MAP = {
  '食費':                 catEntry('food_other',      'variable'),
  '食費（朝食）':         catEntry('food_morning',    'variable'),
  '食費（昼食）':         catEntry('food_lunch',      'variable'),
  '食費（夕食）':         catEntry('food_dinner',     'variable'),
  '食費（その他、間食）': catEntry('food_other',      'variable'),
  '駐車場':               catEntry('parking',         'variable'),
  '娯楽':                 catEntry('entertainment',   'variable'),
  '交通':                 catEntry('transit',          'variable'),
  '高速道路':             catEntry('expressway',      'variable'),
  '家具':                 catEntry('appliance',       'special'),
  '医療':                 catEntry('medical',         'variable'),
  '旅館・ホテル':         catEntry('travel',          'special'),
  '衣類':                 catEntry('clothing',        'variable'),
  'ガソリンスタンド':     catEntry('fuel',            'variable'),
  '公共料金':             catEntry('other_special',   'special'),
  '美容':                 catEntry('clothing',        'variable'),
  '慶弔事':              catEntry('ceremony',        'special'),
  '演劇関連':             catEntry('education',       'variable'),
  '用途不明':             catEntry('other_variable',  'variable'),
  '銀行引落':             catEntry('other_variable',  'variable'),
  'その他':               catEntry('other_variable',  'variable'),
};

// CSV「分類」→ 収入カテゴリ（収入行のみ使用）
const INCOME_MAP = {
  '給与':       'salary',
  '副収入':     'side_income',
  'ギャンブル': 'temporary',
  '返金':       'temporary',
  'その他':     'other_income',
  '不明':       'other_income',
};

// 「雑貨」は内訳・メモで振り分け（先に一致したものが優先）
const ZAKKA_RULES = [
  {
    test: (store) => /ダイヤモンドシライシ/.test(store),
    cat: catEntry('ceremony', 'special'),
  },
  {
    test: (store) => /オートバックス/.test(store),
    cat: catEntry('car', 'special'),
  },
  {
    test: (store, memo) => /メンテナンスパック/.test(store) || /メンテナンス/.test(memo),
    cat: catEntry('car', 'special'),
  },
  {
    test: (store, memo) => /アニエスベー|agnes/i.test(store) || /財布|カバン|リュック/.test(memo),
    cat: catEntry('clothing', 'variable'),
  },
  {
    test: (store, memo) => /ococaラファイン|ドラッグ|薬局|マツキヨ|マツモトキヨシ/.test(store) || /ロキソニン|湿布|薬|EVE/.test(memo),
    cat: catEntry('medical', 'variable'),
  },
];

// CSV「カード」列 → payment_method_id
const CARD_MAP = {
  '現金':          'cash',
  'ファミマカード': 'famima_card',
  'イオン首都高':  'aeon_highway',
  'ENEOS Sカード':        'eneos_card',
  'ビックカメラSuicaカード': 'bic_suica',
  'セゾンゴールド':          'saison_gold',
  'セゾンパール':            'saison_pearl',
  'UCカード':                'uc_card',
  '銀行引落':                'bank',
  'Suica払い':            'suica',
  'PayPay払い':           'paypay',
};

// payment_method_id → ラベル
export const PM_LABEL = {};
PAYMENT_METHODS.forEach((m) => { PM_LABEL[m.id] = m.label; });

function resolveCategory(type, bunrui, store, memo) {
  if (type === 'income') {
    const incId = INCOME_MAP[bunrui] ?? 'other_income';
    const c = CAT_BY_ID[incId];
    return { id: incId, label: c?.label ?? bunrui, expense_type: null, group_label: null, unknown: false };
  }

  if (bunrui === '医療') {
    if (/保険/.test(store)) return { ...catEntry('insurance', 'fixed'), unknown: false };
    return { ...catEntry('medical', 'variable'), unknown: false };
  }

  if (bunrui === '文化') {
    if (/Apple Music|Spotify|Amazon Prime|Disney\+|YouTube Premium|Hulu|Netflix/i.test(store)) {
      return { ...catEntry('subscription', 'fixed'), unknown: false };
    }
    if (/agoda|Booking\.com|じゃらん/i.test(store)) {
      return { ...catEntry('travel', 'special'), unknown: false };
    }
    if (/ケーズデンキ|ノジマ|ヤマダ|ヨドバシ|ビックカメラ|ビッグカメラ/.test(store)) {
      return { ...catEntry('appliance', 'special'), unknown: false };
    }
    return { ...catEntry('entertainment', 'variable'), unknown: false };
  }

  if (bunrui === '公共料金') {
    if (/車検|スマイルパスポート|自動車税/.test(store)) return { ...catEntry('car', 'special'), unknown: false };
    return { ...catEntry('other_special', 'special'), unknown: false };
  }

  if (DIVISION_MAP[bunrui]) return { ...DIVISION_MAP[bunrui], unknown: false };

  if (bunrui === '雑貨') {
    for (const rule of ZAKKA_RULES) {
      if (rule.test(store, memo)) return { ...rule.cat, unknown: false };
    }
    return { ...catEntry('daily', 'variable'), unknown: false };
  }

  return { id: null, label: bunrui, expense_type: null, group_label: null, unknown: true };
}

export function mapCSVRows(headers, rows) {
  const idx = {};
  headers.forEach((h, i) => { idx[h.trim()] = i; });

  const get = (row, col) => (row[idx[col]] ?? '').trim();

  return rows
    .map((row) => {
      const date      = get(row, '取引日');
      const typeStr   = get(row, '収入/支出');
      const bunrui    = get(row, '分類');
      const store     = get(row, '内訳');
      const card      = get(row, 'カード');
      const memo      = get(row, 'メモ');
      const amountRaw = get(row, '金額');

      if (typeStr !== '支出' || !date) return null;
      if (!bunrui || bunrui === '貸付' || bunrui === '貸付（食事）' || bunrui === '会費' || bunrui === '繰越（赤字）') return null;
      if (bunrui === '銀行引落' && /引き出し/.test(store)) return null;
      const type = 'expense';

      const { id, label, expense_type, group_label, unknown } = resolveCategory(type, bunrui, store, memo);

      return {
        date,
        type,
        expense_type: type === 'expense' ? expense_type : null,
        category: id,
        category_label: label,
        group_label,
        amount: parseInt(amountRaw.replace(/,/g, ''), 10) || 0,
        payment_method: type === 'expense' ? (CARD_MAP[card] ?? 'other') : null,
        store_name: store,
        memo,
        _unknown: unknown,
        _raw_bunrui: bunrui,
      };
    })
    .filter(Boolean);
}
