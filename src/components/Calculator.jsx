const KEYS = [
  { k: 1,       sub: ''     },
  { k: 2,       sub: 'ABC'  },
  { k: 3,       sub: 'DEF'  },
  { k: 4,       sub: 'GHI'  },
  { k: 5,       sub: 'JKL'  },
  { k: 6,       sub: 'MNO'  },
  { k: 7,       sub: 'PQRS' },
  { k: 8,       sub: 'TUV'  },
  { k: 9,       sub: 'WXYZ' },
  { k: 'clear', sub: ''     },
  { k: 0,       sub: ''     },
  { k: 'del',   sub: ''     },
];

function Calculator({ value, onChange }) {
  const handlePress = (key) => {
    if (key === 'del') {
      onChange(Math.floor(value / 10));
    } else if (key === 'clear') {
      onChange(0);
    } else {
      const next = value * 10 + key;
      if (next <= 9999999) onChange(next);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1px',
      backgroundColor: '#c7c7cc',
      borderTop: '1px solid #c7c7cc',
      paddingBottom: '16px',
      flexShrink: 0,
    }}>
      {KEYS.map(({ k, sub }) => {
        const isAction = k === 'del' || k === 'clear';
        return (
          <button
            key={k}
            onPointerDown={(e) => { e.preventDefault(); handlePress(k); }}
            style={{
              height: '68px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isAction ? '#aeb0b7' : '#ffffff',
              border: 'none',
              borderRadius: '0',
              color: '#000',
              gap: '1px',
            }}
          >
            {k === 'del' ? (
              <span style={{ fontSize: '22px' }}>⌫</span>
            ) : k === 'clear' ? (
              <span style={{ fontSize: '18px', color: '#555' }}>C</span>
            ) : (
              <>
                <span style={{ fontSize: '26px', fontWeight: '400', lineHeight: 1 }}>{k}</span>
                {sub && <span style={{ fontSize: '9px', color: '#555', letterSpacing: '0.5px' }}>{sub}</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Calculator;
