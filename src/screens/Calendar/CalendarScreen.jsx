import { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarScreen.css';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { getTransactionsByMonth, getTransactionsByDate } from '../../db';
import EntryScreen from '../Entry/EntryScreen';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTileAmount(n) {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
  return n.toLocaleString();
}

function formatDayHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];
  return `${m}月${d}日（${WEEKDAY[date.getDay()]}）`;
}

const TYPE_COLOR = { income: '#00c7b7', expense: '#ff758c', saving: '#7b92ff' };
const TYPE_SIGN  = { income: '+', expense: '-', saving: '-' };

function CalendarScreen({ onOpenReport }) {
  const [activeDate, setActiveDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTransactions, setDayTransactions] = useState([]);
  const [entryDate, setEntryDate] = useState(null);

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth() + 1;

  const loadTransactions = useCallback(async () => {
    const data = await getTransactionsByMonth(year, month);
    setTransactions(data);
  }, [year, month]);

  const loadDay = useCallback(async () => {
    if (!selectedDate) { setDayTransactions([]); return; }
    const data = await getTransactionsByDate(selectedDate);
    setDayTransactions(data);
  }, [selectedDate]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { loadDay(); }, [loadDay]);

  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const dailyMap = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { expense: 0, income: 0 };
    if (t.type === 'expense') acc[t.date].expense += t.amount;
    else if (t.type === 'income') acc[t.date].income += t.amount;
    return acc;
  }, {});

  const openEntry = (dateStr) => setEntryDate(dateStr);
  const closeEntry = () => setEntryDate(null);

  const handlePlusClick = () => openEntry(selectedDate ?? toDateStr(new Date()));

  const handleSaved = () => {
    loadTransactions();
    loadDay();
  };

  const tileContent = ({ date: d, view }) => {
    if (view !== 'month') return null;
    const day = dailyMap[toDateStr(d)];
    if (!day) return null;
    return (
      <div className="tile-amounts">
        {day.income > 0 && <span className="tile-income">+{formatTileAmount(day.income)}</span>}
        {day.expense > 0 && <span className="tile-expense">-{formatTileAmount(day.expense)}</span>}
      </div>
    );
  };

  const tileClassName = ({ date: d, view }) => {
    if (view !== 'month') return null;
    const dow = d.getDay();
    if (dow === 0) return 'tile-sunday';
    if (dow === 6) return 'tile-saturday';
    return 'tile-weekday';
  };

  return (
    <>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #ff7eb3, #ff758c)',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setActiveDate(new Date(year, month - 2, 1))}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', padding: '0 4px' }}
            >‹</button>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}年 {month}月</span>
            <button
              onClick={() => setActiveDate(new Date(year, month, 1))}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', padding: '0 4px' }}
            >›</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenReport}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.6)', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '12px' }}
            >📊 集計</button>
            <button
              onClick={() => signOut(auth)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.6)', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '12px' }}
            >ログアウト</button>
          </div>
        </div>

        {/* Monthly summary */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '10px 8px', borderBottom: '1px solid #eee',
          backgroundColor: '#fff', flexShrink: 0,
        }}>
          {[
            { label: '収入', value: summary.income,  color: '#00c7b7' },
            { label: '支出', value: summary.expense, color: '#ff758c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#aaa' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color }}>¥{value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ flexShrink: 0, padding: '4px 8px' }}>
          <Calendar
            onClickDay={(d) => setSelectedDate(toDateStr(d))}
            activeStartDate={new Date(year, month - 1, 1)}
            onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
            locale="ja-JP"
            calendarType="gregory"
prevLabel={null}
            nextLabel={null}
            prev2Label={null}
            next2Label={null}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
        </div>

        {/* Day panel */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
          {!selectedDate ? (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '24px 0', fontSize: '13px' }}>
              日付を選択してください
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>
                  {formatDayHeader(selectedDate)}
                </span>
              </div>
              {dayTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '20px 0', fontSize: '13px' }}>
                  この日の記録はありません
                </div>
              ) : (
                dayTransactions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openEntry(selectedDate)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', background: 'none', border: 'none',
                      borderBottom: '1px solid #f9f9f9', textAlign: 'left', cursor: 'pointer',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: '13px', color: '#555' }}>{t.category_label}</span>
                    {t.memo ? <span style={{ fontSize: '12px', color: '#bbb' }}>{t.memo}</span> : null}
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: TYPE_COLOR[t.type], whiteSpace: 'nowrap' }}>
                      {TYPE_SIGN[t.type]}¥{t.amount.toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </>
          )}
        </div>

        {/* FAB */}
        <button
          onClick={handlePlusClick}
          style={{
            position: 'fixed', right: '20px', bottom: '30px',
            width: '60px', height: '60px', borderRadius: '30px',
            backgroundColor: '#ff758c', color: 'white', fontSize: '28px',
            border: 'none', boxShadow: '0 4px 12px rgba(255,117,140,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10,
          }}
        >＋</button>
      </div>

      {entryDate && (
        <EntryScreen date={entryDate} onClose={closeEntry} onSaved={handleSaved} />
      )}
    </>
  );
}

export default CalendarScreen;
