import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import FormulaSteps from '../components/FormulaSteps';

import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import NewFeatures from '../components/newFeatures';
import Popup from '../components/Popup';
import { useEffect, useState} from 'react';

export default function Home() {
    const [popupOpen, setShowPopUp] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPopUp(true);
        }, 120000);
        return () => clearTimeout(timer);
    }, []);

    function closePopUp() {
        setShowPopUp(false);
    }
    return (
        <>
            <Navbar/>
            <Popup open={popupOpen} onClose={closePopUp} />
            <Hero />
            <Features />
            <FormulaSteps />
            <NewFeatures/>
            <Testimonials />
            <Footer />
        </>
    )
}