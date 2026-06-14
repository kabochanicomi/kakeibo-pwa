import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initSync, initFromFirestore, syncNow } from './utils/sync';
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        initSync(currentUser.uid);
        try {
          await initFromFirestore(); // 新端末: Firestore → IndexedDB
        } catch (e) {
          console.warn('initFromFirestore failed', e);
        }
        syncNow().catch(console.warn); // 未同期レコードをプッシュ（非同期）
      }
      setUser(currentUser);
      setLoading(false);
    });

    const handleOnline = () => syncNow().catch(console.warn);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>;
  }

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
