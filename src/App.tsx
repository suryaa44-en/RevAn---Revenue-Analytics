import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { RevenueAnalyticsPage } from './modules/analytics/RevenueAnalyticsPage'
import { CustomerDetailsPage } from './modules/crm/CustomerDetailsPage'
import { CustomersPage } from './modules/crm/CustomersPage'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { DataProvider } from './store/DataContext'
import { ToastProvider } from './store/ToastContext'

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailsPage />} />
              <Route path="analytics" element={<RevenueAnalyticsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ToastProvider>
  )
}
