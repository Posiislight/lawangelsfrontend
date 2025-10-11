import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/AboutUs/Mission'
import PathToQualify from './pages/AboutUs/howwesupport'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/AboutUs" element={<About />}/>
      <Route path="/Pathtoqualification" element={<PathToQualify />}/>
    </Routes>
  )
}

export default App
