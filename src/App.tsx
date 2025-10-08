import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ObjectPage from './components/ObjectPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} />
        <Route path="/object/:id" element={<ObjectPage />} />
        <Route path="/object/:id/department/:department/:section" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App