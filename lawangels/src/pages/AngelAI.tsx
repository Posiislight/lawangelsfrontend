import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Plus, Loader2, Bot } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { angelAiApi, type Chat } from '../services/angelAiApi'

export default function AngelAI() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatIndex, setCurrentChatIndex] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)



  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatIndex, streamingContent])

  const createNewChat = () => {
    const newChat = angelAiApi.createNewChat()
    setChats(prev => [newChat, ...prev])
    setCurrentChatIndex(0)
    setError(null)
  }

  const sendMessage = async (messageText?: string) => {
    const message = messageText || messageInput.trim()
    if (!message || isLoading) return

    // If no chat exists, create one
    if (currentChatIndex === null) {
      const newChat = angelAiApi.createNewChat(angelAiApi.generateChatTitle(message))
      setChats([newChat])
      setCurrentChatIndex(0)

      // Continue with the new chat
      setTimeout(() => sendMessageToChat(message, 0), 0)
    } else {
      sendMessageToChat(message, currentChatIndex)
    }

    setMessageInput('')
  }

  const sendMessageToChat = async (message: string, chatIndex: number) => {
    setIsLoading(true)
    setError(null)
    setStreamingContent('')

    // Add user message immediately
    const userMessage = angelAiApi.createUserMessage(message)
    setChats(prev => {
      const updated = [...prev]
      if (!updated[chatIndex].messages.length) {
        // Update title for new chat
        updated[chatIndex].title = angelAiApi.generateChatTitle(message)
      }
      updated[chatIndex].messages = [...updated[chatIndex].messages, userMessage]
      return updated
    })

    try {
      // Get current conversation history (before adding the new user message)
      const currentMessages = chats[chatIndex]?.messages || []

      // Use streaming API
      let fullResponse = ''

      for await (const chunk of angelAiApi.streamMessage(message, currentMessages)) {
        if (chunk.error) {
          throw new Error(chunk.error)
        }

        if (chunk.content) {
          fullResponse += chunk.content
          setStreamingContent(fullResponse)
        }

        if (chunk.done) {
          // Streaming complete - add the full message
          const aiMessage = angelAiApi.createAIMessage(fullResponse)
          setChats(prev => {
            const updated = [...prev]
            updated[chatIndex].messages = [...updated[chatIndex].messages, aiMessage]
            return updated
          })
          setStreamingContent('')
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }



  const currentChat = currentChatIndex !== null ? chats[currentChatIndex] : null

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-500" />
              Angel AI
            </h1>
            <p className="text-gray-600">Your personal law tutor powered by Law Angels textbooks</p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-hidden flex gap-6 p-8 h-[calc(100vh-120px)]">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              chats.map((chat, idx) => (
                <button
                  key={chat.id}
                  onClick={() => setCurrentChatIndex(idx)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${currentChatIndex === idx ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                >
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{chat.date}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentChat ? (
              <>
                {currentChat.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Streaming response */}
                {streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg bg-gray-100 text-gray-900 rounded-bl-none">
                      <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-gray-500">Angel AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading indicator (only when not streaming) */}
                {isLoading && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Angel AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <p className="text-lg font-medium mb-2">Hi! I'm Angel AI , I'm here to help!</p>

              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-2 bg-red-50 text-red-600 text-sm border-t border-red-200">
              {error}
            </div>
          )}

          {/* Message Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask Angel AI about legal concepts..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !messageInput.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  )
}
