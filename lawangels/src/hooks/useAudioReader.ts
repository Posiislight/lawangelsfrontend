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
    rate: number
    voices: SpeechSynthesisVoice[]
    selectedVoice: SpeechSynthesisVoice | null
    error: string | null
}

export function useAudioReader(options: UseAudioReaderOptions = {}) {
    const [state, setState] = useState<AudioReaderState>({
        isPlaying: false,
        isPaused: false,
        isSpeaking: false,
        rate: options.rate || 1,
        voices: [],
        selectedVoice: null,
        error: null,
    })

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const textRef = useRef<string>('')

    // Load available voices
    useEffect(() => {
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
            window.speechSynthesis.cancel()
        }
    }, [])

    const speak = useCallback((text: string) => {
        if (!text.trim()) {
            setState(prev => ({ ...prev, error: 'No text to read' }))
            return
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        textRef.current = text
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
            if (event.error !== 'interrupted') {
                setState(prev => ({ ...prev, error: `Speech error: ${event.error}`, isPlaying: false, isSpeaking: false }))
            }
        }

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [state.selectedVoice, state.rate, options.pitch, options.volume])

    const pause = useCallback(() => {
        window.speechSynthesis.pause()
        setState(prev => ({ ...prev, isPaused: true, isPlaying: false }))
    }, [])

    const resume = useCallback(() => {
        window.speechSynthesis.resume()
        setState(prev => ({ ...prev, isPaused: false, isPlaying: true }))
    }, [])

    const stop = useCallback(() => {
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
