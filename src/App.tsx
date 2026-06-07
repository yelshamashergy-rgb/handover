import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { PropertyDetail } from './pages/PropertyDetail'
import { Compare } from './pages/Compare'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  )
}
