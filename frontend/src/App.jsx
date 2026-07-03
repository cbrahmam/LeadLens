import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './utils/toastContext'
import { ThemeProvider } from './utils/themeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FavoritesPage from './pages/FavoritesPage'
import ComparePage from './pages/ComparePage'
import PipelinePage from './pages/PipelinePage'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results/:domain" element={<ResultsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
