import { useState } from 'react';
import { addTransaction } from '../../db';
import { PAYMENT_METHODS } from '../../constants/categories';
import CategoryGrid from '../../components/CategoryGrid';
import Calculator from '../../components/Calculator';
import './EntryScreen.css';

function EntryScreen({ date, onClose, onSaved }) {
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleSave = async () => {
    if (amount === 0) { alert('金額を入力してください'); return; }
    if (!category) { alert('カテゴリを選んでください'); return; }

    await addTransaction({
      date,
      type,
      expense_type: type === 'expense' ? (category.expense_type ?? null) : null,
      category: category.id,
      category_label: category.label,
      amount,
      payment_method: type === 'expense' ? paymentMethod : null,
      memo: memo.trim(),
    });

    onSaved();
    onClose();
  };

  const TYPE_CONFIG = [
    { key: 'expense', label: '支出', color: '#ff758c' },
    { key: 'income',  label: '収入', color: '#00c7b7' },
    { key: 'saving',  label: '貯蓄', color: '#7b92ff' },
  ];
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
            保存
          </button>
        </div>

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

        {/* Scrollable middle: categories + memo + payment */}
        <div className="entry-middle">
          <CategoryGrid type={type} selected={category} onSelect={setCategory} />

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
        </div>

        {/* Calculator (always at bottom) */}
        <Calculator value={amount} onChange={setAmount} />
      </div>
    </div>
  );
}

export default EntryScreen;
