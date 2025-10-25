"use client"

import { useAuth } from "@/lib/auth-context"
import { LogOut, Menu, Plus, Settings, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
  conversationTitle?: string
  onNewChat: () => void
  onToggleSidebar: () => void
}

export function ChatHeader({
  conversationTitle,
  onNewChat,
  onToggleSidebar,
}: ChatHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleProfile = () => {
    router.push("/profile") // ou qualquer rota de perfil
  }

  return (
    <header className="glass-strong border-b border-border/50 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden rounded-xl hover:bg-accent/20"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold truncate max-w-[200px] md:max-w-none">
            {conversationTitle || "Nova Conversa"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onNewChat}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>

        {/* Avatar + Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full p-0">
                <Avatar className="h-8 w-8">
                  {/* 👇 Alterado avatarUrl → avatar_url 👇 */}
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name || "Avatar"} />
                  ) : (
                    <AvatarFallback>
                      {user?.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleProfile}>
                <Settings className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
