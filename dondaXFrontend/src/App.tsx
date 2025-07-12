import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import Navbar from './components/Navbar'

function App() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <Router>
      <div className="w-screen min-h-screen bg-white dark:bg-black transition-colors duration-300 overflow-x-hidden">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
