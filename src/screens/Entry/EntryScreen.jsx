import { useState, useEffect, useCallback } from 'react';
import { addTransaction, updateTransaction, deleteTransaction, getTransactionsByDate } from '../../db';
import { CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';

const CATEGORY_MAP = {};
CATEGORIES.income.forEach((c) => { CATEGORY_MAP[c.id] = c; });
Object.values(CATEGORIES.expense).flat().forEach((c) => { CATEGORY_MAP[c.id] = c; });
CATEGORIES.saving.forEach((c) => { CATEGORY_MAP[c.id] = c; });
import CategoryGrid from '../../components/CategoryGrid';
import Calculator from '../../components/Calculator';
import './EntryScreen.css';

const TYPE_CONFIG = [
  { key: 'expense', label: '支出', color: '#ff758c' },
  { key: 'income',  label: '収入', color: '#00c7b7' },
  { key: 'saving',  label: '貯蓄', color: '#7b92ff' },
];

function EntryScreen({ date, onClose, onSaved, editTransaction }) {
  const [step, setStep] = useState('entry');
  const [dayTransactions, setDayTransactions] = useState([]);
  const [editingId, setEditingId] = useState(editTransaction?.id ?? null);
  const [type, setType] = useState(editTransaction?.type ?? 'expense');
  const [category, setCategory] = useState(() => {
    if (!editTransaction) return null;
    const catDef = CATEGORY_MAP[editTransaction.category] ?? {};
    return { id: editTransaction.category, label: editTransaction.category_label, expense_type: editTransaction.expense_type, group_label: catDef.group_label ?? null };
  });
  const [amount, setAmount] = useState(editTransaction?.amount ?? 0);
  const [memo, setMemo] = useState(editTransaction?.memo ?? '');
  const [paymentMethod, setPaymentMethod] = useState(editTransaction?.payment_method ?? null);

  const loadDay = useCallback(async () => {
    const data = await getTransactionsByDate(date);
    setDayTransactions(data);
  }, [date]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const resetForm = () => {
    setEditingId(null);
    setType('expense');
    setCategory(null);
    setAmount(0);
    setMemo('');
    setPaymentMethod(null);
    setStep('entry');
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setType(t.type);
    const catDef = CATEGORY_MAP[t.category] ?? {};
    setCategory({ id: t.category, label: t.category_label, expense_type: t.expense_type, group_label: catDef.group_label ?? null });
    setAmount(t.amount);
    setMemo(t.memo ?? '');
    setPaymentMethod(t.payment_method ?? null);
    setStep('entry');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteTransaction(id);
    if (editingId === id) resetForm();
    await loadDay();
    onSaved();
  };

  const handleSaveWithCat = async (cat) => {
    const payload = {
      date,
      type,
      expense_type: type === 'expense' ? (cat.expense_type ?? null) : null,
      category: cat.id,
      category_label: cat.label,
      group_label: cat.group_label ?? null,
      amount,
      payment_method: type === 'expense' ? paymentMethod : null,
      memo: memo.trim(),
    };
    if (editingId) {
      await updateTransaction(editingId, payload);
    } else {
      await addTransaction(payload);
    }
    onSaved();
    onClose();
  };

  const handlePaymentSelect = (id) => {
    if (amount === 0) { alert('金額を入力してください'); return; }
    setPaymentMethod(id);
    setStep('category');
  };

  const handleGoToCategory = () => {
    if (amount === 0) { alert('金額を入力してください'); return; }
    setStep('category');
  };

  const activeColor = TYPE_CONFIG.find((t) => t.key === type)?.color ?? '#ff758c';

  return (
    <div
      className="entry-overlay"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="entry-sheet">
        {/* Header: close + date, no save button */}
        <div className="entry-header">
          <button
            className="entry-close-btn"
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
          >
            ✕
          </button>
          <span className="entry-date-label">{date.replace(/-/g, '/')}</span>
          <div style={{ width: 30 }} />
        </div>

        {/* Type tabs - always visible */}
        <div className="entry-type-tabs">
          {TYPE_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              className={`entry-type-tab ${type === key ? 'active' : ''}`}
              style={type === key ? { borderColor: color, color, backgroundColor: color + '18' } : {}}
              onPointerDown={(e) => { e.preventDefault(); setType(key); setCategory(null); setPaymentMethod(null); }}
            >
              {label}
            </button>
          ))}
        </div>

        {step === 'entry' ? (
          <>
            {/* This day's existing entries */}
            {dayTransactions.length > 0 && (
              <div className="entry-day-list">
                {dayTransactions.map((t) => {
                  const color = TYPE_CONFIG.find((c) => c.key === t.type)?.color ?? '#333';
                  return (
                    <div key={t.id} className={`entry-day-item ${editingId === t.id ? 'editing' : ''}`}>
                      <button
                        className="entry-day-item-main"
                        onPointerDown={(e) => { e.preventDefault(); startEdit(t); }}
                      >
                        <span className="entry-day-item-cat">{t.category_label}</span>
                        <span className="entry-day-item-memo">{t.memo}</span>
                        <span className="entry-day-item-amount" style={{ color }}>
                          {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                        </span>
                      </button>
                      <button
                        className="entry-day-item-delete"
                        onPointerDown={(e) => { e.preventDefault(); handleDelete(t.id); }}
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
                {editingId && (
                  <button
                    className="entry-day-new-btn"
                    onPointerDown={(e) => { e.preventDefault(); resetForm(); }}
                  >
                    ＋ 新規登録に戻る
                  </button>
                )}
              </div>
            )}

            {/* Amount display */}
            <div className="entry-amount" style={{ color: activeColor }}>
              ¥{amount.toLocaleString()}
            </div>

            {/* Memo input */}
            <input
              className="entry-memo-input"
              type="text"
              placeholder="メモ（任意）"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />

            {/* Payment chips (expense) → tap to advance / Category nav (income, saving) */}
            {type === 'expense' ? (
              <div className="entry-payment-row">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    className={`payment-chip ${paymentMethod === m.id ? 'active' : ''}`}
                    onPointerDown={(e) => { e.preventDefault(); handlePaymentSelect(m.id); }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="entry-category-btn"
                onPointerDown={(e) => { e.preventDefault(); handleGoToCategory(); }}
              >
                <span style={{ color: category ? '#333' : '#aaa' }}>
                  {category
                    ? `${CATEGORY_MAP[category.id]?.icon ?? ''} ${category.label}`
                    : 'カテゴリを選ぶ'
                  }
                </span>
                <span className="entry-category-btn-arrow">›</span>
              </button>
            )}

            <Calculator value={amount} onChange={setAmount} />
          </>
        ) : (
          <>
            {/* Step 2: Category selection */}
            <div className="entry-step2-nav">
              <button
                className="entry-back-btn"
                onPointerDown={(e) => { e.preventDefault(); setStep('entry'); }}
              >
                ‹ 戻る
              </button>
              <span className="entry-step2-title">カテゴリを選択</span>
            </div>
            <div className="entry-middle">
              <CategoryGrid
                type={type}
                selected={category}
                onSelect={(cat) => { setCategory(cat); handleSaveWithCat(cat); }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EntryScreen;
