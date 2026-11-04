import { useState, useEffect, useCallback } from 'react';
import { getTransactionsByMonth } from '../../db';
import { EXPENSE_TYPE_LABELS } from '../../constants/categories';
import './ReportScreen.css';

const EXPENSE_TYPE_COLORS = {
  fixed: '#7b92ff',
  variable: '#ff9f43',
  special: '#ff758c',
};

function toYen(n) {
  return `¥${Math.round(n).toLocaleString()}`;
}

function ReportScreen({ onBack }) {
  const [activeDate, setActiveDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [openTypes, setOpenTypes] = useState({ fixed: false, variable: true, special: false });
  const [detailGroup, setDetailGroup] = useState(null); // タップしたgroup_label

  const toggleType = (key) => setOpenTypes((prev) => ({ ...prev, [key]: !prev[key] }));

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth() + 1;

  const load = useCallback(async () => {
    const data = await getTransactionsByMonth(year, month);
    setTransactions(data);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const saving = transactions.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense - saving;
  const savingsRate = income > 0 ? (saving / income) * 100 : 0;

  const expenseByType = ['variable', 'fixed', 'special'].map((key) => {
    const typeTransactions = transactions.filter((t) => t.type === 'expense' && t.expense_type === key);
    const amount = typeTransactions.reduce((s, t) => s + t.amount, 0);
    const categoryTotals = {};
    typeTransactions.forEach((t) => {
      const label = t.group_label || t.category_label;
      categoryTotals[label] = (categoryTotals[label] || 0) + t.amount;
    });
    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    return { key, label: EXPENSE_TYPE_LABELS[key], amount, pct: expense > 0 ? (amount / expense) * 100 : 0, categories };
  });

  const categoryTotals = {};
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const label = t.group_label || t.category_label;
    categoryTotals[label] = (categoryTotals[label] || 0) + t.amount;
  });
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const detailTransactions = detailGroup
    ? transactions
        .filter((t) => t.type === 'expense' && (t.group_label || t.category_label) === detailGroup)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div className="report-screen">
      <div className="report-header">
        <button className="report-back-btn" onPointerDown={(e) => { e.preventDefault(); onBack(); }}>‹ 戻る</button>
        <div className="report-month-nav">
          <button onPointerDown={(e) => { e.preventDefault(); setActiveDate(new Date(year, month - 2, 1)); }}>‹</button>
          <span>{year}年 {month}月</span>
          <button onPointerDown={(e) => { e.preventDefault(); setActiveDate(new Date(year, month, 1)); }}>›</button>
        </div>
        <span style={{ width: 50 }} />
      </div>

      <div className="report-body">
        <div className="report-card">
          <div className="report-card-title">収支サマリー</div>
          <div className="report-summary-grid">
            <div><span className="label">収入</span><span className="value income">{toYen(income)}</span></div>
            <div><span className="label">支出</span><span className="value expense">{toYen(expense)}</span></div>
            <div><span className="label">貯蓄</span><span className="value saving">{toYen(saving)}</span></div>
            <div><span className="label">収支</span><span className={`value ${balance >= 0 ? 'plus' : 'minus'}`}>{toYen(balance)}</span></div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-title">貯蓄率</div>
          <div className="report-rate-row">
            <span className="report-rate-value">{savingsRate.toFixed(1)}%</span>
            <span className="report-rate-hint">FPの目安：手取りの10〜20%</span>
          </div>
          <div className="report-rate-bar">
            <div className="report-rate-bar-fill" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-title">支出の内訳（固定費・変動費・特別費）</div>
          {expenseByType.map(({ key, label, amount, pct, categories }) => {
            const open = openTypes[key];
            return (
              <div className="report-breakdown-row" key={key}>
                <button
                  className="report-breakdown-label report-breakdown-toggle"
                  onPointerDown={(e) => { e.preventDefault(); toggleType(key); }}
                >
                  <span>{open ? '▾' : '▸'} {label}</span>
                  <span>{toYen(amount)}（{pct.toFixed(0)}%）</span>
                </button>
                <div className="report-breakdown-bar">
                  <div
                    className="report-breakdown-bar-fill"
                    style={{ width: `${pct}%`, background: EXPENSE_TYPE_COLORS[key] }}
                  />
                </div>
                {open && (
                  <div className="report-breakdown-detail">
                    {categories.length === 0 && <div className="report-empty">データがありません</div>}
                    {categories.map(([catLabel, catAmount]) => (
                      <div className="report-breakdown-detail-row" key={catLabel}>
                        <span>{catLabel}</span>
                        <span>{toYen(catAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="report-card">
          <div className="report-card-title">支出カテゴリ ランキング TOP5</div>
          {topCategories.length === 0 && <div className="report-empty">データがありません</div>}
          {topCategories.map(([label, amount], i) => (
            <div
              className="report-rank-row"
              key={label}
              onClick={() => setDetailGroup(label)}
            >
              <span className="report-rank-num">{i + 1}</span>
              <span className="report-rank-label">{label}</span>
              <span className="report-rank-amount">{toYen(amount)}</span>
              <span style={{ color: '#ccc', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {detailGroup && (
        <div className="report-detail-overlay" onClick={() => setDetailGroup(null)}>
          <div className="report-detail-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="report-detail-header">
              <span className="report-detail-title">{detailGroup}</span>
              <span className="report-detail-total">
                {toYen(detailTransactions.reduce((s, t) => s + t.amount, 0))}
              </span>
              <button className="report-detail-close" onClick={() => setDetailGroup(null)}>✕</button>
            </div>
            <div className="report-detail-list">
              {detailTransactions.map((t) => (
                <div className="report-detail-item" key={t.id}>
                  <span className="report-detail-item-date">{t.date.slice(5).replace('-', '/')}</span>
                  <span className="report-detail-item-name">{t.store_name || t.category_label}</span>
                  {t.memo ? <span style={{ fontSize: 11, color: '#bbb' }}>{t.memo}</span> : null}
                  <span className="report-detail-item-amount">{toYen(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportScreen;
