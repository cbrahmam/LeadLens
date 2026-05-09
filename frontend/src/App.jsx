import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './utils/toastContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultsPage from './pages/ResultsPage'

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results/:domain" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}

export default App
