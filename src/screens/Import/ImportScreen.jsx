import { useState, useRef } from 'react';
import { bulkAddTransactions, clearAllTransactions, getAllTransactions, deleteTransactionsWhere } from '../../db';
import { syncNow, clearFirestoreTransactions, initFromFirestore } from '../../utils/sync';
import { IMPORT_FORMATS } from '../../utils/importFormats';
import { EXPENSE_TYPE_LABELS } from '../../constants/categories';
import { auth } from '../../firebase';
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

function readFileAsText(file, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, encoding);
  });
}

function ImportScreen({ onBack }) {
  const [format, setFormat] = useState(null);
  const [file, setFile] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [unknownRows, setUnknownRows] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showValid, setShowValid] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  const [dupSkipCount, setDupSkipCount] = useState(0);
  const [dupRows, setDupRows] = useState([]);
  const [showDup, setShowDup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef(null);

  const userEmail = auth.currentUser?.email;
  const availableFormats = IMPORT_FORMATS.filter(
    (fmt) => !fmt.allowedEmails || fmt.allowedEmails.includes(userEmail)
  );

  const handleBack = () => {
    if (format && !importResult) {
      setFormat(null);
      setFile(null);
      setValidRows([]);
      setUnknownRows([]);
      setDupRows([]);
      setError('');
      setImportResult(null);
    } else {
      onBack();
    }
  };

  const handleFile = async (f) => {
    if (!f || !format) return;
    setError('');
    setFile(f);
    setValidRows([]);
    setUnknownRows([]);
    setDupRows([]);
    setImportResult(null);
    setDupSkipCount(0);
    setShowValid(false);
    setShowUnknown(false);
    setShowDup(false);
    try {
      const text = await readFileAsText(f, format.encoding ?? 'utf-8');
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setError('CSVの読み込みに失敗しました'); return; }
      let mapped = format.mapper(headers, rows);
      if (mapped.length === 0) {
        setError('対応するデータが見つかりませんでした。CSVのフォーマットを確認してください。');
        return;
      }
      if (format.filterDuplicates) {
        const existing = await getAllTransactions();
        const filtered = format.filterDuplicates(mapped, existing);
        const filteredSet = new Set(filtered);
        const skipped = mapped.filter((r) => !filteredSet.has(r));
        setDupRows(skipped);
        setDupSkipCount(skipped.length);
        mapped = filtered;
      }
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
      setImporting(false);
      setSyncing(true);
      await syncNow();
      setSyncing(false);
      setImportResult({ count, skipped: unknownRows.length });
    } catch {
      setError('インポート中にエラーが発生しました');
      setImporting(false);
      setSyncing(false);
    }
  };

  const handleClearAll = async () => {
    setShowMenu(false);
    if (!window.confirm('全データを削除しますか？この操作は取り消せません。')) return;
    await clearAllTransactions();
    clearFirestoreTransactions().catch(console.warn);
    alert('全データを削除しました。');
  };

  const handleSyncFromFirestore = async () => {
    setShowMenu(false);
    if (!navigator.onLine) { alert('オフラインのため同期できません。'); return; }
    try {
      await initFromFirestore();
      alert('Firestoreからの同期が完了しました。');
    } catch {
      alert('同期に失敗しました。');
    }
  };

  const handleDeleteCorrupted = async () => {
    setShowMenu(false);
    const count = await deleteTransactionsWhere((r) => /^\d{2}\/\d{2}\/\d{2}$/.test(r.date));
    if (count === 0) {
      alert('不正な日付のデータは見つかりませんでした。');
    } else {
      alert(`${count}件の不正なデータを削除しました。`);
      syncNow().catch(console.warn);
    }
  };

  const hasData = validRows.length > 0 || unknownRows.length > 0 || dupRows.length > 0;

  return (
    <div className="import-screen">
      <div className="import-header">
        <button className="import-back-btn" onClick={handleBack}>‹ 戻る</button>
        <span className="import-title">{format ? format.label : 'インポート'}</span>
        <button className="import-menu-btn" onClick={() => setShowMenu((v) => !v)}>☰</button>
      </div>

      {showMenu && (
        <>
          <div className="import-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="import-menu-dropdown">
            {validRows.length > 0 && !importResult && (
              <button
                className="import-menu-item"
                onClick={handleImport}
                disabled={importing || syncing}
              >
                📥 {importing ? 'インポート中...' : syncing ? 'Firestoreに同期中...' : `${validRows.length}件をインポート`}
              </button>
            )}
            <button className="import-menu-item" onClick={handleSyncFromFirestore}>
              ☁️ Firestoreから取得
            </button>
            <button className="import-menu-item" onClick={handleDeleteCorrupted}>
              🔧 不正な日付のデータを削除
            </button>
            <button className="import-menu-item import-menu-item-danger" onClick={handleClearAll}>
              🗑️ 全データ削除
            </button>
          </div>
        </>
      )}

      <div className="import-body">
        {!format ? (
          <>
            <p className="import-format-heading">取り込むCSVの種類を選択</p>
            {availableFormats.map((fmt) => (
              <button key={fmt.id} className="import-format-btn" onClick={() => setFormat(fmt)}>
                <span className="import-format-icon">{fmt.icon}</span>
                <div>
                  <div className="import-format-label">{fmt.label}</div>
                  <div className="import-format-desc">{fmt.description}</div>
                </div>
                <span className="import-format-arrow">›</span>
              </button>
            ))}
          </>
        ) : (
          <>
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

            {dupSkipCount > 0 && !importResult && (
              <p className="import-error" style={{ background: '#fff8e1', borderColor: '#ffd54f', color: '#856404' }}>
                ⚠️ 同日の高速道路データが既に存在するため {dupSkipCount}件をスキップしました
              </p>
            )}

            {importResult && (
              <div className="import-success">
                ✅ {importResult.count}件をインポートしました
                {importResult.skipped > 0 && (
                  <span className="import-success-skipped">（未対応 {importResult.skipped}件はスキップ）</span>
                )}
                {dupSkipCount > 0 && (
                  <span className="import-success-skipped">（重複 {dupSkipCount}件はスキップ）</span>
                )}
              </div>
            )}

            {hasData && !importResult && (
              <>
                <div className="import-summary">
                  {validRows.length > 0 && (
                    <button
                      className={`import-summary-ok ${showValid ? 'active' : ''}`}
                      onClick={() => setShowValid((v) => !v)}
                    >
                      ✅ 成功 {validRows.length}件
                      <span className="import-summary-chevron">{showValid ? '▲' : '▼'}</span>
                    </button>
                  )}
                  {unknownRows.length > 0 && (
                    <button
                      className={`import-summary-fail ${showUnknown ? 'active' : ''}`}
                      onClick={() => setShowUnknown((v) => !v)}
                    >
                      ⚠️ 未対応 {unknownRows.length}件
                      <span className="import-summary-chevron">{showUnknown ? '▲' : '▼'}</span>
                    </button>
                  )}
                  {dupRows.length > 0 && (
                    <button
                      className={`import-summary-dup ${showDup ? 'active' : ''}`}
                      onClick={() => setShowDup((v) => !v)}
                    >
                      🔁 既登録 {dupRows.length}件
                      <span className="import-summary-chevron">{showDup ? '▲' : '▼'}</span>
                    </button>
                  )}
                </div>

                {showValid && validRows.length > 0 && (
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

                {showDup && dupRows.length > 0 && (
                  <div className="import-section import-section-dup">
                    <p className="import-section-label">
                      既登録（スキップ・全{dupRows.length}件）
                    </p>
                    <div className="import-table-wrap">
                      <table className="import-table">
                        <thead>
                          <tr>
                            <th>日付</th>
                            <th>内訳（店舗名）</th>
                            <th>金額</th>
                            <th>メモ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dupRows.map((row, i) => (
                            <tr key={i}>
                              <td>{row.date}</td>
                              <td>{row.store_name}</td>
                              <td className="import-td-amount">¥{row.amount.toLocaleString()}</td>
                              <td>{row.memo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {validRows.length > 0 && (
                  <button
                    className="import-btn"
                    onClick={handleImport}
                    disabled={importing || syncing}
                  >
                    {importing ? 'インポート中...' : syncing ? 'Firestoreに同期中...' : `${validRows.length}件をインポート`}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ImportScreen;
