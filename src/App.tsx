import React, { useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { Terminal } from './components/Terminal';
import { InventoryView } from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { CustomersView } from './components/CustomersView';
import { LoginView } from './components/LoginView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { NavigationSidebar } from './components/NavigationSidebar';
import { CustomerDisplayView, CustomerDisplayModal } from './components/CustomerDisplayView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = usePOS();

  // If cashier tries to stay on restricted tab, redirect to terminal
  useEffect(() => {
    if (currentUser?.role === 'CASHIER' && activeTab !== 'terminal' && activeTab !== 'customers') {
      setActiveTab('terminal');
    }
  }, [currentUser, activeTab, setActiveTab]);

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="pos-app">
      <Header />
      <main className="main-content">
        {activeTab === 'terminal' && <Terminal />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'inventory' && currentUser.role === 'ADMIN' && <InventoryView />}
        {activeTab === 'analytics' && currentUser.role === 'ADMIN' && <AnalyticsView />}
        {activeTab === 'users' && currentUser.role === 'ADMIN' && <UsersView />}
        {activeTab === 'settings' && currentUser.role === 'ADMIN' && <SettingsView />}
      </main>

      {/* Global Modals, Sidebar & Customer Display Modal */}
      <NavigationSidebar />
      <PaymentModal />
      <ReceiptModal />
      <KeyboardShortcutsModal />
      <CustomerDisplayModal />
    </div>
  );
};

export default function App() {
  // Check if opened as standalone customer facing screen on 2nd monitor
  const isCustomerDisplayMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('display') === 'customer' ||
    window.location.hash === '#customer-display'
  );

  return (
    <POSProvider>
      {isCustomerDisplayMode ? (
        <CustomerDisplayView isStandalone={true} />
      ) : (
        <MainLayout />
      )}
    </POSProvider>
  );
}
