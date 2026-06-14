import { useState, useRef } from 'react';
import { bulkAddTransactions, clearAllTransactions } from '../../db';
import { syncNow, clearFirestoreTransactions } from '../../utils/sync';
import { mapCSVRows, PM_LABEL } from '../../utils/csvMapping';
import { EXPENSE_TYPE_LABELS } from '../../constants/categories';
import './ImportScreen.css';

function parseCSV(text) {
  const rows = [];
  let fields = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      fields.push(cur);
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      fields.push(cur);
      if (fields.some((f) => f.trim())) rows.push(fields);
      fields = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  if (fields.some((f) => f.trim())) rows.push(fields);

  if (rows.length === 0) return { headers: [], rows: [] };
  return { headers: rows[0].map((h) => h.trim()), rows: rows.slice(1) };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

function ImportScreen({ onBack }) {
  const [file, setFile] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [unknownRows, setUnknownRows] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showValid, setShowValid] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (f) => {
    if (!f) return;
    setError('');
    setFile(f);
    setValidRows([]);
    setUnknownRows([]);
    setImportResult(null);
    setShowValid(false);
    setShowUnknown(false);
    try {
      const text = await readFileAsText(f);
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setError('CSVの読み込みに失敗しました'); return; }
      const mapped = mapCSVRows(headers, rows);
      setValidRows(mapped.filter((r) => !r._unknown));
      setUnknownRows(mapped.filter((r) => r._unknown));
    } catch {
      setError('ファイルの読み込みに失敗しました');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) handleFile(f);
    else setError('CSVファイルを選択してください');
  };

  const handleImport = async () => {
    setShowMenu(false);
    const data = validRows.map(({ _unknown, _raw_bunrui, ...row }) => row);
    setImporting(true);
    try {
      const count = await bulkAddTransactions(data);
      setImportResult({ count, skipped: unknownRows.length });
      syncNow().catch(console.warn);
    } catch {
      setError('インポート中にエラーが発生しました');
    } finally {
      setImporting(false);
    }
  };

  const handleClearAll = async () => {
    setShowMenu(false);
    if (!window.confirm('全データを削除しますか？この操作は取り消せません。')) return;
    await clearAllTransactions();
    clearFirestoreTransactions().catch(console.warn);
    alert('全データを削除しました。');
  };

  const hasData = validRows.length > 0 || unknownRows.length > 0;

  return (
    <div className="import-screen">
      <div className="import-header">
        <button className="import-back-btn" onClick={onBack}>‹ 戻る</button>
        <span className="import-title">データ取り込み</span>
        <button className="import-menu-btn" onClick={() => setShowMenu((v) => !v)}>☰</button>
      </div>

      {showMenu && (
        <>
          <div className="import-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="import-menu-dropdown">
            {hasData && !importResult && (
              <button
                className="import-menu-item"
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
              >
                📥 {importing ? 'インポート中...' : `${validRows.length}件をインポート`}
              </button>
            )}
            <button className="import-menu-item import-menu-item-danger" onClick={handleClearAll}>
              🗑️ 全データ削除
            </button>
          </div>
        </>
      )}

      <div className="import-body">
        <div
          className={`import-dropzone ${file ? 'has-file' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {file ? (
            <>
              <span className="import-dropzone-name">{file.name}</span>
              <span className="import-dropzone-change">タップして変更</span>
            </>
          ) : (
            <>
              <span className="import-dropzone-hint">CSVファイルをタップして選択</span>
              <span className="import-dropzone-sub">またはここにドロップ</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {error && <p className="import-error">{error}</p>}

        {importResult && (
          <div className="import-success">
            ✅ {importResult.count}件をインポートしました
            {importResult.skipped > 0 && (
              <span className="import-success-skipped">（未対応 {importResult.skipped}件はスキップ）</span>
            )}
          </div>
        )}

        {hasData && !importResult && (
          <>
            <div className="import-summary">
              <button
                className={`import-summary-ok ${showValid ? 'active' : ''}`}
                onClick={() => setShowValid((v) => !v)}
              >
                ✅ 成功 {validRows.length}件
                <span className="import-summary-chevron">{showValid ? '▲' : '▼'}</span>
              </button>
              {unknownRows.length > 0 && (
                <button
                  className={`import-summary-fail ${showUnknown ? 'active' : ''}`}
                  onClick={() => setShowUnknown((v) => !v)}
                >
                  ⚠️ 未対応 {unknownRows.length}件
                  <span className="import-summary-chevron">{showUnknown ? '▲' : '▼'}</span>
                </button>
              )}
            </div>

            {showValid && (
              <div className="import-section">
                <p className="import-section-label">
                  マッピング成功（全{validRows.length}件）
                </p>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>内訳（店舗名）</th>
                        <th>元分類</th>
                        <th>カテゴリ</th>
                        <th>グループ</th>
                        <th>費目</th>
                        <th>金額</th>
                        <th>支払い</th>
                        <th>メモ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.date}</td>
                          <td>{row.store_name}</td>
                          <td>{row._raw_bunrui}</td>
                          <td>{row.category_label}</td>
                          <td>{row.group_label ?? '-'}</td>
                          <td>{EXPENSE_TYPE_LABELS[row.expense_type] ?? '-'}</td>
                          <td className="import-td-amount">¥{row.amount.toLocaleString()}</td>
                          <td>{PM_LABEL[row.payment_method] ?? '-'}</td>
                          <td>{row.memo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {showUnknown && unknownRows.length > 0 && (
              <div className="import-section import-section-warn">
                <p className="import-section-label">
                  未対応行（インポートされません・全{unknownRows.length}件）
                </p>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>分類（元データ）</th>
                        <th>内訳</th>
                        <th>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unknownRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.date}</td>
                          <td>{row._raw_bunrui}</td>
                          <td>{row.store_name}</td>
                          <td className="import-td-amount">¥{row.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              className="import-btn"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
            >
              {importing ? 'インポート中...' : `${validRows.length}件をインポート`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportScreen;
