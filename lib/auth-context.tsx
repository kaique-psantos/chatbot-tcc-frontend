"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getProfile } from "@/lib/api" // 1. IMPORTADO

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string // 2. ADICIONADO
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  updateUser: (newUserData: Partial<User>) => void // 3. ADICIONADO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("chatbot_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // 3. FUNÇÃO ADICIONADA
  // Atualiza o usuário no contexto e no localStorage
  const updateUser = (newUserData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null
      const updatedUser = { ...prevUser, ...newUserData }
      localStorage.setItem("chatbot_user", JSON.stringify(updatedUser))
      return updatedUser
    })
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      // Se a requisição nem chegou (API offline)
      if (!response) {
        throw new Error("Serviço Indisponível")
      }

      // Se não conseguiu conectar ao backend
      if (!response.ok) {
        let errorMsg = "Serviço Indisponível"
        try {
          const error = await response.json()
          errorMsg = error?.detail || error?.message || errorMsg
        } catch {
          /* ignora erro de parsing */
        }
        throw new Error(errorMsg)
      }

      // --- 4. LÓGICA DE LOGIN MODIFICADA ---
      const data = await response.json()
      const token = data.token // Pega o token

      // Busca o perfil completo (incluindo avatar)
      let fullProfileData = { name: data.name, avatar_url: undefined }
      try {
        const profile = await getProfile(token)
        fullProfileData.name = profile.name
        fullProfileData.avatar_url = profile.avatar_url
      } catch (profileError) {
        console.error("Login OK, mas falha ao buscar perfil completo:", profileError)
        // Não é fatal, continua com os dados parciais do login
      }
      
      const userData = { 
        id: data.user_id, 
        email: data.email, 
        name: fullProfileData.name, 
        avatar_url: fullProfileData.avatar_url 
      }

      setUser(userData)
      localStorage.setItem("chatbot_user", JSON.stringify(userData))
      localStorage.setItem("chatbot_token", token) // Salva o token
      // --- FIM DA MODIFICAÇÃO ---

    } catch (error: any) {
      console.error("[Login error]:", error)
      // Trata erro de fetch (backend fora do ar)
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        throw new Error("Serviço Indisponível")
      }
      throw error
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    try {
      // Call your Flask API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || error.message || "Falha ao tentar criar conta")
    }

      // --- 5. LÓGICA DE SIGNUP MODIFICADA (para consistência) ---
      const data = await response.json()
      const token = data.token

      // Busca o perfil completo (o /user/profile irá criar o perfil se não existir)
      let fullProfileData = { name: data.name, avatar_url: undefined }
      try {
        const profile = await getProfile(token)
        fullProfileData.name = profile.name
        fullProfileData.avatar_url = profile.avatar_url // Deve ser null
      } catch (profileError) {
        console.error("Signup OK, mas falha ao buscar perfil completo:", profileError)
      }

      const userData = { 
        id: data.user_id, 
        email: data.email, 
        name: fullProfileData.name,
        avatar_url: fullProfileData.avatar_url
      }

      setUser(userData)
      localStorage.setItem("chatbot_user", JSON.stringify(userData))
      localStorage.setItem("chatbot_token", token)
      // --- FIM DA MODIFICAÇÃO ---

    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem("chatbot_user")
    localStorage.removeItem("chatbot_token")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}