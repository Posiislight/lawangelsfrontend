import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Mission from './pages/AboutUs/Mission'
import Howwesupport from './pages/AboutUs/howwesupport'
import PathToQualification from './pages/Path to Qualification/Pathtoqualify'

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* About Us Section */}
      <Route path="/about-us">
        <Route path="mission" element={<Mission />} />
        <Route path="how-we-support" element={<Howwesupport />} />
        <Route path="testimonials" element={<Mission />} /> {/* TODO: Create Testimonials component */}
      </Route>

      {/* Path to Qualification Section */}
      <Route path="/path-to-qualification">
        <Route path="sqe-route" element={<PathToQualification />} />
        <Route path="assessment-dates" element={<PathToQualification />} />
        <Route path="registration" element={<PathToQualification />} />
        <Route path="overseas-pathways" element={<PathToQualification />} />
      </Route>

      {/* Prep Tools Section */}
      <Route path="/prep-tools">
        <Route path="pricing" element={<Home />} /> {/* TODO: Create Pricing component */}
        <Route path="sample-mcqs" element={<Home />} /> {/* TODO: Create SampleMCQs component */}
      </Route>

      {/* Contact Section */}
      <Route path="/contact">
        <Route path="call-us" element={<Home />} /> {/* TODO: Create Contact components */}
        <Route path="support" element={<Home />} />
        <Route path="press" element={<Home />} />
      </Route>

      {/* Main Navigation Items */}
      <Route path="/blog" element={<Home />} /> {/* TODO: Create Blog component */}
      <Route path="/pricing" element={<Home />} /> {/* TODO: Create Pricing component */}
      <Route path="/contact" element={<Home />} /> {/* TODO: Create Contact component */}
    </Routes>
  )
}

export default App
