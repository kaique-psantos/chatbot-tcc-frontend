# Chatbot Front-end

Front-end moderno e intuitivo para chatbot com IA, construído com Next.js, React e Tailwind CSS.

## Funcionalidades

- **Autenticação**: Sistema completo de login e cadastro
- **Interface de Chat**: Interface moderna e responsiva para conversação
- **Histórico de Conversas**: Sidebar com todas as conversas anteriores
- **Integração com API Flask**: Conecta-se à API Python/Flask com Supabase e Hugging Face

## Tecnologias

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com a seguinte variável:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000
\`\`\`

Substitua `http://localhost:5000` pela URL da sua API Flask em produção.

### 2. Instalação

\`\`\`bash
npm install
\`\`\`

### 3. Executar em Desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

O aplicativo estará disponível em `http://localhost:3000`.

## Estrutura da API Flask Esperada

O front-end espera que sua API Flask tenha os seguintes endpoints:

### Autenticação

#### POST `/auth/login`
\`\`\`json
// Request
{
  "email": "usuario@email.com",
  "password": "senha123"
}

// Response
{
  "user_id": "uuid",
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "token": "jwt_token"
}
\`\`\`

#### POST `/auth/signup`
\`\`\`json
// Request
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}

// Response
{
  "user_id": "uuid",
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "token": "jwt_token"
}
\`\`\`

### Chat

Todos os endpoints de chat requerem o header:
\`\`\`
Authorization: Bearer {token}
\`\`\`

#### GET `/chat/conversations`
\`\`\`json
// Response
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Título da Conversa",
    "created_at": "2025-01-18T10:00:00Z",
    "updated_at": "2025-01-18T10:30:00Z"
  }
]
\`\`\`

#### POST `/chat/conversations`
\`\`\`json
// Request
{
  "title": "Nova Conversa"
}

// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Nova Conversa",
  "created_at": "2025-01-18T10:00:00Z",
  "updated_at": "2025-01-18T10:00:00Z"
}
\`\`\`

#### GET `/chat/conversations/{conversation_id}/messages`
\`\`\`json
// Response
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "user",
    "content": "Olá!",
    "created_at": "2025-01-18T10:00:00Z"
  },
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "assistant",
    "content": "Olá! Como posso ajudar?",
    "created_at": "2025-01-18T10:00:05Z"
  }
]
\`\`\`

#### POST `/chat/message`
\`\`\`json
// Request
{
  "conversation_id": "uuid",
  "message": "Qual é a capital do Brasil?"
}

// Response
{
  "id": "uuid",
  "conversation_id": "uuid",
  "role": "assistant",
  "content": "A capital do Brasil é Brasília.",
  "created_at": "2025-01-18T10:00:10Z"
}
\`\`\`

#### DELETE `/chat/conversations/{conversation_id}`
\`\`\`json
// Response
{
  "message": "Conversation deleted successfully"
}
\`\`\`

## Estrutura do Projeto

\`\`\`
├── app/
│   ├── chat/
│   │   └── page.tsx          # Página principal do chat
│   ├── login/
│   │   └── page.tsx          # Página de login
│   ├── signup/
│   │   └── page.tsx          # Página de cadastro
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página inicial (redirect)
│   └── globals.css           # Estilos globais
├── components/
│   ├── chat-header.tsx       # Cabeçalho do chat
│   ├── chat-input.tsx        # Input de mensagens
│   ├── chat-message.tsx      # Componente de mensagem
│   ├── conversation-sidebar.tsx  # Sidebar de histórico
│   └── ui/                   # Componentes shadcn/ui
├── lib/
│   ├── api.ts                # Funções de API
│   ├── auth-context.tsx      # Contexto de autenticação
│   └── utils.ts              # Utilitários
└── README.md
\`\`\`

## Funcionalidades Implementadas

### Autenticação
- Login com email e senha
- Cadastro de novos usuários
- Logout
- Persistência de sessão com localStorage
- Proteção de rotas

### Chat
- Interface de conversação em tempo real
- Envio de mensagens
- Exibição de mensagens do usuário e da IA
- Auto-scroll para novas mensagens
- Indicador de carregamento

### Histórico
- Sidebar com lista de conversas
- Criação de novas conversas
- Seleção de conversas anteriores
- Exclusão de conversas
- Formatação de datas relativas

### Design
- Interface moderna e intuitiva
- Responsivo (mobile e desktop)
- Modo claro e escuro
- Animações suaves
- Feedback visual para ações

## Próximos Passos

Para conectar com sua API Flask:

1. Configure a variável `NEXT_PUBLIC_API_URL` no arquivo `.env.local`
2. Certifique-se de que sua API Flask implementa os endpoints descritos acima
3. Configure CORS na sua API Flask para aceitar requisições do front-end
4. Implemente a autenticação JWT na sua API
5. Conecte sua API ao Supabase para armazenamento de dados
6. Integre com a API do Hugging Face para as respostas da IA

## Deploy

Para fazer deploy na Vercel:

\`\`\`bash
vercel
\`\`\`

Não esqueça de adicionar a variável de ambiente `NEXT_PUBLIC_API_URL` nas configurações do projeto na Vercel.
