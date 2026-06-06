import { CATEGORIES, EXPENSE_TYPE_LABELS } from '../constants/categories';

function CategoryGrid({ type, selected, onSelect }) {
  if (type === 'income') return <Grid cats={CATEGORIES.income} selected={selected} onSelect={onSelect} />;
  if (type === 'saving') return <Grid cats={CATEGORIES.saving} selected={selected} onSelect={onSelect} />;

  return (
    <div>
      {['fixed', 'variable', 'special'].map((expType) => (
        <div key={expType}>
          <div style={{
            padding: '4px 12px',
            fontSize: '11px',
            color: '#999',
            backgroundColor: '#f9f9f9',
            borderTop: '1px solid #f0f0f0',
          }}>
            {EXPENSE_TYPE_LABELS[expType]}
          </div>
          <Grid
            cats={CATEGORIES.expense[expType]}
            selected={selected}
            onSelect={(cat) => onSelect({ ...cat, expense_type: expType })}
          />
        </div>
      ))}
    </div>
  );
}

function Grid({ cats, selected, onSelect }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      padding: '8px',
    }}>
      {cats.map((cat) => {
        const isSelected = selected?.id === cat.id;
        return (
          <button
            key={cat.id}
            onPointerDown={(e) => { e.preventDefault(); onSelect(cat); }}
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
