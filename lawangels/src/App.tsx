import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Mission from './pages/AboutUs/Mission'
import Howwesupport from './pages/AboutUs/howwesupport'
import PathToQualification from './pages/Path to Qualification/Pathtoqualify'
import AssessmentDates from './pages/Path to Qualification/AssessmentDates'
import Registration from './pages/Path to Qualification/Registration'
import OverseasPathways from './pages/Path to Qualification/OverseasPathways'
import MockTestStart from './components/MockTestStart'
import MockExam from './components/MockExam'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          <Route path="assessment-dates" element={<AssessmentDates />} />
          <Route path="registration" element={<Registration />} />
          <Route path="overseas-pathways" element={<OverseasPathways />} />
        </Route>

        {/* Prep Tools Section */}
        <Route path="/prep-tools">
          <Route path="pricing" element={<Home />} /> {/* TODO: Create Pricing component */}
          <Route path="sample-mcqs" element={<Home />} /> {/* TODO: Create SampleMCQs component */}
          <Route path="mock-test" element={<MockTestStart />} />
          <Route
            path="mock-exam"
            element={
              <ProtectedRoute>
                <MockExam />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Mock Test Start Route - Protected */}
        <Route
          path="/mock-test-start"
          element={
            <ProtectedRoute>
              <MockTestStart />
            </ProtectedRoute>
          }
        />

        {/* Standalone Mock Exam Route */}
        <Route
          path="/mock-exam"
          element={
            <ProtectedRoute>
              <MockExam />
            </ProtectedRoute>
          }
        />

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
    </AuthProvider>
  )
}

export default App
