import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Mission from './pages/AboutUs/Mission'
import Howwesupport from './pages/AboutUs/howwesupport'
import OurJourney from './pages/AboutUs/OurJourney'
import Testimonials from './pages/Testimonials'
import PathToQualification from './pages/Path to Qualification/Pathtoqualify'
import AssessmentDates from './pages/Path to Qualification/AssessmentDates'
import Registration from './pages/Path to Qualification/Registration'
import OverseasPathways from './pages/Path to Qualification/OverseasPathways'
import MockTestStart from './components/MockTestStart'
import MockExam from './components/MockExam'
import Results from './pages/Results'
import Pricing from './pages/Pricing'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Contact from './pages/Contact'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import MyCourses from './pages/MyCourses'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<Setup />} />

        {/* Dashboard - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* My Courses - Protected */}
        <Route
          path="/my-courses"
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          }
        />

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* About Us Section */}
        <Route path="/about-us">
          <Route path="mission" element={<Mission />} />
          <Route path="how-we-support" element={<Howwesupport />} />
          <Route path="who-we-are" element={<OurJourney />} />
          <Route path="testimonials" element={<Testimonials />} />
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
          <Route path="pricing" element={<Pricing />} />
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

        {/* Results Route */}
        <Route
          path="/results/:attemptId"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

        {/* Contact Section */}
        <Route path="/contact">
          <Route path="call-us" element={<Contact />} /> {/* TODO: Create Contact components */}
          <Route path="support" element={<Home />} />
          <Route path="press" element={<Home />} />
        </Route>

        {/* Main Navigation Items */}
        <Route path="/blog" element={<Home />} /> {/* TODO: Create Blog component */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Home />} /> {/* TODO: Create Contact component */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
