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

function EntryScreen({ date, onClose, onSaved }) {
  const [dayTransactions, setDayTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

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
    setPaymentMethod('cash');
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setType(t.type);
    const catDef = CATEGORY_MAP[t.category] ?? {};
    setCategory({ id: t.category, label: t.category_label, expense_type: t.expense_type, group_label: catDef.group_label ?? null });
    setAmount(t.amount);
    setMemo(t.memo ?? '');
    setPaymentMethod(t.payment_method ?? 'cash');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteTransaction(id);
    if (editingId === id) resetForm();
    await loadDay();
    onSaved();
  };

  const handleSave = async () => {
    if (amount === 0) { alert('金額を入力してください'); return; }
    if (!category) { alert('カテゴリを選んでください'); return; }

    const payload = {
      date,
      type,
      expense_type: type === 'expense' ? (category.expense_type ?? null) : null,
      category: category.id,
      category_label: category.label,
      group_label: category.group_label ?? null,
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

  const activeColor = TYPE_CONFIG.find((t) => t.key === type)?.color ?? '#ff758c';

  return (
    <div
      className="entry-overlay"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="entry-sheet">
        {/* Header */}
        <div className="entry-header">
          <button
            className="entry-close-btn"
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
          >
            ✕
          </button>
          <span className="entry-date-label">{date.replace(/-/g, '/')}</span>
          <button
            className="entry-save-btn"
            onPointerDown={(e) => { e.preventDefault(); handleSave(); }}
          >
            {editingId ? '更新' : '保存'}
          </button>
        </div>

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

        {/* Type tabs */}
        <div className="entry-type-tabs">
          {TYPE_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              className={`entry-type-tab ${type === key ? 'active' : ''}`}
              style={type === key ? { borderColor: color, color, backgroundColor: color + '18' } : {}}
              onPointerDown={(e) => { e.preventDefault(); setType(key); setCategory(null); }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount display */}
        <div className="entry-amount" style={{ color: activeColor }}>
          ¥{amount.toLocaleString()}
        </div>

        {/* Scrollable middle: categories only */}
        <div className="entry-middle">
          <CategoryGrid type={type} selected={category} onSelect={setCategory} />
        </div>

        {/* Fixed area: memo + payment + calculator */}
        <input
          className="entry-memo-input"
          type="text"
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {type === 'expense' && (
          <div className="entry-payment-row">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                className={`payment-chip ${paymentMethod === m.id ? 'active' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); setPaymentMethod(m.id); }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <Calculator value={amount} onChange={setAmount} />
      </div>
    </div>
  );
}

export default EntryScreen;
