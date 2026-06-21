import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initSync, initFromFirestore, syncNow, initFixedTemplatesFromFirestore } from './utils/sync';
import { initPaymentMethods } from './utils/paymentSettings';
import { clearAllTransactions } from './db';
import LoginScreen from './screens/Login/LoginScreen';
import CalendarScreen from './screens/Calendar/CalendarScreen';
import ReportScreen from './screens/Report/ReportScreen';
import ImportScreen from './screens/Import/ImportScreen';
import PaymentSettingsScreen from './screens/PaymentSettings/PaymentSettingsScreen';
import ExportScreen from './screens/Export/ExportScreen';
import AnnualReportScreen from './screens/AnnualReport/AnnualReportScreen';
import FixedExpensesScreen from './screens/FixedExpenses/FixedExpensesScreen';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'calendar' | 'report' | 'annualReport' | 'import' | 'paymentSettings' | 'export' | 'fixedExpenses'

  useEffect(() => {
    // 前回ログイン済みなら即カレンダーを表示し、認証・同期はバックグラウンドで行う
    const lastUid = localStorage.getItem('kakeibo_last_uid');
    if (lastUid) {
      initSync(lastUid);
      setUser({ uid: lastUid });
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (lastUid && lastUid !== currentUser.uid) {
          clearAllTransactions().catch(console.warn);
        }
        localStorage.setItem('kakeibo_last_uid', currentUser.uid);
        initSync(currentUser.uid);
        initPaymentMethods(currentUser.uid).catch(console.warn);
        initFromFirestore().catch(console.warn);
        initFixedTemplatesFromFirestore().catch(console.warn);
        syncNow().catch(console.warn);
        setUser(currentUser);
      } else {
        localStorage.removeItem('kakeibo_last_uid');
        setUser(null);
      }
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
      ) : view === 'export' ? (
        <ExportScreen onBack={() => setView('calendar')} />
      ) : view === 'fixedExpenses' ? (
        <FixedExpensesScreen onBack={() => setView('calendar')} />
      ) : (
        <CalendarScreen
          onOpenReport={() => setView('report')}
          onOpenAnnualReport={() => setView('annualReport')}
          onOpenImport={() => setView('import')}
          onOpenPaymentSettings={() => setView('paymentSettings')}
          onOpenExport={() => setView('export')}
          onOpenFixedExpenses={() => setView('fixedExpenses')}
        />
      )}
    </div>
  );
}

export default App;
