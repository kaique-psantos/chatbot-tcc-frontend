"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getProfile, updateProfile, updatePassword, uploadAvatar } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { Loader2, Camera, User, Lock, Save, ArrowLeft, MessageSquare } from "lucide-react"

interface ProfileData {
  name: string
  email: string
  avatar_url?: string
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth() // <-- (1) ADICIONADO updateUser
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados dos formulários
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    const token = localStorage.getItem("chatbot_token")
    if (!token) {
      toast({
        title: "Erro de autenticação",
        description: "Token não encontrado. Faça login novamente.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      setLoading(true)
      const data = await getProfile(token)
      setProfile(data)
      setName(data.name || "")
      setEmail(data.email || "")
    } catch (error) {
      toast({
        title: "Erro ao carregar perfil",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("chatbot_token")
    if (!token) return

    try {
      setSaving(true)
      await updateProfile(token, { name, email })
      setProfile((prev) => (prev ? { ...prev, name, email } : null))

      updateUser({ name, email }) // <-- (2) ATUALIZA CONTEXTO DE USUÁRIO

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("chatbot_token")
    if (!token) return

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      await updatePassword(token, newPassword)
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem("chatbot_token")
    if (!token || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingAvatar(true)
      const data = await uploadAvatar(token, file)
      setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : null))

      updateUser({ avatar_url: data.avatar_url }) // <-- (3) ATUALIZA AVATAR NO CONTEXTO

      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi alterada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao enviar avatar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong p-8 rounded-3xl shimmer">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Fundo animado liquid glass */}
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

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="glass-strong border-2 hover:bg-primary/10 hover:text-black transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Chat
          </Button>
          <MessageSquare className="h-6 w-6 text-primary/50" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        {/* Avatar Card */}
        <Card className="glass-strong border-2 shimmer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-xl">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.name} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {profile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{profile?.name || user?.name}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulários */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Info */}
          <Card className="glass-strong border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize seu nome e email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="glass h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="glass h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Senha */}
          <Card className="glass-strong border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="glass h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="glass h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-gradient-to-r from-secondary to-primary hover:shadow-xl transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Atualizar Senha
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
