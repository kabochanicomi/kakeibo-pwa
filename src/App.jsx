import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginScreen from './screens/Login/LoginScreen';
import CalendarScreen from './screens/Calendar/CalendarScreen';
import ReportScreen from './screens/Report/ReportScreen';
import ImportScreen from './screens/Import/ImportScreen';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'calendar' | 'report' | 'import'

  useEffect(() => {
    // ログイン状態を監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 状態が決まったら読み込み終了
    });
    return () => unsubscribe();
  }, []);

  // 読み込み中は真っ白な画面を表示（またはローディングアイコン）
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>;
  }

  // ログインしていなければログイン画面、していればカレンダー or 集計画面を表示
  return (
    <div style={{ fontFamily: 'sans-serif', height: '100vh', margin: 0 }}>
      {!user ? (
        <LoginScreen />
      ) : view === 'report' ? (
        <ReportScreen onBack={() => setView('calendar')} />
      ) : view === 'import' ? (
        <ImportScreen onBack={() => setView('calendar')} />
      ) : (
        <CalendarScreen
          onOpenReport={() => setView('report')}
          onOpenImport={() => setView('import')}
        />
      )}
    </div>
  );
}

export default App;