import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useConversation = create(persist(
  (set) => ({
    selectedConversation: null,
    setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
    messages: [],
    setMessages: (messages) => set({ messages }),
    conversations: [],
    setConversations: (conversations) => set({ conversations }),
  }),
  {
    name: 'conversation-storage', 
  }
))

export default useConversation
