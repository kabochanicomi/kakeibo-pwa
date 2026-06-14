export const CATEGORIES = {
  income: [
    { id: 'salary',      label: '給与・賞与', icon: '💼' },
    { id: 'side_income', label: '副収入',     icon: '💻' },
    { id: 'temporary',   label: '一時収入',   icon: '🎁' },
    { id: 'other_income',label: 'その他',     icon: '📥' },
  ],
  expense: {
    fixed: [
      { id: 'housing',      label: '住居費',   icon: '🏠' },
      { id: 'communication',label: '通信費',   icon: '📱' },
      { id: 'insurance',    label: '保険料',   icon: '🛡️' },
      { id: 'loan',         label: 'ローン',   icon: '🏦' },
      { id: 'subscription', label: 'サブスク', icon: '📺' },
    ],
    variable: [
      { id: 'food_morning', label: '食費（朝食）',   icon: '🍳', group: 'food', group_label: '食費' },
      { id: 'food_lunch',   label: '食費（昼食）',   icon: '🍱', group: 'food', group_label: '食費' },
      { id: 'food_dinner',  label: '食費（夕食）',   icon: '🍽️', group: 'food', group_label: '食費' },
      { id: 'food_other',   label: '食費（その他）', icon: '🛒', group: 'food', group_label: '食費' },
{ id: 'daily',         label: '日用品',     icon: '🧴' },
      { id: 'expressway',    label: '高速道路',   icon: '🛣️', group: 'transport', group_label: '交通費' },
      { id: 'parking',       label: '駐車場',     icon: '🅿️', group: 'transport', group_label: '交通費' },
      { id: 'transit',       label: '交通機関',   icon: '🚃', group: 'transport', group_label: '交通費' },
      { id: 'fuel',          label: 'ガソリン代', icon: '⛽', group: 'transport', group_label: '交通費' },
      { id: 'medical',       label: '医療・健康', icon: '🏥' },
      { id: 'clothing',      label: '衣服・美容', icon: '👗' },
      { id: 'entertainment', label: '娯楽・趣味', icon: '🎮' },
      { id: 'social',        label: '交際費',     icon: '🍻' },
      { id: 'education',     label: '教育',       icon: '📚' },
      { id: 'other_variable',label: 'その他',     icon: '📦' },
    ],
    special: [
      { id: 'ceremony',      label: '冠婚葬祭',   icon: '💐' },
      { id: 'travel',        label: '旅行',       icon: '✈️' },
      { id: 'appliance',     label: '家電・家具', icon: '🏡' },
      { id: 'car',           label: '車両費',     icon: '🚗' },
      { id: 'other_special', label: 'その他特別費', icon: '⭐' },
    ],
  },
  saving: [
    { id: 'deposit',           label: '預貯金',     icon: '🏦' },
    { id: 'nisa',              label: 'NISA・投資', icon: '📈' },
    { id: 'insurance_saving',  label: '積立保険',   icon: '💰' },
  ],
};

export const PAYMENT_METHODS = [
  { id: 'cash',         label: '現金',          group: 'cash',   group_label: '現金' },
  { id: 'famima_card',  label: 'ファミマカード', group: 'credit', group_label: 'クレジットカード' },
  { id: 'aeon_highway', label: 'イオン首都高',         group: 'credit', group_label: 'クレジットカード' },
  { id: 'eneos_card',   label: 'ENEOSカード',          group: 'credit', group_label: 'クレジットカード' },
  { id: 'bic_suica',    label: 'ビックカメラSuicaカード', group: 'credit', group_label: 'クレジットカード' },
  { id: 'saison_gold',  label: 'セゾンゴールド',         group: 'credit', group_label: 'クレジットカード' },
  { id: 'saison_pearl', label: 'セゾンパール',           group: 'credit', group_label: 'クレジットカード' },
  { id: 'uc_card',      label: 'UCカード',               group: 'credit', group_label: 'クレジットカード' },
  { id: 'paypay',       label: 'PayPay',         group: 'ic',     group_label: '電子マネー' },
  { id: 'suica',        label: 'Suica',          group: 'ic',     group_label: '電子マネー' },
  { id: 'bank',         label: '口座引落',       group: 'bank',   group_label: '口座引落' },
  { id: 'other',        label: 'その他',         group: 'other',  group_label: 'その他' },
];

export const EXPENSE_TYPE_LABELS = {
  fixed:    '固定費',
  variable: '変動費',
  special:  '特別費',
};
