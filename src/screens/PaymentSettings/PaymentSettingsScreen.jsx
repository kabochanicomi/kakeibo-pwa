import { useState } from 'react';
import { auth } from '../../firebase';
import { getPaymentMethods, savePaymentMethods } from '../../utils/paymentSettings';
import './PaymentSettingsScreen.css';

const GROUP_OPTIONS = [
  { id: 'cash',   label: '現金' },
  { id: 'credit', label: 'クレジットカード' },
  { id: 'ic',     label: '電子マネー' },
  { id: 'bank',   label: '口座引落' },
  { id: 'other',  label: 'その他' },
];

const GROUP_LABEL = Object.fromEntries(GROUP_OPTIONS.map((g) => [g.id, g.label]));

function PaymentSettingsScreen({ onBack }) {
  const [methods, setMethods] = useState(() => getPaymentMethods());
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newGroup, setNewGroup] = useState('other');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditingLabel(m.label);
  };

  const commitEdit = () => {
    const label = editingLabel.trim();
    if (label) {
      setMethods((prev) => prev.map((m) => m.id === editingId ? { ...m, label } : m));
    }
    setEditingId(null);
    setEditingLabel('');
  };

  const toggleVisible = (id) => {
    setMethods((prev) => prev.map((m) => m.id === id ? { ...m, visible: !m.visible } : m));
  };

  const deleteMethod = (id) => {
    if (!window.confirm('この支払い方法を削除しますか？')) return;
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const addMethod = () => {
    const label = newLabel.trim();
    if (!label) return;
    const group_label = GROUP_LABEL[newGroup];
    const id = `custom_${Date.now()}`;
    setMethods((prev) => [...prev, { id, label, group: newGroup, group_label, visible: true }]);
    setNewLabel('');
    setNewGroup('other');
    setShowAddForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePaymentMethods(auth.currentUser.uid, methods);
      onBack();
    } catch (e) {
      console.warn('savePaymentMethods failed', e);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = (m) => (
    <div key={m.id} className="ps-item">
      {editingId === m.id ? (
        <input
          className="ps-edit-input"
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
          autoFocus
        />
      ) : (
        <button className="ps-item-label" onClick={() => startEdit(m)}>{m.label} ✎</button>
      )}
      <div className="ps-item-actions">
        <button
          className={`ps-toggle ${m.visible ? 'on' : 'off'}`}
          onClick={() => toggleVisible(m.id)}
        >
          {m.visible ? '表示' : '非表示'}
        </button>
        <button className="ps-delete-btn" onClick={() => deleteMethod(m.id)}>🗑</button>
      </div>
    </div>
  );

  const grouped = GROUP_OPTIONS
    .map((g) => ({ ...g, items: methods.filter((m) => m.group === g.id) }))
    .filter((g) => g.items.length > 0);

  const ungrouped = methods.filter((m) => !GROUP_LABEL[m.group]);

  return (
    <div className="ps-screen">
      <div className="ps-header">
        <button className="ps-back-btn" onClick={onBack}>‹ 戻る</button>
        <span className="ps-title">支払い方法の設定</span>
        <button className="ps-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="ps-body">
        {grouped.map((g) => (
          <div key={g.id} className="ps-group">
            <div className="ps-group-label">{g.label}</div>
            {g.items.map(renderItem)}
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div className="ps-group">
            <div className="ps-group-label">その他</div>
            {ungrouped.map(renderItem)}
          </div>
        )}

        {showAddForm ? (
          <div className="ps-add-form">
            <input
              className="ps-add-input"
              type="text"
              placeholder="支払い方法の名前"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
            />
            <select
              className="ps-add-select"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            <div className="ps-add-actions">
              <button
                className="ps-add-cancel"
                onClick={() => { setShowAddForm(false); setNewLabel(''); }}
              >
                キャンセル
              </button>
              <button
                className="ps-add-confirm"
                onClick={addMethod}
                disabled={!newLabel.trim()}
              >
                追加
              </button>
            </div>
          </div>
        ) : (
          <button className="ps-add-btn" onClick={() => setShowAddForm(true)}>
            ＋ 支払い方法を追加
          </button>
        )}
      </div>
    </div>
  );
}

export default PaymentSettingsScreen;
