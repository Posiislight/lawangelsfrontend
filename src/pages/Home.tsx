import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import FormulaSteps from '../components/FormulaSteps'

import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'
import NewFeatures from '../components/newFeatures'

export default function Home() {
    return (
        <>
            <Navbar/>
            <Hero />
            <Features />
            <FormulaSteps />
            <NewFeatures/>
            <Testimonials />
            <Footer />
        </>
    )
}