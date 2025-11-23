import React, { useRef, useState, useEffect } from "react";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaInstagram, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue in leaflet
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const Contact: React.FC = () => {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
      else setVisible(false);
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Lagos, Nigeria coordinates
  const position: [number, number] = [6.5244, 3.3792];

  return (
    <section id="contact" className="min-h-screen w-full bg-gray-100 dark:bg-black flex flex-col items-center py-8 sm:py-10 px-2 sm:px-4 transition-colors duration-300">
      <div
        ref={ref}
        className={`w-full max-w-5xl transition-all duration-700 ease-out flex flex-col gap-8 
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        style={{ willChange: 'opacity, transform' }}
      >
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white text-left w-full max-w-5xl mb-6 sm:mb-10 mt-6 sm:mt-8">
          CONTACT <span className="text-green font-bold">US</span>
        </h2>
        {/* Cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Location Card */}
          <div className="bg-white dark:bg-[#263236] rounded-2xl p-8 sm:p-10 flex flex-col gap-4 transition-colors duration-300 min-h-[400px]">
            <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white mb-2">
              Our <span className="text-green font-bold">Location</span>
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 dark:bg-[#4a5757] rounded-md min-h-[250px] sm:min-h-[320px] md:min-h-[350px] lg:min-h-[380px] w-full transition-colors duration-300 overflow-hidden">
              <MapContainer center={position as [number, number]} zoom={13} scrollWheelZoom={false} className="w-full h-full min-h-[200px]" style={{ borderRadius: '0.5rem' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position as [number, number]} icon={markerIcon as any}>
                  <Popup>
                    DondaX HQ<br />Lagos, Nigeria
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
          {/* Contact Info Card */}
          <div className="bg-white dark:bg-[#263236] rounded-xl p-4 sm:p-6 flex flex-col gap-4 transition-colors duration-300 min-h-[320px]">
            <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white mb-2">
              Get in <span className="text-green font-bold">Touch</span>
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-gray-200 dark:bg-[#4a5757] rounded-md px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-300">
                <FaEnvelope className="text-lg sm:text-xl text-gray-600 dark:text-gray-200" />
                <span className="text-gray-800 dark:text-white text-sm sm:text-base">dondax@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-200 dark:bg-[#4a5757] rounded-md px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-300">
                <FaPhone className="text-lg sm:text-xl text-gray-600 dark:text-gray-200" />
                <span className="text-gray-800 dark:text-white text-sm sm:text-base">091674673</span>
              </div>
            </div>
            <hr className="my-2 sm:my-3 border-gray-300 dark:border-gray-500" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <a href="#" className="flex items-center gap-2 bg-gray-200 dark:bg-[#4a5757] rounded-md px-2 sm:px-3 py-2 text-gray-800 dark:text-white hover:bg-green/20 transition-colors text-xs sm:text-base">
                <FaInstagram className="text-base sm:text-lg" /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-200 dark:bg-[#4a5757] rounded-md px-2 sm:px-3 py-2 text-gray-800 dark:text-white hover:bg-green/20 transition-colors text-xs sm:text-base">
                <FaFacebook className="text-base sm:text-lg" /> Facebook
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-200 dark:bg-[#4a5757] rounded-md px-2 sm:px-3 py-2 text-gray-800 dark:text-white hover:bg-green/20 transition-colors text-xs sm:text-base">
                <FaTwitter className="text-base sm:text-lg" /> Twitter
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-200 dark:bg-[#4a5757] rounded-md px-2 sm:px-3 py-2 text-gray-800 dark:text-white hover:bg-green/20 transition-colors text-xs sm:text-base">
                <FaLinkedin className="text-base sm:text-lg" /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
