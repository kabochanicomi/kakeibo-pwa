export const CATEGORIES = {
  income: [
    { id: 'salary',      label: '給与・賞与', icon: '💼' },
    { id: 'side_income', label: '副収入',     icon: '💻' },
    { id: 'temporary',   label: '一時収入',   icon: '🎁' },
    { id: 'other_income',label: 'その他',     icon: '📥' },
  ],
  expense: {
    fixed: [
      { id: 'housing',       label: '住居費',   icon: '🏠', group_label: '住居費' },
      { id: 'communication', label: '通信費',   icon: '📱', group_label: '通信費' },
      { id: 'insurance',     label: '保険料',   icon: '🛡️', group_label: '保険料' },
      { id: 'loan',          label: 'ローン',   icon: '🏦', group_label: 'ローン' },
      { id: 'subscription',  label: 'サブスク', icon: '📺', group_label: 'サブスク' },
    ],
    variable: [
      { id: 'food_morning',  label: '食費（朝食）',   icon: '🍳', group_label: '食費' },
      { id: 'food_lunch',    label: '食費（昼食）',   icon: '🍱', group_label: '食費' },
      { id: 'food_dinner',   label: '食費（夕食）',   icon: '🍽️', group_label: '食費' },
      { id: 'food_other',    label: '食費（その他）', icon: '🛒', group_label: '食費' },
      { id: 'daily',         label: '日用品',         icon: '🧴', group_label: '日用品' },
      { id: 'expressway',    label: '高速道路',       icon: '🛣️', group_label: '交通費' },
      { id: 'parking',       label: '駐車場',         icon: '🅿️', group_label: '交通費' },
      { id: 'transit',       label: '交通機関',       icon: '🚃', group_label: '交通費' },
      { id: 'fuel',          label: 'ガソリン代',     icon: '⛽', group_label: '交通費' },
      { id: 'medical',       label: '医療・健康',     icon: '🏥', group_label: '医療・健康' },
      { id: 'clothing',      label: '衣服・美容',     icon: '👗', group_label: '衣服・美容' },
      { id: 'entertainment', label: '娯楽・趣味',     icon: '🎮', group_label: '娯楽・趣味' },
      { id: 'social',        label: '交際費',         icon: '🍻', group_label: '交際費' },
      { id: 'education',     label: '教育',           icon: '📚', group_label: '教育' },
      { id: 'other_variable',label: 'その他',         icon: '📦', group_label: 'その他' },
    ],
    special: [
      { id: 'ceremony',      label: '冠婚葬祭',     icon: '💐', group_label: '冠婚葬祭' },
      { id: 'travel',        label: '旅行',         icon: '✈️', group_label: '旅行' },
      { id: 'appliance',     label: '家電・家具',   icon: '🏡', group_label: '家電・家具' },
      { id: 'car',           label: '車両費',       icon: '🚗', group_label: '車両費' },
      { id: 'other_special', label: 'その他特別費', icon: '⭐', group_label: 'その他特別費' },
    ],
  },
  saving: [
    { id: 'deposit',           label: '預貯金',     icon: '🏦' },
    { id: 'nisa',              label: 'NISA・投資', icon: '📈' },
    { id: 'insurance_saving',  label: '積立保険',   icon: '💰' },
  ],
};

export const PAYMENT_METHODS = [
  { id: 'cash',         label: '現金',                   group: 'cash',   group_label: '現金',             visible: true  },
  { id: 'famima_card',  label: 'ファミマカード',           group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'aeon_highway', label: 'イオン首都高',             group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'eneos_card',   label: 'ENEOSカード',              group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'bic_suica',    label: 'ビックカメラSuicaカード',  group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'saison_gold',  label: 'セゾンゴールド',           group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'saison_pearl', label: 'セゾンパール',             group: 'credit', group_label: 'クレジットカード', visible: false },
  { id: 'uc_card',      label: 'UCカード',                 group: 'credit', group_label: 'クレジットカード', visible: true  },
  { id: 'paypay',       label: 'PayPay',                   group: 'ic',     group_label: '電子マネー',       visible: true  },
  { id: 'suica',        label: 'Suica',                    group: 'ic',     group_label: '電子マネー',       visible: true  },
  { id: 'bank',         label: '口座引落',                 group: 'bank',   group_label: '口座引落',         visible: false },
  { id: 'other',        label: 'その他',                   group: 'other',  group_label: 'その他',           visible: false },
];

export const EXPENSE_TYPE_LABELS = {
  fixed:    '固定費',
  variable: '変動費',
  special:  '特別費',
};
