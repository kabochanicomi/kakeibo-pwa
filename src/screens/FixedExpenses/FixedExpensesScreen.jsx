import { useState, useEffect } from 'react';
import { getAllFixedTemplates, addFixedTemplate, updateFixedTemplate, deleteFixedTemplate } from '../../db';
import { syncNow } from '../../utils/sync';
import { CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';
import './FixedExpensesScreen.css';

const TODAY = new Date().toISOString().slice(0, 10);

const TYPE_CONFIG = [
  { key: 'expense', label: '支出' },
  { key: 'income',  label: '収入' },
  { key: 'saving',  label: '貯蓄' },
];

const EXPENSE_TYPES = [
  { key: 'fixed',    label: '固定費' },
  { key: 'variable', label: '変動費' },
  { key: 'special',  label: '特別費' },
];

function getCategoryOptions(type, expenseType) {
  if (type === 'income') return CATEGORIES.income;
  if (type === 'saving') return CATEGORIES.saving;
  return CATEGORIES.expense[expenseType] ?? [];
}

function emptyForm() {
  return {
    name: '',
    type: 'expense',
    expense_type: 'fixed',
    category: 'housing',
    category_label: '住居費',
    group_label: '住居費',
    amount: '',
    payment_method: 'bank',
    day: 1,
    start_date: TODAY,
    end_date: '9999-12-31',
    memo: '',
  };
}

function TemplateForm({ initial, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyForm());
  const [hasEndDate, setHasEndDate] = useState(
    !!initial && initial.end_date !== '9999-12-31'
  );
  const isEdit = !!initial;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleTypeChange = (type) => {
    const cats = getCategoryOptions(type, form.expense_type);
    const first = cats[0];
    setForm((f) => ({
      ...f,
      type,
      category: first?.id ?? '',
      category_label: first?.label ?? '',
      group_label: first?.group_label ?? first?.label ?? '',
    }));
  };

  const handleExpenseTypeChange = (expenseType) => {
    const cats = getCategoryOptions(form.type, expenseType);
    const first = cats[0];
    setForm((f) => ({
      ...f,
      expense_type: expenseType,
      category: first?.id ?? '',
      category_label: first?.label ?? '',
      group_label: first?.group_label ?? first?.label ?? '',
    }));
  };

  const handleCategoryChange = (id) => {
    const cats = getCategoryOptions(form.type, form.expense_type);
    const cat = cats.find((c) => c.id === id);
    if (!cat) return;
    setForm((f) => ({
      ...f,
      category: cat.id,
      category_label: cat.label,
      group_label: cat.group_label ?? cat.label,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(String(form.amount).replace(/,/g, ''), 10);
    if (!form.name.trim()) { alert('項目名を入力してください'); return; }
    if (!amount || amount <= 0) { alert('金額を入力してください'); return; }
    if (!form.category) { alert('カテゴリを選択してください'); return; }
    onSave({ ...form, amount, day: parseInt(form.day, 10) });
  };

  const categoryOptions = getCategoryOptions(form.type, form.expense_type);

  return (
    <div className="fe-sheet-overlay" onClick={onCancel}>
      <div className="fe-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fe-sheet-handle" />
        <div className="fe-sheet-header">
          <h2 className="fe-sheet-title">{isEdit ? '固定費を編集' : '固定費を追加'}</h2>
          <button type="button" className="fe-sheet-close" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="fe-form">

          <label className="fe-label">項目名</label>
          <input
            className="fe-input"
            type="text"
            placeholder="例）家賃"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />

          <label className="fe-label">種別</label>
          <div className="fe-seg">
            {TYPE_CONFIG.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`fe-seg-btn ${form.type === key ? 'active' : ''}`}
                onClick={() => handleTypeChange(key)}
              >{label}</button>
            ))}
          </div>

          {form.type === 'expense' && (
            <>
              <label className="fe-label">費目</label>
              <div className="fe-seg">
                {EXPENSE_TYPES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`fe-seg-btn ${form.expense_type === key ? 'active' : ''}`}
                    onClick={() => handleExpenseTypeChange(key)}
                  >{label}</button>
                ))}
              </div>
            </>
          )}

          <label className="fe-label">カテゴリ</label>
          <select
            className="fe-select"
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>

          <label className="fe-label">支払い方法</label>
          <select
            className="fe-select"
            value={form.payment_method ?? ''}
            onChange={(e) => set('payment_method', e.target.value || null)}
          >
            <option value="">未設定</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          <label className="fe-label">金額（円）</label>
          <input
            className="fe-input"
            type="number"
            inputMode="numeric"
            placeholder="例）80000"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />

          <label className="fe-label">毎月何日</label>
          <input
            className="fe-input fe-input-day"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={form.day}
            onChange={(e) => set('day', e.target.value)}
          />

          <label className="fe-label">開始日</label>
          <input
            className="fe-input"
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />

          <div className="fe-end-date-row">
            <label className="fe-label" style={{ margin: 0 }}>終了日</label>
            <label className="fe-toggle-label">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (!e.target.checked) set('end_date', '9999-12-31');
                  else set('end_date', TODAY);
                }}
              />
              <span>終了日あり</span>
            </label>
          </div>
          {hasEndDate && (
            <input
              className="fe-input"
              type="date"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value || '9999-12-31')}
            />
          )}

          <label className="fe-label">メモ</label>
          <input
            className="fe-input"
            type="text"
            placeholder="任意"
            value={form.memo}
            onChange={(e) => set('memo', e.target.value)}
          />

          <div className="fe-form-actions">
            {isEdit && (
              <button type="button" className="fe-btn-delete" onClick={onDelete}>
                削除
              </button>
            )}
            <button type="submit" className="fe-btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FixedExpensesScreen({ onBack }) {
  const [templates, setTemplates] = useState([]);
  const [formTarget, setFormTarget] = useState(null); // null=closed, 'new'=add, object=edit
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await getAllFixedTemplates();
    data.sort((a, b) => a.day - b.day);
    setTemplates(data);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (formTarget === 'new') {
        await addFixedTemplate(formData);
      } else {
        await updateFixedTemplate(formTarget.id, formData);
      }
      await syncNow().catch(console.warn);
      await load();
      setFormTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('この固定費を削除しますか？\n（既に生成済みの取引は残ります）')) return;
    await deleteFixedTemplate(formTarget.id);
    await syncNow().catch(console.warn);
    await load();
    setFormTarget(null);
  };

  const formInitial = formTarget === 'new' ? null : formTarget;

  return (
    <div className="fe-screen">
      <div className="fe-header">
        <button className="fe-back-btn" onClick={onBack}>‹ 戻る</button>
        <span className="fe-title">固定費の管理</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="fe-body">
        {templates.length === 0 ? (
          <p className="fe-empty">固定費が登録されていません</p>
        ) : (
          templates.map((t) => (
            <button key={t.id} className="fe-item" onClick={() => setFormTarget(t)}>
              <div className="fe-item-main">
                <span className="fe-item-name">{t.name}</span>
                <span className="fe-item-meta">{t.category_label} · 毎月{t.day}日</span>
                <span className="fe-item-dates">
                  {t.start_date} 〜 {t.end_date === '9999-12-31' ? '未定' : t.end_date}
                </span>
              </div>
              <span className="fe-item-amount">¥{t.amount.toLocaleString()}</span>
              <span className="fe-item-arrow">›</span>
            </button>
          ))
        )}
      </div>

      <button className="fe-fab" onClick={() => setFormTarget('new')}>＋</button>

      {formTarget !== null && (
        <TemplateForm
          initial={formInitial}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => !saving && setFormTarget(null)}
        />
      )}
    </div>
  );
}

export default FixedExpensesScreen;
