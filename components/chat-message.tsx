// components/chat-message.tsx
import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn(
      "flex gap-4 p-4 mb-4 rounded-2xl transition-all duration-300 max-w-[80%]",
      isUser 
        ? "ml-auto flex-row-reverse glass-hover" 
        : "mr-auto glass-strong"
    )}>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isUser 
          ? "bg-gradient-to-br from-primary to-accent glow" 
          : "bg-gradient-to-br from-secondary to-accent"
      )}>
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Bot className="h-5 w-5 text-primary-foreground" />
        )}
      </div>
      
      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "text-right" : "text-left"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
        {timestamp && (
          <p className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}