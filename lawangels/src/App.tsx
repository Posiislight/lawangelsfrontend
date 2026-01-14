import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import Home from './pages/Home'
import Mission from './pages/AboutUs/Mission'
import Howwesupport from './pages/AboutUs/howwesupport'
import OurJourney from './pages/AboutUs/OurJourney'
import Testimonials from './pages/Testimonials'
import PathToQualification from './pages/Path to Qualification/Pathtoqualify'
import AssessmentDates from './pages/Path to Qualification/AssessmentDates'
import Registration from './pages/Path to Qualification/Registration'
import OverseasPathways from './pages/Path to Qualification/OverseasPathways'
import Results from './pages/Results'
import Pricing from './pages/Pricing'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Contact from './pages/Contact'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import MyCourses from './pages/MyCourses'
import Progress from './pages/Progress'
import Practice from './pages/Practice'
import Textbook from './pages/Textbook'
import VideoTutorials from './pages/VideoTutorials'
import VideoWatch from './pages/VideoWatch'
import Flashcards from './pages/Flashcards'
import FlashcardTopic from './pages/FlashcardTopic'
import FlashcardStudy from './pages/FlashcardStudy'
import Quizzes from './pages/Quizzes'
import MockQuestions from './pages/MockQuestions'
import PracticeQuestions from './pages/PracticeQuestions'
import AngelAI from './pages/AngelAI'
import SQETips from './pages/SQETips'
import KeyTimeframes from './pages/KeyTimeframes'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import GamifiedQuiz from './components/GamifiedQuiz'
import GamifiedQuizResults from './pages/GamifiedQuizResults'
import TextbookReader from './pages/TextbookReader'
import SummaryNotes from './pages/SummaryNotes'
import SummaryNotesReader from './pages/SummaryNotesReader'
import BillingPage from './pages/BillingPage'
import { warmUpBackend } from './services/warmUpService'

function App() {
  // Warm up backend on app load to reduce cold start latency (Render free tier)
  useEffect(() => {
    warmUpBackend()
  }, [])

  return (
    <AuthProvider>
      <SidebarProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

          {/* Progress - Protected */}
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />

          {/* Practice - Protected */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            }
          />

          {/* Textbook - Protected */}
          <Route
            path="/textbook"
            element={
              <ProtectedRoute>
                <Textbook />
              </ProtectedRoute>
            }
          />

          {/* Textbook Reader - Protected */}
          <Route
            path="/textbook/:id"
            element={
              <ProtectedRoute>
                <TextbookReader />
              </ProtectedRoute>
            }
          />

          {/* Summary Notes - Protected */}
          <Route
            path="/summary-notes"
            element={
              <ProtectedRoute>
                <SummaryNotes />
              </ProtectedRoute>
            }
          />

          {/* Summary Notes Reader - Protected */}
          <Route
            path="/summary-notes/:id"
            element={
              <ProtectedRoute>
                <SummaryNotesReader />
              </ProtectedRoute>
            }
          />

          {/* Summary Notes Reader with Chapter - Protected */}
          <Route
            path="/summary-notes/:id/chapter/:chapterId"
            element={
              <ProtectedRoute>
                <SummaryNotesReader />
              </ProtectedRoute>
            }
          />

          {/* Video Tutorials - Protected */}
          <Route
            path="/video-tutorials"
            element={
              <ProtectedRoute>
                <VideoTutorials />
              </ProtectedRoute>
            }
          />

          {/* Video Watch - Protected */}
          <Route
            path="/video-tutorials/watch/:videoId"
            element={
              <ProtectedRoute>
                <VideoWatch />
              </ProtectedRoute>
            }
          />

          {/* Flashcards - Protected */}
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <Flashcards />
              </ProtectedRoute>
            }
          />

          {/* Flashcard Topic/Subject - Protected */}
          <Route
            path="/flashcards/topic/:subject"
            element={
              <ProtectedRoute>
                <FlashcardTopic />
              </ProtectedRoute>
            }
          />

          {/* Flashcard Study - Protected */}
          <Route
            path="/flashcards/:deckId/study"
            element={
              <ProtectedRoute>
                <FlashcardStudy />
              </ProtectedRoute>
            }
          />

          {/* Quizzes - Protected */}
          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <Quizzes />
              </ProtectedRoute>
            }
          />

          {/* Mock Questions - Protected */}
          <Route
            path="/mock-questions"
            element={
              <ProtectedRoute>
                <MockQuestions />
              </ProtectedRoute>
            }
          />

          {/* Practice Questions - Protected */}
          <Route
            path="/practice-questions"
            element={
              <ProtectedRoute>
                <PracticeQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice-questions/:courseSlug"
            element={
              <ProtectedRoute>
                <PracticeQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice-questions/:courseSlug/:topicSlug"
            element={
              <ProtectedRoute>
                <PracticeQuestions />
              </ProtectedRoute>
            }
          />

          {/* Angel AI - Protected */}
          <Route
            path="/angel-ai"
            element={
              <ProtectedRoute>
                <AngelAI />
              </ProtectedRoute>
            }
          />

          {/* SQE Tips - Protected */}
          <Route
            path="/sqe-tips"
            element={
              <ProtectedRoute>
                <SQETips />
              </ProtectedRoute>
            }
          />

          {/* Key Timeframes - Protected */}
          <Route
            path="/key-timeframes"
            element={
              <ProtectedRoute>
                <KeyTimeframes />
              </ProtectedRoute>
            }
          />

          {/* Billing - Protected */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
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
          </Route>


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

          {/* Gamified Quiz Routes */}
          <Route
            path="/quiz/play/:topic/:attemptId"
            element={
              <ProtectedRoute>
                <GamifiedQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/results/:attemptId"
            element={
              <ProtectedRoute>
                <GamifiedQuizResults />
              </ProtectedRoute>
            }
          />
        </Routes>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
