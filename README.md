# AI Doctor

An AI-powered symptom checker chat app. Describe how you're feeling and get plain-language guidance on possible
causes, self-care suggestions, and when to seek professional or emergency care. Conversations are saved so you can
pick up where you left off.

**This app does not provide medical diagnosis or treatment. It is not a substitute for a licensed healthcare
professional. In a medical emergency, call your local emergency number.**

## Key technologies

- [TanStack Start](https://tanstack.com/start) (React) for the app and server routes
- [TanStack AI](https://tanstack.com/ai) for streaming chat with Anthropic/OpenAI/Gemini/Ollama providers
- [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/) for zero-config LLM access in production
- [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-db/) (managed Postgres) with
  [Drizzle ORM](https://orm.drizzle.team/) for persisting chat history
- Tailwind CSS for styling

## Running locally

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`. When deployed on Netlify with AI Gateway enabled, no API keys are needed —
credentials are injected automatically. For local development, set one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or
`GEMINI_API_KEY` in your environment, or run a local Ollama server.

Chat history is stored in a Netlify Database (Postgres). Use `netlify dev` to run with the platform's local
emulation, including the database connection.

## Database migrations

Schema is defined in `db/schema.ts`. After changing it, generate a migration:

```bash
npx drizzle-kit generate --name <descriptive_name>
```

Migrations are applied automatically by Netlify at deploy time.
