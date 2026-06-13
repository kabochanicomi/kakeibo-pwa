import { useState } from 'react';

const KEYPAD_KEYS = [
  { k: 1, sub: '' }, { k: 2, sub: 'ABC' }, { k: 3, sub: 'DEF' },
  { k: 4, sub: 'GHI' }, { k: 5, sub: 'JKL' }, { k: 6, sub: 'MNO' },
  { k: 7, sub: 'PQRS' }, { k: 8, sub: 'TUV' }, { k: 9, sub: 'WXYZ' },
  { k: null, sub: '' }, { k: 0, sub: '' }, { k: 'del', sub: '' },
];

// [col, row, colSpan, rowSpan, key, label]
const CALC_CELLS = [
  [1, 1, 1, 1, 'C',  'C' ],
  [2, 1, 1, 1, '÷',  '÷' ],
  [3, 1, 1, 1, '×',  '×' ],
  [1, 2, 1, 1, 7,    '7' ],
  [2, 2, 1, 1, 8,    '8' ],
  [3, 2, 1, 1, 9,    '9' ],
  [4, 2, 1, 1, '−',  '−' ],
  [1, 3, 1, 1, 4,    '4' ],
  [2, 3, 1, 1, 5,    '5' ],
  [3, 3, 1, 1, 6,    '6' ],
  [4, 3, 1, 1, '+',  '+' ],
  [1, 4, 1, 1, 1,    '1' ],
  [2, 4, 1, 1, 2,    '2' ],
  [3, 4, 1, 1, 3,    '3' ],
  [4, 4, 1, 2, '=',  '=' ],
  [1, 5, 2, 1, 0,    '0' ],
  [3, 5, 1, 1, 'del','⌫' ],
];

function calc(a, b, op) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return b !== 0 ? a / b : 0;
  return b;
}

const KEY_BASE = {
  border: 'none',
  borderRadius: '10px',
  boxShadow: '0 1px 0 rgba(0,0,0,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

function Calculator({ value, onChange }) {
  const [mode, setMode] = useState('keypad');
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp]   = useState(null);
  const [waiting, setWaiting] = useState(false);

  const handleKeypad = (k) => {
    if (k === null) return;
    if (k === 'del') { onChange(Math.floor(value / 10)); return; }
    const next = value * 10 + k;
    if (next <= 9999999) onChange(next);
  };

  const handleCalc = (k) => {
    if (typeof k === 'number') {
      if (waiting) { setDisplay(String(k)); setWaiting(false); }
      else {
        const next = display === '0' ? String(k) : display + k;
        if (next.length <= 10) setDisplay(next);
      }
      return;
    }
    if (k === 'C') {
      setDisplay('0'); setPrev(null); setOp(null); setWaiting(false);
      onChange(0); return;
    }
    if (k === 'del') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0'); return;
    }
    if (['+', '−', '×', '÷'].includes(k)) {
      const cur = parseFloat(display);
      if (prev !== null && !waiting) {
        const res = Math.round(calc(prev, cur, op));
        setDisplay(String(Math.max(0, res)));
        setPrev(Math.max(0, res));
        onChange(Math.max(0, res));
      } else {
        setPrev(cur);
      }
      setOp(k); setWaiting(true); return;
    }
    if (k === '=') {
      if (prev !== null && op) {
        const res = Math.round(calc(prev, parseFloat(display), op));
        const clamped = Math.max(0, res);
        setDisplay(String(clamped));
        onChange(clamped);
        setPrev(null); setOp(null); setWaiting(true);
      }
    }
  };

  const toCalc = () => {
    setDisplay(value > 0 ? String(value) : '0');
    setPrev(null); setOp(null); setWaiting(false);
    setMode('calc');
  };

  const toKeypad = () => setMode('keypad');

  const TOOLBAR = (
    <div style={{ display: 'flex', padding: '6px 8px 2px' }}>
      <button
        onPointerDown={(e) => { e.preventDefault(); mode === 'keypad' ? toCalc() : toKeypad(); }}
        style={{ ...KEY_BASE, backgroundColor: '#fff', padding: '4px 10px', fontSize: '16px', gap: '4px' }}
      >
        {mode === 'keypad' ? '⊞' : '⌨'}
        <span style={{ fontSize: '11px', color: '#555' }}>{mode === 'keypad' ? '電卓' : 'テンキー'}</span>
      </button>
    </div>
  );

  if (mode === 'keypad') {
    return (
      <div style={{ backgroundColor: '#d1d1d6', flexShrink: 0 }}>
        {TOOLBAR}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '4px 8px 24px' }}>
          {KEYPAD_KEYS.map(({ k, sub }, i) => {
            if (k === null) return <div key={i} />;
            return (
              <button
                key={k}
                onPointerDown={(e) => { e.preventDefault(); handleKeypad(k); }}
                style={{ ...KEY_BASE, height: '72px', backgroundColor: '#fff', color: '#000', flexDirection: 'column', gap: '2px' }}
              >
                {k === 'del' ? (
                  <span style={{ fontSize: '22px' }}>⌫</span>
                ) : (
                  <>
                    <span style={{ fontSize: '28px', fontWeight: '300', lineHeight: 1 }}>{k}</span>
                    {sub && <span style={{ fontSize: '10px', color: '#8e8e93', letterSpacing: '1px' }}>{sub}</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Calculator mode
  const isOp = (k) => ['+', '−', '×', '÷'].includes(k);
  return (
    <div style={{ backgroundColor: '#d1d1d6', flexShrink: 0 }}>
      {TOOLBAR}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(5, 68px)',
        gap: '8px',
        padding: '4px 8px 24px',
      }}>
        {CALC_CELLS.map(([col, row, cs, rs, k, label]) => {
          const bgColor = k === '=' ? '#ff758c' : isOp(k) ? '#ff9f6e' : k === 'C' ? '#a5a5aa' : '#fff';
          const txtColor = (k === '=' || isOp(k) || k === 'C') ? '#fff' : '#000';
          return (
            <button
              key={k}
              onPointerDown={(e) => { e.preventDefault(); handleCalc(k); }}
              style={{
                ...KEY_BASE,
                gridColumn: cs > 1 ? `${col} / span ${cs}` : col,
                gridRow:    rs > 1 ? `${row} / span ${rs}` : row,
                backgroundColor: bgColor,
                color: txtColor,
                fontSize: k === 'del' ? '20px' : '24px',
                fontWeight: isOp(k) || k === '=' ? '400' : '300',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calculator;
