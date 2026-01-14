import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAudioReaderOptions {
    rate?: number
    pitch?: number
    volume?: number
}

interface AudioReaderState {
    isPlaying: boolean
    isPaused: boolean
    isSpeaking: boolean
    isSupported: boolean
    rate: number
    voices: SpeechSynthesisVoice[]
    selectedVoice: SpeechSynthesisVoice | null
    error: string | null
}

// Check if Web Speech API is supported
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useAudioReader(options: UseAudioReaderOptions = {}) {
    const [state, setState] = useState<AudioReaderState>({
        isPlaying: false,
        isPaused: false,
        isSpeaking: false,
        isSupported: isSpeechSynthesisSupported,
        rate: options.rate || 1,
        voices: [],
        selectedVoice: null,
        error: isSpeechSynthesisSupported ? null : 'Text-to-speech is not supported in this browser',
    })

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const textRef = useRef<string>('')
    const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Load available voices
    useEffect(() => {
        if (!isSpeechSynthesisSupported) return

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            if (availableVoices.length > 0) {
                // Prefer English voices
                const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'))
                const defaultVoice = englishVoices.find(v => v.default) || englishVoices[0] || availableVoices[0]

                setState(prev => ({
                    ...prev,
                    voices: availableVoices,
                    selectedVoice: defaultVoice,
                }))
            }
        }

        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices

        return () => {
            if (speakTimeoutRef.current) {
                clearTimeout(speakTimeoutRef.current)
            }
            window.speechSynthesis.cancel()
        }
    }, [])

    const speak = useCallback((text: string) => {
        if (!isSpeechSynthesisSupported) {
            setState(prev => ({ ...prev, error: 'Text-to-speech is not supported in this browser' }))
            return
        }

        if (!text.trim()) {
            setState(prev => ({ ...prev, error: 'No text to read' }))
            return
        }

        // Clear any pending timeout
        if (speakTimeoutRef.current) {
            clearTimeout(speakTimeoutRef.current)
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        textRef.current = text

        // Add a small delay after cancel to prevent AbortError
        // This is a known issue with the Web Speech API
        speakTimeoutRef.current = setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text)

            if (state.selectedVoice) {
                utterance.voice = state.selectedVoice
            }
            utterance.rate = state.rate
            utterance.pitch = options.pitch || 1
            utterance.volume = options.volume || 1

            utterance.onstart = () => {
                setState(prev => ({ ...prev, isPlaying: true, isPaused: false, isSpeaking: true, error: null }))
            }

            utterance.onend = () => {
                setState(prev => ({ ...prev, isPlaying: false, isPaused: false, isSpeaking: false }))
            }

            utterance.onerror = (event) => {
                // Ignore 'interrupted' and 'canceled' errors as they are expected during navigation
                if (event.error !== 'interrupted' && event.error !== 'canceled') {
                    setState(prev => ({ ...prev, error: `Speech error: ${event.error}`, isPlaying: false, isSpeaking: false }))
                }
            }

            utteranceRef.current = utterance
            window.speechSynthesis.speak(utterance)
        }, 50)
    }, [state.selectedVoice, state.rate, options.pitch, options.volume])

    const pause = useCallback(() => {
        if (!isSpeechSynthesisSupported) return
        window.speechSynthesis.pause()
        setState(prev => ({ ...prev, isPaused: true, isPlaying: false }))
    }, [])

    const resume = useCallback(() => {
        if (!isSpeechSynthesisSupported) return
        window.speechSynthesis.resume()
        setState(prev => ({ ...prev, isPaused: false, isPlaying: true }))
    }, [])

    const stop = useCallback(() => {
        if (!isSpeechSynthesisSupported) return
        if (speakTimeoutRef.current) {
            clearTimeout(speakTimeoutRef.current)
        }
        window.speechSynthesis.cancel()
        setState(prev => ({ ...prev, isPlaying: false, isPaused: false, isSpeaking: false }))
    }, [])

    const setRate = useCallback((rate: number) => {
        setState(prev => ({ ...prev, rate }))
    }, [])

    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setState(prev => ({ ...prev, selectedVoice: voice }))
    }, [])

    return {
        ...state,
        speak,
        pause,
        resume,
        stop,
        setRate,
        setVoice,
    }
}

export default useAudioReader
