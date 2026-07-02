import { useState, useEffect } from 'react';
import { getTransactionsByMonth } from '../../db';
import { CATEGORIES } from '../../constants/categories';

function toYen(n) {
  if (n === 0) return '–';
  return `¥${n.toLocaleString()}`;
}

const CAT_GROUPS = [
  { label: '変動費', bg: '#fff7ed', cats: CATEGORIES.expense.variable },
  { label: '固定費', bg: '#edf4ff', cats: CATEGORIES.expense.fixed },
  { label: '特別費', bg: '#f5f0ff', cats: CATEGORIES.expense.special },
];
const FLAT_CATS = CAT_GROUPS.flatMap((g) => g.cats.map((c) => ({ ...c, groupBg: g.bg })));
const GROUP_FIRST_IDS = new Set(CAT_GROUPS.map((g) => g.cats[0].id));

// group_label（食費・交通費など）が同じ連続セルをまとめた行定義
const SUB_GROUP_ROW = (() => {
  const result = [];
  let i = 0;
  while (i < FLAT_CATS.length) {
    const gl = FLAT_CATS[i].group_label ?? null;
    let span = 1;
    if (gl) {
      while (i + span < FLAT_CATS.length && (FLAT_CATS[i + span].group_label ?? null) === gl) span++;
    }
    result.push({ label: gl, colSpan: span, groupBg: FLAT_CATS[i].groupBg, firstId: FLAT_CATS[i].id });
    i += span;
  }
  return result;
})();

function SectionTitle({ title, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'none',
        border: 'none',
        borderBottom: open ? '1px solid #f0f0f0' : 'none',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#333',
        cursor: 'pointer',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {title}
      <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '8px' }}>{open ? '▲' : '▼'}</span>
    </button>
  );
}

function AnnualReportScreen({ onBack }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [showSummary, setShowSummary] = useState(true);
  const [showCats, setShowCats] = useState(true);

  useEffect(() => {
    Promise.all(
      Array.from({ length: 12 }, (_, i) => getTransactionsByMonth(year, i + 1))
    ).then((results) => {
      setMonthlyData(results.map((txs, i) => {
        const income  = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const saving  = txs.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0);
        const byCat = {};
        txs.filter((t) => t.type === 'expense').forEach((t) => {
          byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
        });
        return { month: i + 1, income, expense, saving, balance: income - expense - saving, byCat };
      }));
    });
  }, [year]);

  const totals = monthlyData.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, saving: acc.saving + m.saving, balance: acc.balance + m.balance }),
    { income: 0, expense: 0, saving: 0, balance: 0 }
  );

  const stickyMonth = (extra = {}) => ({
    position: 'sticky',
    left: 0,
    zIndex: 2,
    whiteSpace: 'nowrap',
    ...extra,
  });

  const TH = ({ children, color }) => (
    <th style={{ padding: '10px 6px', textAlign: 'right', color: color ?? '#888', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#f7f7f7' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'linear-gradient(to right, #ff7eb3, #ff758c)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); setYear((y) => y - 1); }}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', padding: '0 4px' }}
          >‹</button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年</span>
          <button
            onPointerDown={(e) => { e.preventDefault(); setYear((y) => y + 1); }}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', padding: '0 4px' }}
          >›</button>
        </div>
        <button
          onPointerDown={(e) => { e.preventDefault(); onBack(); }}
          style={{ position: 'absolute', left: '16px', background: 'none', border: 'none', color: 'white', fontSize: '15px' }}
        >‹ 戻る</button>
      </div>

      <div style={{ padding: '16px' }}>

        {/* 月次収支 */}
        <div style={{ background: 'white', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
          <SectionTitle title="月次収支" open={showSummary} onToggle={() => setShowSummary((v) => !v)} />
          {showSummary && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#fff0f5' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#888', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>月</th>
                  <TH color="#00c7b7">収入</TH>
                  <TH color="#ff758c">支出</TH>
                  <TH color="#7b92ff">貯蓄</TH>
                  <TH color="#555">収支</TH>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(({ month, income, expense, saving, balance }) => (
                  <tr key={month} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 8px', color: '#555', fontWeight: 'bold' }}>{month}月</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: income  > 0 ? '#00c7b7' : '#ccc' }}>{toYen(income)}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: expense > 0 ? '#ff758c' : '#ccc' }}>{toYen(expense)}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: saving  > 0 ? '#7b92ff' : '#ccc' }}>{toYen(saving)}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 'bold', color: balance >= 0 ? '#333' : '#ff758c' }}>{toYen(Math.abs(balance))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9f9f9', borderTop: '2px solid #eee' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#333' }}>合計</td>
                  <td style={{ padding: '12px 6px', textAlign: 'right', color: '#00c7b7', fontWeight: 'bold' }}>{toYen(totals.income)}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'right', color: '#ff758c', fontWeight: 'bold' }}>{toYen(totals.expense)}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'right', color: '#7b92ff', fontWeight: 'bold' }}>{toYen(totals.saving)}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'right', fontWeight: 'bold', color: totals.balance >= 0 ? '#333' : '#ff758c' }}>{toYen(Math.abs(totals.balance))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* カテゴリ別支出 */}
        <div style={{ background: 'white', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
          <SectionTitle title="カテゴリ別支出" open={showCats} onToggle={() => setShowCats((v) => !v)} />
          {showCats && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  {/* 費目グループ行（固定費・変動費・特別費） */}
                  <tr style={{ background: '#fff0f5' }}>
                    <th
                      rowSpan={3}
                      style={stickyMonth({
                        padding: '8px',
                        textAlign: 'left',
                        color: '#888',
                        fontWeight: 'bold',
                        borderBottom: '2px solid #f0f0f0',
                        background: '#fff0f5',
                        zIndex: 3,
                      })}
                    >
                      月
                    </th>
                    {CAT_GROUPS.map((g) => (
                      <th
                        key={g.label}
                        colSpan={g.cats.length}
                        style={{
                          padding: '5px 4px',
                          textAlign: 'center',
                          fontSize: '10px',
                          color: '#666',
                          fontWeight: 'bold',
                          background: g.bg,
                          borderLeft: '2px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        {g.label}
                      </th>
                    ))}
                    <th
                      rowSpan={3}
                      style={{
                        padding: '8px 6px',
                        textAlign: 'center',
                        color: '#ff758c',
                        fontWeight: 'bold',
                        borderBottom: '2px solid #f0f0f0',
                        borderLeft: '2px solid #e0e0e0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      合計
                    </th>
                  </tr>
                  {/* サブグループ行（食費・交通費など） */}
                  <tr>
                    {SUB_GROUP_ROW.map((sg) => (
                      <th
                        key={sg.firstId}
                        colSpan={sg.colSpan}
                        style={{
                          padding: '3px 4px',
                          textAlign: 'center',
                          fontSize: '9px',
                          color: sg.label ? '#555' : 'transparent',
                          fontWeight: sg.label ? 'bold' : 'normal',
                          background: sg.groupBg,
                          borderBottom: '1px solid #e0e0e0',
                          borderLeft: GROUP_FIRST_IDS.has(sg.firstId) ? '2px solid #e0e0e0' : '1px solid #e8e8e8',
                        }}
                      >
                        {sg.label ?? ''}
                      </th>
                    ))}
                  </tr>
                  {/* カテゴリ名行 */}
                  <tr>
                    {FLAT_CATS.map((cat) => (
                      <th
                        key={cat.id}
                        style={{
                          padding: '4px 2px 6px',
                          textAlign: 'center',
                          color: '#555',
                          fontWeight: 'normal',
                          background: cat.groupBg,
                          borderBottom: '2px solid #e8e8e8',
                          borderLeft: GROUP_FIRST_IDS.has(cat.id) ? '2px solid #e0e0e0' : '1px solid #e8e8e8',
                          minWidth: '56px',
                          maxWidth: '56px',
                        }}
                      >
                        <div style={{ fontSize: '16px', lineHeight: 1 }}>{cat.icon}</div>
                        <div style={{ fontSize: '9px', lineHeight: 1.3, marginTop: '3px', wordBreak: 'keep-all' }}>{cat.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(({ month, byCat, expense }) => (
                    <tr key={month} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={stickyMonth({ padding: '8px', color: '#555', fontWeight: 'bold', background: 'white', borderBottom: '1px solid #f5f5f5' })}>
                        {month}月
                      </td>
                      {FLAT_CATS.map((cat) => {
                        const amt = byCat[cat.id] ?? 0;
                        return (
                          <td
                            key={cat.id}
                            style={{
                              padding: '8px 4px',
                              textAlign: 'right',
                              color: amt > 0 ? '#ff758c' : '#ddd',
                              borderLeft: GROUP_FIRST_IDS.has(cat.id) ? '2px solid #f0f0f0' : '1px solid #f0f0f0',
                            }}
                          >
                            {toYen(amt)}
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#ff758c', fontWeight: 'bold', borderLeft: '2px solid #f0f0f0' }}>
                        {toYen(expense)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #eee', background: '#f9f9f9' }}>
                    <td style={stickyMonth({ padding: '10px 8px', fontWeight: 'bold', color: '#333', background: '#f9f9f9', borderTop: '2px solid #eee' })}>
                      合計
                    </td>
                    {FLAT_CATS.map((cat) => {
                      const total = monthlyData.reduce((s, m) => s + (m.byCat[cat.id] ?? 0), 0);
                      return (
                        <td
                          key={cat.id}
                          style={{
                            padding: '10px 4px',
                            textAlign: 'right',
                            color: total > 0 ? '#ff758c' : '#ddd',
                            fontWeight: total > 0 ? 'bold' : 'normal',
                            borderLeft: GROUP_FIRST_IDS.has(cat.id) ? '2px solid #e8e8e8' : '1px solid #f0f0f0',
                          }}
                        >
                          {toYen(total)}
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#ff758c', fontWeight: 'bold', borderLeft: '2px solid #e8e8e8' }}>
                      {toYen(totals.expense)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default AnnualReportScreen;
