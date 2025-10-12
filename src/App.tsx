import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Mission from './pages/AboutUs/Mission'
import Howwesupport from './pages/AboutUs/howwesupport'
import PathToQualification from './pages/Path to Qualification/Pathtoqualify'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/AboutUs/Mission" element={<Mission />}/>
      <Route path="/AboutUs/Howwesupport" element={<Howwesupport />}/>
      <Route path="/PathtoQualifications" element={<PathToQualification/>}/>
    </Routes>
  )
}

export default App
