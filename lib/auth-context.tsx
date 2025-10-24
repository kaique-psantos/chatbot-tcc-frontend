"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
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

      const data = await response.json()
      const userData = { id: data.user_id, email: data.email, name: data.name }

      setUser(userData)
      localStorage.setItem("chatbot_user", JSON.stringify(userData))
      localStorage.setItem("chatbot_token", data.token)
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
        throw new Error(error.message || "Signup failed")
      }

      const data = await response.json()
      const userData = { id: data.user_id, email: data.email, name: data.name }

      setUser(userData)
      localStorage.setItem("chatbot_user", JSON.stringify(userData))
      localStorage.setItem("chatbot_token", data.token)
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

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
