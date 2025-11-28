# Personal Knowledge AI

A powerful Personal Knowledge AI system that ingests your documents, notes, emails, and learning materials, providing conversational access to your entire knowledge base through RAG (Retrieval-Augmented Generation).

## Features

- **📚 Document Ingestion**: Upload and index various document formats (TXT, Markdown, PDF)
- **💬 Conversational Interface**: Chat with your knowledge base using natural language
- **🔍 Semantic Search**: Advanced vector-based retrieval for accurate, context-aware responses
- **📝 Source Citations**: Every answer includes references to the source documents
- **🎨 Modern UI**: Beautiful, responsive interface with dark mode and smooth animations
- **🔒 Privacy-First**: Self-hosted with local PostgreSQL database using Docker

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **AI/RAG**: LlamaIndexTS, OpenAI GPT-4o
- **Vector Database**: PostgreSQL with pgvector extension
- **Database ORM**: Drizzle ORM

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API Key

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd personal-knowledge-ai
npm install
```

### 2. Set up Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5433/knowledge_ai"
OPENAI_API_KEY="your-openai-api-key-here"
```

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

This will start a PostgreSQL database with pgvector extension on port 5433.

### 4. Initialize Database

```bash
DATABASE_URL="postgresql://user:password@localhost:5433/knowledge_ai" npx drizzle-kit push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Documents

1. Navigate to the **Knowledge Base** tab
2. Drag and drop files or click "Choose Files"
3. Supported formats: TXT, Markdown, PDF
4. Wait for the upload to complete

### Chatting with Your Knowledge

1. Go to the **Chat** tab
2. Type your question in the input field
3. The AI will search your knowledge base and provide answers with source citations

## Project Structure

```
personal-knowledge-ai/
├── app/
│   └── api/
│       ├── chat/         # Chat API endpoint
│       └── ingest/       # Document ingestion endpoint
├── components/
│   ├── chat-interface.tsx      # Chat UI component
│   └── knowledge-manager.tsx   # Upload UI component
├── lib/
│   ├── db/
│   │   ├── schema.ts     # Database schema
│   │   └── index.ts      # Database client
│   ├── llamaindex-config.ts  # LLM configuration
│   ├── vector-store.ts   # Vector store logic
│   └── utils.ts          # Utility functions
├── src/
│   └── app/
│       ├── globals.css   # Global styles
│       ├── layout.tsx    # Root layout
│       └── page.tsx      # Main page
├── docker-compose.yml    # PostgreSQL setup
└── drizzle.config.ts     # Drizzle ORM config
```

## Development

### Database Management

View database:
```bash
docker exec -it personal-knowledge-ai-db-1 psql -U user -d knowledge_ai
```

Stop database:
```bash
docker compose down
```

### Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Acknowledgments

- Built with [LlamaIndexTS](https://ts.llamaindex.ai/)
- Powered by [OpenAI](https://openai.com/)
- UI inspired by modern AI chat interfaces
