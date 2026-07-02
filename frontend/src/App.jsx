import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './utils/toastContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FavoritesPage from './pages/FavoritesPage'
import ComparePage from './pages/ComparePage'

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results/:domain" element={<ResultsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}

export default App
