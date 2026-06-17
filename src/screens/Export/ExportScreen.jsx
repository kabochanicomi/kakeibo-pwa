import { useState } from 'react';
import { getAllTransactions } from '../../db';
import { getPaymentMethods } from '../../utils/paymentSettings';
import './ExportScreen.css';

const TYPE_LABEL = { income: '収入', expense: '支出', saving: '貯蓄' };
const EXPENSE_TYPE_LABEL = { fixed: '固定費', variable: '変動費', special: '特別費' };

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCSV(transactions, pmMap) {
  const headers = ['日付', '種別', 'カテゴリ', 'グループ', '支出区分', '金額', '支払い方法', 'お店', 'メモ'];
  const rows = transactions.map((t) =>
    [
      t.date,
      TYPE_LABEL[t.type] ?? t.type,
      t.category_label ?? '',
      t.group_label ?? '',
      EXPENSE_TYPE_LABEL[t.expense_type] ?? '',
      t.amount,
      pmMap[t.payment_method] ?? t.payment_method ?? '',
      t.store_name ?? '',
      t.memo ?? '',
    ].map(csvEscape).join(',')
  );
  return '﻿' + [headers.join(','), ...rows].join('\r\n');
}

function ExportScreen({ onBack }) {
  const [status, setStatus] = useState('');

  const exportCSV = async () => {
    setStatus('出力中...');
    const transactions = await getAllTransactions();
    transactions.sort((a, b) => a.date.localeCompare(b.date));
    const methods = getPaymentMethods();
    const pmMap = Object.fromEntries(methods.map((m) => [m.id, m.label]));
    downloadFile(toCSV(transactions, pmMap), `kakeibo_${todayStr()}.csv`, 'text/csv;charset=utf-8');
    setStatus(`${transactions.length} 件をエクスポートしました`);
  };

  const exportJSON = async () => {
    setStatus('出力中...');
    const transactions = await getAllTransactions();
    transactions.sort((a, b) => a.date.localeCompare(b.date));
    const clean = transactions.map(({ id, synced, firestoreId, yearMonth, ...rest }) => rest);
    downloadFile(JSON.stringify(clean, null, 2), `kakeibo_${todayStr()}.json`, 'application/json');
    setStatus(`${transactions.length} 件をエクスポートしました`);
  };

  const exportPaymentMethods = () => {
    const methods = getPaymentMethods();
    downloadFile(
      JSON.stringify(methods, null, 2),
      `payment_methods_${todayStr()}.json`,
      'application/json'
    );
    setStatus('支払い方法をエクスポートしました');
  };

  return (
    <div className="ex-screen">
      <div className="ex-header">
        <button className="ex-back-btn" onClick={onBack}>‹ 戻る</button>
        <span className="ex-title">エクスポート</span>
        <div style={{ width: 60 }} />
      </div>
      <div className="ex-body">
        <div className="ex-section">
          <div className="ex-section-label">取引データ</div>
          <button className="ex-btn" onClick={exportCSV}>
            <span className="ex-btn-icon">📊</span>
            <div>
              <div className="ex-btn-title">CSV でダウンロード</div>
              <div className="ex-btn-desc">Excel・Numbers で開ける形式</div>
            </div>
          </button>
          <button className="ex-btn" onClick={exportJSON}>
            <span className="ex-btn-icon">💾</span>
            <div>
              <div className="ex-btn-title">JSON でダウンロード</div>
              <div className="ex-btn-desc">バックアップ用の完全データ</div>
            </div>
          </button>
        </div>
        <div className="ex-section">
          <div className="ex-section-label">設定</div>
          <button className="ex-btn" onClick={exportPaymentMethods}>
            <span className="ex-btn-icon">💳</span>
            <div>
              <div className="ex-btn-title">支払い方法 (JSON)</div>
              <div className="ex-btn-desc">支払い方法の設定データ</div>
            </div>
          </button>
        </div>
        {status && <div className="ex-status">{status}</div>}
      </div>
    </div>
  );
}

export default ExportScreen;
