import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import FormulaSteps from '../components/FormulaSteps'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'

export default function Home() {
    return (
        <>
            <Navbar/>
            <Hero />
            <Features />
            <FormulaSteps />
            <Pricing />
            <Testimonials />
            <Footer />
        </>
    )
}