import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, AuthGuard } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { WalletOverviewPage } from './pages/WalletOverviewPage';
import { WalletDetailPage } from './pages/WalletDetailPage';
import { PaymentGatewayPage } from './pages/PaymentGatewayPage';
import { MerchantPayPage } from './pages/MerchantPayPage';
import { SendMoneyPage } from './pages/SendMoneyPage';
import { TransferToBankPage } from './pages/TransferToBankPage';
import { BillPayPage } from './pages/BillPayPage';
import { PassbookPage } from './pages/PassbookPage';
import { KycStatusPage } from './pages/KycStatusPage';
import { ProfilePage } from './pages/ProfilePage';
import { SpendAnalyticsPage } from './pages/SpendAnalyticsPage';
import { WalletStatementPage } from './pages/WalletStatementPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { BudgetPage } from './pages/BudgetPage';
import { RewardsPage } from './pages/RewardsPage';
import { SubWalletDetailPage } from './pages/SubWalletDetailPage';
import { SupportTicketsPage } from './pages/SupportTicketsPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/wallet" element={<WalletOverviewPage />} />
            <Route path="/wallet/detail" element={<WalletDetailPage />} />
            <Route path="/wallet/add-money" element={<PaymentGatewayPage />} />
            <Route path="/pay" element={<MerchantPayPage />} />
            <Route path="/send" element={<SendMoneyPage />} />
            <Route path="/transfer-bank" element={<TransferToBankPage />} />
            <Route path="/bill-pay" element={<BillPayPage />} />
            <Route path="/passbook" element={<PassbookPage />} />
            <Route path="/kyc" element={<KycStatusPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analytics" element={<SpendAnalyticsPage />} />
            <Route path="/wallet/statement" element={<WalletStatementPage />} />
            <Route path="/transaction" element={<TransactionDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/wallet/sub/:type" element={<SubWalletDetailPage />} />
            <Route path="/support/tickets" element={<SupportTicketsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
