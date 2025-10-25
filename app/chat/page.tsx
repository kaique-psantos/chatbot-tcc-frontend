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
import { Bug } from "lucide-react"
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
  const [showWelcome, setShowWelcome] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Carrega conversas
  useEffect(() => {
    if (user) {
      loadConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Scroll automático ao fim
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // =============================
  // FUNÇÕES DE CONVERSAS
  // =============================

  const loadConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)

      // não abrir automaticamente nenhuma conversa — mantém showWelcome
      setCurrentConversation(null)
      setMessages([])
      setShowWelcome(true)
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
      setShowWelcome(false)
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
      const newConversation = await createConversation()
      setConversations((prev) => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      setMessages([])
      setShowWelcome(true)
    } catch (error) {
      console.error("Error creating conversation:", error)
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
          // volta ao estado inicial sem conversa
          setCurrentConversation(null)
          setMessages([])
          setShowWelcome(true)
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

  // =============================
  // ENVIO DE MENSAGEM
  // =============================

  const handleSendMessage = async (content: string) => {
    // esconde welcome assim que o usuário começa a digitar/enviar
    if (showWelcome) setShowWelcome(false)

    let conversation = currentConversation
    if (!conversation) {
      // cria conversa localmente se não existir
      try {
        conversation = await createConversation()
        setConversations((prev) => [conversation!, ...prev])
        setCurrentConversation(conversation)
        setMessages([])
      } catch (error) {
        console.error("Erro ao criar nova conversa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível criar a conversa.",
          variant: "destructive",
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

    // mostra imediatamente a mensagem do usuário
    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)

    try {
      const response = await sendMessage(conversation.id, content, isFirstMessage)

      // substitui temp e adiciona resposta
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMessage.id),
        userMessage,
        response,
      ])

      // Atualiza o título localmente na primeira mensagem
      if (isFirstMessage) {
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversation!.id ? { ...conv, title } : conv))
        )
        setCurrentConversation((prev) => (prev ? { ...prev, title } : prev))
        // (opcional) você pode também chamar um endpoint PATCH para persistir o título no backend
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // remove mensagem temporária em caso de erro
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // =============================
  // RENDER
  // =============================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-strong p-8 rounded-3xl">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={loadConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col relative z-10">
        <ChatHeader
          conversationTitle={currentConversation?.title}
          onNewChat={handleNewConversation}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <div className="glass-strong p-8 rounded-3xl shimmer">
                <Spinner className="h-8 w-8" />
              </div>
            </div>
          ) : showWelcome && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center max-w-2xl">
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl glow shimmer">
                  <Bug className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Bem-vindo ao Debug.AI!
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Seu assistente virtual em Maker No-Code
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  {[
                    { icon: "💡", text: "Faça perguntas" },
                    { icon: "🎨", text: "Crie fluxos" },
                    { icon: "🚀", text: "Explore possibilidades" },
                  ].map((item, i) => (
                    <div key={i} className="glass p-6 rounded-2xl glass-hover">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <p className="text-sm font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl p-4">
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

        <div className="p-4">
          <div className="mx-auto max-w-4xl">
            <ChatInput onSend={handleSendMessage} disabled={isSending} />
          </div>
        </div>
      </div>
    </div>
  )
}
