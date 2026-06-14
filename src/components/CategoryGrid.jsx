import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, EXPENSE_TYPE_LABELS } from '../constants/categories';

const EXPENSE_TYPE_ORDER = ['variable', 'fixed', 'special'];
const DEFAULT_OPEN = { variable: true, fixed: false, special: false };

function CategoryGrid({ type, selected, onSelect }) {
  const [openTypes, setOpenTypes] = useState(DEFAULT_OPEN);

  // 編集対象のカテゴリが折りたたまれた区分にある場合は自動で開く
  useEffect(() => {
    if (type === 'expense' && selected?.expense_type) {
      setOpenTypes((prev) => (prev[selected.expense_type] ? prev : { ...prev, [selected.expense_type]: true }));
    }
  }, [type, selected]);

  const toggleType = (expType) => setOpenTypes((prev) => ({ ...prev, [expType]: !prev[expType] }));

  if (type === 'income') return <Grid cats={CATEGORIES.income} selected={selected} onSelect={onSelect} />;
  if (type === 'saving') return <Grid cats={CATEGORIES.saving} selected={selected} onSelect={onSelect} />;

  return (
    <div>
      {EXPENSE_TYPE_ORDER.map((expType) => {
        const open = openTypes[expType];
        return (
          <div key={expType}>
            <button
              onPointerDown={(e) => { e.preventDefault(); toggleType(expType); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                color: '#999',
                backgroundColor: '#f9f9f9',
                borderTop: '1px solid #f0f0f0',
                border: 'none',
                borderTopStyle: 'solid',
                textAlign: 'left',
              }}
            >
              <span>{open ? '▾' : '▸'}</span>
              <span>{EXPENSE_TYPE_LABELS[expType]}</span>
            </button>
            {open && (
              <Grid
                cats={CATEGORIES.expense[expType]}
                selected={selected}
                onSelect={(cat) => onSelect({ ...cat, expense_type: expType })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Grid({ cats, selected, onSelect }) {
  const touchStart = useRef(null);
  const [pressedId, setPressedId] = useState(null);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      padding: '8px',
    }}>
      {cats.map((cat) => {
        const isSelected = selected?.id === cat.id;
        const isPressed = pressedId === cat.id;
        return (
          <button
            key={cat.id}
            onPointerDown={(e) => {
              touchStart.current = { x: e.clientX, y: e.clientY };
              setPressedId(cat.id);
            }}
            onPointerUp={(e) => {
              if (!touchStart.current) return;
              const dx = Math.abs(e.clientX - touchStart.current.x);
              const dy = Math.abs(e.clientY - touchStart.current.y);
              touchStart.current = null;
              setPressedId(null);
              if (dx < 10 && dy < 10) onSelect(cat);
            }}
            onPointerCancel={() => { touchStart.current = null; setPressedId(null); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              margin: '2px',
              borderRadius: '10px',
              border: isSelected ? '2px solid #ff758c' : '1px solid transparent',
              backgroundColor: isSelected ? '#fff0f5' : 'transparent',
              fontSize: '11px',
              color: isSelected ? '#ff758c' : '#555',
              filter: isPressed ? 'brightness(0.88)' : undefined,
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{cat.icon}</span>
            <span style={{ marginTop: '4px', textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryGrid;
