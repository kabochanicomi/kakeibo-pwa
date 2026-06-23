import { useState, useEffect, useCallback, useRef } from 'react';
import { addTransaction, updateTransaction, deleteTransaction, getTransactionsByDate } from '../../db';
import { syncNow } from '../../utils/sync';
import { getPaymentMethods } from '../../utils/paymentSettings';
import { CATEGORIES } from '../../constants/categories';

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
  const [storeName, setStoreName] = useState(editTransaction?.store_name ?? '');
  const [paymentMethod, setPaymentMethod] = useState(editTransaction?.payment_method ?? null);
  const chipTouchStart = useRef(null);
  const [pressedChipId, setPressedChipId] = useState(null);

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
    setStoreName('');
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
    setStoreName(t.store_name ?? '');
    setPaymentMethod(t.payment_method ?? null);
    setStep('entry');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteTransaction(id);
    if (editingId === id) resetForm();
    await loadDay();
    onSaved();
    syncNow().catch(console.warn);
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
      store_name: storeName.trim(),
      memo: memo.trim(),
    };
    if (editingId) {
      await updateTransaction(editingId, payload);
    } else {
      await addTransaction(payload);
    }
    onSaved();
    onClose();
    syncNow().catch(console.warn);
  };

  const handlePaymentSelect = (id) => {
    setPaymentMethod(id);
    setStep('category');
  };

  const handleGoToCategory = () => {
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
          <span className="entry-date-label">{(() => {
            const [y, m, d] = date.split('-').map(Number);
            const dow = ['日','月','火','水','木','金','土'][new Date(y, m - 1, d).getDay()];
            return `${y}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}（${dow}）`;
          })()}</span>
          {editingId ? (
            <button
              className="entry-delete-btn"
              onPointerDown={(e) => { e.preventDefault(); handleDelete(editingId); }}
            >🗑</button>
          ) : (
            <div style={{ width: 30 }} />
          )}
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
            {/* Day history removed — editing/deleting is done from the calendar day panel */}

            {/* Scrollable middle: amount + inputs + payment — keeps Calculator pinned at bottom */}
            <div className="entry-scroll-area">
              {/* Amount display */}
              <div className="entry-amount" style={{ color: activeColor }}>
                ¥{amount.toLocaleString()}
              </div>

              {/* Store name input */}
              <input
                className="entry-memo-input"
                type="text"
                placeholder="店名（任意）"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />

              {/* Memo input */}
              <textarea
                className="entry-memo-input entry-memo-textarea"
                placeholder="メモ（任意）"
                value={memo}
                rows={2}
                onChange={(e) => setMemo(e.target.value)}
              />

              {/* Payment chips (expense) → tap to advance / Category nav (income, saving) */}
              {type === 'expense' ? (
                <div className="entry-payment-row">
                  {getPaymentMethods().filter((m) => m.visible).map((m) => (
                    <button
                      key={m.id}
                      className={`payment-chip ${paymentMethod === m.id ? 'active' : ''} ${pressedChipId === m.id ? 'pressing' : ''}`}
                      onPointerDown={(e) => {
                        chipTouchStart.current = { x: e.clientX, y: e.clientY };
                        setPressedChipId(m.id);
                      }}
                      onPointerUp={(e) => {
                        if (!chipTouchStart.current) return;
                        const dx = Math.abs(e.clientX - chipTouchStart.current.x);
                        const dy = Math.abs(e.clientY - chipTouchStart.current.y);
                        chipTouchStart.current = null;
                        setPressedChipId(null);
                        if (dx < 10 && dy < 10) handlePaymentSelect(m.id);
                      }}
                      onPointerCancel={() => { chipTouchStart.current = null; setPressedChipId(null); }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="entry-category-btn"
                  onPointerUp={() => handleGoToCategory()}
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
            </div>

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
