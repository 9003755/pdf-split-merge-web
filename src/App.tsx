import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FileProvider } from './contexts/FileContext'
import { UIProvider } from './contexts/UIContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Split from './pages/Split'
import Merge from './pages/Merge'
import History from './pages/History'
import TopBanner from './components/TopBanner'
import Admin from './pages/Admin'

function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <FileProvider>
          <Router>
            <TopBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/split" element={<Split />} />
              <Route path="/merge" element={<Merge />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Router>
        </FileProvider>
      </AuthProvider>
    </UIProvider>
  )
}

export default App
