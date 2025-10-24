"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ChatHeader } from "@/components/chat-header"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import {
  sendMessage,
  getMessages,
  getConversations,
  createConversation,
  deleteConversation,
  type Message,
  type Conversation,
} from "@/lib/api"

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true) // ✅ tela de boas-vindas

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Carrega conversas ao montar
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)

      // Cria nova conversa se não houver
      if (!currentConversation && data.length === 0) {
        await handleNewConversation()
      } else if (!currentConversation && data.length > 0) {
        // Não inicia última conversa: mantemos showWelcome true
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      })
    }
  }

  const loadConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setIsLoadingMessages(true)

    try {
      const data = await getMessages(conversation.id)
      setMessages(data)
      setShowWelcome(false) // Desativa welcome se carregar conversa existente
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation({ title: "Nova Conversa" })
      setConversations([newConversation, ...conversations])
      setCurrentConversation(newConversation)
      setMessages([])
      setShowWelcome(true) // Ativa tela de boas-vindas
    } catch (error) {
      console.error("[v0] Error creating conversation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova conversa.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      const updatedConversations = conversations.filter((c) => c.id !== conversationId)
      setConversations(updatedConversations)

      if (currentConversation?.id === conversationId) {
        if (updatedConversations.length > 0) {
          await loadConversation(updatedConversations[0])
        } else {
          await handleNewConversation()
        }
      }

      toast({
        title: "Conversa excluída",
        description: "A conversa foi removida com sucesso.",
      })
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (content: string) => {
    // Desativa welcome
    if (showWelcome) setShowWelcome(false)

    // Cria conversa se não houver
    let conversation = currentConversation
    if (!conversation) {
      try {
        conversation = await createConversation({ title: "Nova Conversa" })
        setConversations([conversation, ...conversations])
        setCurrentConversation(conversation)
        setMessages([]) // inicia lista de mensagens vazia
      } catch (error) {
        console.error("Erro ao criar nova conversa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível criar a conversa.",
          variant: "destructive",
          className: "text-white",
        })
        return
      }
    }

    const isFirstMessage = messages.length === 0
    const title = content.split(" ").slice(0, 5).join(" ")

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    }

    setMessages([...messages, userMessage])
    setIsSending(true)

    try {
      const response = await sendMessage(conversation.id, content)

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMessage.id),
        userMessage,
        response,
      ])

      if (isFirstMessage) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversation.id ? { ...conv, title } : conv
          )
        )
        setCurrentConversation((prev) =>
          prev ? { ...prev, title } : prev
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
        className: "text-white",
      })
    } finally {
      setIsSending(false)
    }
  }


  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={loadConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        <ChatHeader
          conversationTitle={currentConversation?.title}
          onNewChat={handleNewConversation}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : showWelcome && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                {/* <img src="/logo.png" alt="Logo" className="mx-auto mb-4 w-32 h-32" />  ADICIONAR A LOGO AQUI FUTURAMENTE*/}
                <h2 className="text-2xl font-semibold mb-2">Bem-vindo!</h2>
                <p className="text-muted-foreground">
                  Digite uma mensagem abaixo para começar a conversar
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.created_at}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isSending} />
      </div>
    </div>
  )
}
