import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { ThemeProvider } from "./context/ThemeContext";
import Blog from "./pages/Blog";
import Order from "./pages/order";
import GNModel from "./pages/products/GNModel";
import SportModel from "./pages/products/SportModel";
import UrbanModel from "./pages/products/UrbanModel";
import AdventureModel from "./pages/products/AdventureModel";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <About />
                <Contact />
              </>
            } />
            <Route path="/blog" element={<Blog />} />
            <Route path="/order" element={<Order />} />
            <Route path="/products/gn-model" element={<GNModel />} />
            <Route path="/products/sport-model" element={<SportModel />} />
            <Route path="/products/urban-model" element={<UrbanModel />} />
            <Route path="/products/adventure-model" element={<AdventureModel />} />
            {/* Add other routes here */}
          </Routes>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
