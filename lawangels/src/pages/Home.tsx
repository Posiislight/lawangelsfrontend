import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import FormulaSteps from '../components/FormulaSteps';

import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import NewFeatures from '../components/newFeatures';
import Popup from '../components/Popup';
import { useEffect, useState} from 'react';

// Scroll animation hook
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with data-scroll attribute
    const scrollElements = document.querySelectorAll('[data-scroll]');
    scrollElements.forEach((el) => observer.observe(el));

    return () => {
      scrollElements.forEach((el) => observer.unobserve(el));
    };
  }, []);
};

export default function Home() {
    const [popupOpen, setShowPopUp] = useState(false);
    useScrollAnimation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPopUp(true);
        }, 20000);
        return () => clearTimeout(timer);
    }, []);

    function closePopUp() {
        setShowPopUp(false);
    }
    return (
        <>
            <Navbar/>
            <Popup open={popupOpen} onClose={closePopUp} />
            <div data-scroll className="opacity-0 translate-y-10 transition-all duration-700 ease-out data-[animate]:opacity-100 data-[animate]:translate-y-0">
              <Hero />
            </div>
            <div data-scroll className="opacity-0 translate-y-10 transition-all duration-700 ease-out data-[animate]:opacity-100 data-[animate]:translate-y-0">
              <Features />
            </div>
            <div data-scroll className="opacity-0 translate-y-10 transition-all duration-700 ease-out data-[animate]:opacity-100 data-[animate]:translate-y-0">
              <FormulaSteps />
            </div>
            <div data-scroll className="opacity-0 translate-y-10 transition-all duration-700 ease-out data-[animate]:opacity-100 data-[animate]:translate-y-0">
              <NewFeatures/>
            </div>
            <div data-scroll className="opacity-0 translate-y-10 transition-all duration-700 ease-out data-[animate]:opacity-100 data-[animate]:translate-y-0">
              <Testimonials />
            </div>
            <Footer />
        </>
    )
}