// components/conversation-sidebar.tsx
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Trash2, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/api"

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversation: Conversation) => void
  onDeleteConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onClose: () => void
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 flex flex-col h-full glass-strong border-r border-border/50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Conversas
          </h2>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewConversation}
              className="rounded-xl h-9 w-9 hover:bg-accent/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="lg:hidden rounded-xl h-9 w-9 hover:bg-accent/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list com scroll */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                  currentConversationId === conversation.id
                    ? "glass-strong border-2 border-primary/30"
                    : "glass-hover hover:border-primary/20 border-2 border-transparent"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    currentConversationId === conversation.id
                      ? "bg-gradient-to-br from-primary to-accent glow"
                      : "bg-muted"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                </div>

                <span className="flex-1 truncate text-sm font-medium">
                  {conversation.title}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

    </>
  )
}