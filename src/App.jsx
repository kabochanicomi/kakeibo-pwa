import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initSync } from './utils/sync';
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
  const [view, setView] = useState('calendar');

  useEffect(() => {
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
        setUser(currentUser);
      } else {
        localStorage.removeItem('kakeibo_last_uid');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
