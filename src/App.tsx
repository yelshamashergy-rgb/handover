import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { PropertyDetail } from './pages/PropertyDetail'
import { Compare } from './pages/Compare'
import { Upcoming } from './pages/Upcoming'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  )
}
