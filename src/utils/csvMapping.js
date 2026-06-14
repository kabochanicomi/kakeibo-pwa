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

// CSV「カテゴリ」+「カテゴリの内訳」→ アプリカテゴリ
// '_default' はサブカテゴリが未定義の場合のフォールバック
const CATEGORY_MAP = {
  '食費': {
    '食料品': catEntry('food_other',   'variable'),
    '朝ご飯': catEntry('food_morning', 'variable'),
    '昼ご飯': catEntry('food_lunch',   'variable'),
    '夕ご飯': catEntry('food_dinner',  'variable'),
    'カフェ': catEntry('food_other',   'variable'),
    'その他': catEntry('food_other',   'variable'),
    '_default': catEntry('food_other', 'variable'),
  },
  'エンタメ': {
    '映画・動画': catEntry('subscription',  'fixed'),
    '漫画':       catEntry('entertainment', 'variable'),
    'ゲーム':     catEntry('entertainment', 'variable'),
    'その他':     catEntry('entertainment', 'variable'),
    '_default':   catEntry('entertainment', 'variable'),
  },
  '交際費': {
    '_default': catEntry('social', 'variable'),
  },
  '美容・衣服': {
    'ジム・健康': catEntry('medical',  'variable'),
    'コスメ':     catEntry('clothing', 'variable'),
    '下着':       catEntry('clothing', 'variable'),
    '衣類':       catEntry('clothing', 'variable'),
    'その他':     catEntry('clothing', 'variable'),
    '_default':   catEntry('clothing', 'variable'),
  },
  '医療・保険': {
    '薬代':     catEntry('medical',   'variable'),
    '病院':     catEntry('medical',   'variable'),
    '保険料':   catEntry('insurance', 'fixed'),
    'その他':   catEntry('medical',   'variable'),
    '_default': catEntry('medical',   'variable'),
  },
  '通信': {
    '携帯電話料金':     catEntry('communication', 'fixed'),
    'インターネット':   catEntry('communication', 'fixed'),
    '切手・はがき':     catEntry('other_variable','variable'),
    'その他':           catEntry('communication', 'fixed'),
    '_default':         catEntry('communication', 'fixed'),
  },
  '日用雑貨': {
    '_default': catEntry('daily', 'variable'),
  },
  '住まい': {
    '家賃':     catEntry('housing',   'fixed'),
    '住宅保険': catEntry('insurance', 'fixed'),
    'その他':   catEntry('housing',   'fixed'),
    '_default': catEntry('housing',   'fixed'),
  },
  '交通': {
    '電車':     catEntry('transit',    'variable'),
    'バス':     catEntry('transit',    'variable'),
    'タクシー': catEntry('transit',    'variable'),
    '高速道路': catEntry('expressway', 'variable'),
    '駐車場':   catEntry('parking',    'variable'),
    'ガソリン': catEntry('fuel',       'variable'),
    '_default': catEntry('transit',    'variable'),
  },
  '水道・光熱': {
    '_default': catEntry('other_special', 'special'),
  },
  '教育': {
    '_default': catEntry('education', 'variable'),
  },
  '旅行': {
    '_default': catEntry('travel', 'special'),
  },
  'その他': {
    '_default': catEntry('other_variable', 'variable'),
  },
};

// CSV「カテゴリ」→ 収入カテゴリID（method === 'income' の場合）
const INCOME_MAP = {
  '給与所得': 'salary',
  '給与':     'salary',
  '賞与':     'salary',
  '副業':     'side_income',
  '臨時収入': 'temporary',
  '返金':     'temporary',
  'その他':   'other_income',
};

// payment_method_id → ラベル（ImportScreen で参照）
export const PM_LABEL = {};
PAYMENT_METHODS.forEach((m) => { PM_LABEL[m.id] = m.label; });

export function mapCSVRows(headers, rows) {
  const idx = {};
  headers.forEach((h, i) => { idx[h.trim()] = i; });

  const get = (row, col) => (row[idx[col]] ?? '').trim();

  return rows
    .map((row) => {
      const date        = get(row, '日付');
      const method      = get(row, '方法');
      const category    = get(row, 'カテゴリ');
      const subcategory = get(row, 'カテゴリの内訳');
      const item        = get(row, '品目');
      const memo        = get(row, 'メモ');
      const storeRaw    = get(row, 'お店');
      const incomeRaw   = get(row, '収入');
      const expenseRaw  = get(row, '支出');

      if (!date) return null;

      // store_name: お店（'-'以外）> メモ > 品目 の優先順
      const store = (storeRaw && storeRaw !== '-') ? storeRaw : '';
      const storeName = store || memo || item || '';
      const memoOut   = store ? [memo, item].filter(Boolean).join(' ') : '';

      if (method === 'income') {
        const amount = parseInt(incomeRaw.replace(/,/g, ''), 10) || 0;
        if (amount <= 0) return null;
        const incId = INCOME_MAP[category] ?? 'other_income';
        const c = CAT_BY_ID[incId];
        return {
          date,
          type: 'income',
          expense_type: null,
          category: incId,
          category_label: c?.label ?? category,
          group_label: null,
          amount,
          payment_method: null,
          store_name: storeName,
          memo: memoOut,
          _unknown: false,
          _raw_bunrui: category,
        };
      }

      if (method !== 'payment') return null;

      const amount = parseInt(expenseRaw.replace(/,/g, ''), 10) || 0;
      if (amount <= 0) return null; // 割引・マイナス行はスキップ

      const catMap = CATEGORY_MAP[category];
      const catResult = catMap
        ? (catMap[subcategory] ?? catMap['_default'])
        : catEntry('other_variable', 'variable');
      const unknown = false;

      return {
        date,
        type: 'expense',
        expense_type: catResult?.expense_type ?? null,
        category: catResult?.id ?? null,
        category_label: catResult?.label ?? `${category}/${subcategory}`,
        group_label: catResult?.group_label ?? null,
        amount,
        payment_method: 'other',
        store_name: storeName,
        memo: memoOut,
        _unknown: unknown,
        _raw_bunrui: `${category}/${subcategory}`,
      };
    })
    .filter(Boolean);
}
