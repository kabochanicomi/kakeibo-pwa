import { useState, useEffect } from 'react';
import { getTransactionsByMonth } from '../../db';

function toYen(n) {
  if (n === 0) return '–';
  return `¥${n.toLocaleString()}`;
}

function AnnualReportScreen({ onBack }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    Promise.all(
      Array.from({ length: 12 }, (_, i) => getTransactionsByMonth(year, i + 1))
    ).then((results) => {
      setMonthlyData(results.map((txs, i) => {
        const income  = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const saving  = txs.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0);
        return { month: i + 1, income, expense, saving, balance: income - expense - saving };
      }));
    });
  }, [year]);

  const totals = monthlyData.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, saving: acc.saving + m.saving, balance: acc.balance + m.balance }),
    { income: 0, expense: 0, saving: 0, balance: 0 }
  );

  const TH = ({ children, color }) => (
    <th style={{ padding: '10px 6px', textAlign: 'right', color: color ?? '#888', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f7f7' }}>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(to right, #ff7eb3, #ff758c)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
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
                  <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 'bold', color: balance >= 0 ? '#333' : '#ff758c' }}>{toYen(balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f9f9f9', borderTop: '2px solid #eee' }}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#333' }}>合計</td>
                <td style={{ padding: '12px 6px', textAlign: 'right', color: '#00c7b7', fontWeight: 'bold' }}>{toYen(totals.income)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'right', color: '#ff758c', fontWeight: 'bold' }}>{toYen(totals.expense)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'right', color: '#7b92ff', fontWeight: 'bold' }}>{toYen(totals.saving)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'right', fontWeight: 'bold', color: totals.balance >= 0 ? '#333' : '#ff758c' }}>{toYen(totals.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnnualReportScreen;
