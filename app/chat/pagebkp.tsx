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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)

      // If no current conversation, create a new one
      if (!currentConversation && data.length === 0) {
        await handleNewConversation()
      } else if (!currentConversation && data.length > 0) {
        // Load the most recent conversation
        await loadConversation(data[0])
      }
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
        className: "text-white",
      })
    }
  }

  const loadConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setIsLoadingMessages(true)

    try {
      const data = await getMessages(conversation.id)
      setMessages(data)
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
        className: "text-white",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation()
      setConversations([newConversation, ...conversations])
      setCurrentConversation(newConversation)
      setMessages([])
    } catch (error) {
      console.error("[v0] Error creating conversation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova conversa.",
        variant: "destructive",
        className: "text-white",
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
        className: "text-white",
      })
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      toast({
        title: "Erro",
        description: "Nenhuma conversa selecionada.",
        variant: "destructive",
  className: "text-white",
      });
      return;
    }

    const isFirstMessage = messages.length === 0; // detecta se é a primeira mensagem
    const title = content.split(" ").slice(0, 5).join(" "); // 5 primeiras palavras

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setIsSending(true);

    try {
      // Envia mensagem (passando flag de primeira mensagem)
      const response = await sendMessage(currentConversation.id, content, isFirstMessage);

      // Atualiza mensagens (remove temporária e insere a resposta da IA)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMessage.id),
        userMessage, // mantém mensagem do usuário
        response, // e adiciona a resposta da IA
      ]);

      // 🔁 Atualiza o título da conversa no front-end
      if (isFirstMessage) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversation.id
              ? { ...conv, title }
              : conv
          )
        );

        setCurrentConversation((prev) =>
          prev ? { ...prev, title } : prev
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
  className: "text-white",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

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
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Comece uma conversa</h2>
                <p className="text-muted-foreground">Digite uma mensagem abaixo para começar a conversar com a IA</p>
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

        <ChatInput onSend={handleSendMessage} disabled={isSending || !currentConversation} />
      </div>
    </div>
  )
}
 