import React from 'react'

interface ToggleDarkModeButtonProps {
  darkMode: boolean
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>
}

const ToggleDarkModeButton: React.FC<ToggleDarkModeButtonProps> = ({ darkMode, setDarkMode }) => (
  <button
    onClick={() => setDarkMode(prev => !prev)}
    className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300
      ${darkMode ? 'bg-green' : 'bg-gray-400'}`}
    aria-label="Toggle dark mode"
  >
    <span
      className={`absolute left-1 text-xs font-semibold transition-colors duration-300
        ${darkMode ? 'text-gray-900' : 'text-white'}`}
    >
      {darkMode ? '🌙' : '☀️'}
    </span>
    <span
      className={`absolute right-1 text-xs font-semibold transition-colors duration-300
        ${darkMode ? 'text-white' : 'text-gray-900'}`}
    >
      {darkMode ? '☀️' : '🌙'}
    </span>
    <span
      className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
        ${darkMode ? 'translate-x-6' : ''}`}
    />
  </button>
)

export default ToggleDarkModeButton