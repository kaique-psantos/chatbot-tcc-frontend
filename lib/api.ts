// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function getAuthHeaders(extra: Record<string, string> = {}) {
  // Pegue o token exatamente como foi salvo no login
  const token = (typeof window !== "undefined") ? localStorage.getItem("chatbot_token") : null;

  if (!token || !token.includes(".")) {
    // sem token válido → força tratamento no chamador
    throw new Error("Sem token válido. Faça login novamente.");
  }

  // NÃO use JSON.parse aqui; o token já é uma string JWT
  // NÃO coloque aspas extras
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...extra,
  };
}

// Tipos
export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Conversas
export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/chat/conversations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Não foi possível carregar conversas");
  return res.json();
}

export async function createConversation(p0: { title: string; }): Promise<Conversation> {
  const res = await fetch(`${API_URL}/chat/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: "Nova Conversa" }),
  });
  if (!res.ok) throw new Error("Não foi possível criar conversa");
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Não foi possível excluir conversa");
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Não foi possível carregar mensagens");
  return res.json();
}

export async function sendMessage(conversationId: string, message: string, isFirstMessage = false): Promise<Message> {
  const token = localStorage.getItem("chatbot_token");
  if (!token) throw new Error("Token de autenticação não encontrado. Faça login novamente.");

  const title = message.split(" ").slice(0, 5).join(" ");

  const res = await fetch(`${API_URL}/chat/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(errorData?.detail || "Não foi possível enviar a mensagem.");
  }

  const messageData = await res.json();

  // Só atualiza o título se for a primeira mensagem
  if (isFirstMessage) {
    try {
      await updateConversationTitle(conversationId, title);
    } catch (error) {
      console.error("Erro ao atualizar título da conversa:", error);
    }
  }

  return messageData;
}


// Função para atualizar o título da conversa
export async function updateConversationTitle(conversationId: string, newTitle: string): Promise<void> {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: newTitle }),
  });

  if (!res.ok) {
    // Tentando pegar o erro da resposta da API (caso o corpo esteja vazio, usaremos um fallback)
    let errorMessage = "Erro desconhecido";

    try {
      const errorData = await res.json(); // Tenta extrair o erro em formato JSON
      console.error("Erro na atualização do título:", errorData); // Log do erro completo para debug

      // Usando o campo 'detail' ou um fallback para 'Erro desconhecido'
      errorMessage = errorData?.detail || "Erro desconhecido ao atualizar o título da conversa.";
    } catch (error) {
      // Se a resposta não for JSON, logamos e passamos uma mensagem genérica
      console.error("Erro ao processar o erro da resposta:", error);
      errorMessage = "Erro desconhecido ao processar a resposta.";
    }

    // Lançando um erro com a mensagem apropriada
    throw new Error(errorMessage);
  }
}
