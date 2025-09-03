import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import FormulaSteps from './components/FormulaSteps'
import Pricing from './components/Pricing'

function App() {
  return (
    <div className="min-h-screen w-full font-worksans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <FormulaSteps />
        <Pricing />
      </main>
    </div>
  )
}

export default App
