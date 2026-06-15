import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initSync, initFromFirestore, syncNow } from './utils/sync';
import { initPaymentMethods } from './utils/paymentSettings';
import { clearAllTransactions } from './db';
import LoginScreen from './screens/Login/LoginScreen';
import CalendarScreen from './screens/Calendar/CalendarScreen';
import ReportScreen from './screens/Report/ReportScreen';
import ImportScreen from './screens/Import/ImportScreen';
import PaymentSettingsScreen from './screens/PaymentSettings/PaymentSettingsScreen';
import AnnualReportScreen from './screens/AnnualReport/AnnualReportScreen';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'calendar' | 'report' | 'annualReport' | 'import' | 'paymentSettings'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const lastUid = localStorage.getItem('kakeibo_last_uid');
        if (lastUid && lastUid !== currentUser.uid) {
          await clearAllTransactions();
        }
        localStorage.setItem('kakeibo_last_uid', currentUser.uid);

        initSync(currentUser.uid);
        initPaymentMethods(currentUser.uid).catch(console.warn);
        try {
          // 電波が弱い環境でも最大4秒でアプリを表示する
          await Promise.race([
            initFromFirestore(),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
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
      ) : view === 'annualReport' ? (
        <AnnualReportScreen onBack={() => setView('calendar')} />
      ) : view === 'import' ? (
        <ImportScreen onBack={() => setView('calendar')} />
      ) : view === 'paymentSettings' ? (
        <PaymentSettingsScreen onBack={() => setView('calendar')} />
      ) : (
        <CalendarScreen
          onOpenReport={() => setView('report')}
          onOpenAnnualReport={() => setView('annualReport')}
          onOpenImport={() => setView('import')}
          onOpenPaymentSettings={() => setView('paymentSettings')}
        />
      )}
    </div>
  );
}

export default App;
