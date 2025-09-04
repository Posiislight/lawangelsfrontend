import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import FormulaSteps from './components/FormulaSteps'
import Pricing from './components/Pricing'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen w-full font-worksans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <FormulaSteps />
        <Pricing />
  <Testimonials />
        <Footer />
      </main>
    </div>
  )
}

export default App
