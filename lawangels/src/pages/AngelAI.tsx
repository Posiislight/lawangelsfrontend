import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Plus, Loader2, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { angelAiApi, type Chat } from '../services/angelAiApi'
import lawAngelsLogo from '../assets/lawangelslogo.png'
import ReactMarkdown from 'react-markdown'

export default function AngelAI() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatIndex, setCurrentChatIndex] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations from backend on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingChats(true)
        const conversations = await angelAiApi.getConversations()
        setChats(conversations)
      } catch (err) {
        console.error('Failed to load conversations:', err)
        setError('Failed to load chat history')
      } finally {
        setIsLoadingChats(false)
      }
    }
    loadConversations()
  }, [])

  // Load messages when selecting a chat
  const selectChat = useCallback(async (index: number) => {
    const chat = chats[index]
    if (!chat) return

    setCurrentChatIndex(index)
    setError(null)

    // If messages aren't loaded yet, fetch them
    if (chat.messages.length === 0) {
      try {
        const fullChat = await angelAiApi.getConversation(chat.id)
        setChats(prev => {
          const updated = [...prev]
          updated[index] = fullChat
          return updated
        })
      } catch (err) {
        console.error('Failed to load chat messages:', err)
        setError('Failed to load messages')
      }
    }
  }, [chats])

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatIndex, streamingContent])

  const createNewChat = async () => {
    try {
      // Create in backend first
      const { id, title } = await angelAiApi.createConversation('New Chat')
      const newChat: Chat = {
        id,
        title,
        date: 'Today',
        messages: []
      }
      setChats(prev => [newChat, ...prev])
      setCurrentChatIndex(0)
      setError(null)
    } catch (err) {
      console.error('Failed to create chat:', err)
      setError('Failed to create new chat')
    }
  }

  const deleteChat = (chatId: string, chatIndex: number, e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger chat selection

    // Optimistic update - remove from UI immediately
    const deletedChat = chats[chatIndex]
    setChats(prev => prev.filter((_, idx) => idx !== chatIndex))

    // Reset current chat if we deleted it
    if (currentChatIndex === chatIndex) {
      setCurrentChatIndex(null)
    } else if (currentChatIndex !== null && currentChatIndex > chatIndex) {
      // Adjust index if we deleted a chat before the current one
      setCurrentChatIndex(currentChatIndex - 1)
    }

    // Delete in background - don't await
    angelAiApi.deleteConversation(chatId).catch(err => {
      console.error('Failed to delete chat:', err)
      // Rollback on error - add the chat back
      setChats(prev => {
        const updated = [...prev]
        updated.splice(chatIndex, 0, deletedChat)
        return updated
      })
      setError('Failed to delete chat')
    })
  }

  const sendMessage = async (messageText?: string) => {
    const message = messageText || messageInput.trim()
    if (!message || isLoading) return

    // If no chat exists, create one first
    if (currentChatIndex === null) {
      try {
        const { id, title } = await angelAiApi.createConversation('New Chat')
        const newChat: Chat = {
          id,
          title,
          date: 'Today',
          messages: []
        }
        setChats([newChat])
        setCurrentChatIndex(0)
        // Continue with the new chat
        setTimeout(() => sendMessageToChat(message, 0, id), 0)
      } catch (err) {
        console.error('Failed to create chat:', err)
        setError('Failed to create chat')
        return
      }
    } else {
      const chat = chats[currentChatIndex]
      if (chat) {
        sendMessageToChat(message, currentChatIndex, chat.id)
      }
    }

    setMessageInput('')
  }

  const sendMessageToChat = async (message: string, chatIndex: number, chatId: string) => {
    setIsLoading(true)
    setError(null)
    setStreamingContent('')

    // Add user message immediately to UI
    const userMessage = angelAiApi.createUserMessage(message)
    setChats(prev => {
      const updated = [...prev]
      if (updated[chatIndex]) {
        updated[chatIndex].messages = [...updated[chatIndex].messages, userMessage]
      }
      return updated
    })

    try {
      // Save user message to backend
      const { conversationTitle } = await angelAiApi.addMessage(chatId, 'user', message)

      // Update title if it changed
      if (chats[chatIndex] && conversationTitle !== chats[chatIndex].title) {
        setChats(prev => {
          const updated = [...prev]
          if (updated[chatIndex]) {
            updated[chatIndex].title = conversationTitle
          }
          return updated
        })
      }

      // Get current conversation history
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
          // Streaming complete - add the full message to UI
          const aiMessage = angelAiApi.createAIMessage(fullResponse)
          setChats(prev => {
            const updated = [...prev]
            updated[chatIndex].messages = [...updated[chatIndex].messages, aiMessage]
            return updated
          })
          setStreamingContent('')

          // Save AI response to backend
          await angelAiApi.addMessage(chatId, 'ai', fullResponse)
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
              <img src={lawAngelsLogo} alt="Law Angels" className="w-8 h-8 object-contain" />
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
            {isLoadingChats ? (
              <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading chats...
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              chats.map((chat, idx) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(idx)}
                  className={`group w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between ${currentChatIndex === idx ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{chat.date}</p>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, idx, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Delete chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-gray-900">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
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
                      <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-gray-900">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </div>
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
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <img src={lawAngelsLogo} alt="Law Angels" className="w-16 h-16 object-contain" />
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
