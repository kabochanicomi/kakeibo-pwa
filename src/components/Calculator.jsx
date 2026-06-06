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

  const keys = [7, 8, 9, 4, 5, 6, 1, 2, 3, 'clear', 0, 'del'];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      borderTop: '1px solid #eee',
      flexShrink: 0,
    }}>
      {keys.map((key) => (
        <button
          key={key}
          onPointerDown={(e) => { e.preventDefault(); handlePress(key); }}
          style={{
            height: '60px',
            fontSize: key === 'del' ? '20px' : '22px',
            fontWeight: 'bold',
            backgroundColor: key === 'clear' ? '#fff0f5' : '#fff',
            border: 'none',
            borderRight: '1px solid #eee',
            borderBottom: '1px solid #eee',
            color: key === 'del' || key === 'clear' ? '#ff758c' : '#333',
          }}
        >
          {key === 'del' ? '⌫' : key === 'clear' ? 'C' : key}
        </button>
      ))}
    </div>
  );
}

export default Calculator;
