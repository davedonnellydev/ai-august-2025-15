# Project 15 #AIAugustAppADay: Blog Summariser

![Last Commit](https://img.shields.io/github/last-commit/davedonnellydev/ai-august-2025-15)

**📆 Date**: 25/Aug/2025  
**🎯 Project Objective**: Paste a blog URL, get an AI-generated summary.  
**🚀 Features**: Input blog URL; Fetch + extract content; AI-generated summary  
**🛠️ Tech used**: Next.js, TypeScript, OpenAI API, [Postlight Parser](github.com/postlight/parser)  
**▶️ Live Demo**: [https://ai-august-2025-15.netlify.app/](https://ai-august-2025-15.netlify.app/)

## 🗒️ Summary

This project was a **blog summariser**. It uses the Postlight Parser to fetch content from a URL (title, author, body, etc.), stores that data in `localStorage`, and then calls the OpenAI Responses API to produce different kinds of summaries for each webpage:

- **TL;DR short summary**
- **Plain English summary**
- **Key takeaways summary**
- **Structured outline**
- **Structured summary**
- **FAQs summary**

I feel like I’m starting to hit a good rhythm with these builds. One approach that worked particularly well was creating a **“project rule” document** inside Cursor — containing the full app shape, UX description, and user flow. I could then use this description as context when asking Cursor to break the build into stages. I even got Cursor to create its own “project rule” doc to store its breakdown of those stages, which made referencing them throughout the build seamless. The result: the app came together smoothly and quickly.

Another interesting part of this project was working with the Postlight Parser itself. It hasn’t been updated in years, and it relies on some deprecated dependencies that can’t be replaced. To be sure it wasn’t a dead end, I built a barebones prototype first to test its output. Once I confirmed it still worked and understood the data it returned, I was able to design the app around those discoveries more confidently.

**Lessons learned**

- Documenting project rules and flows upfront helps AI tools guide development more effectively.
- Old dependencies aren’t always dealbreakers — but always test them in isolation before committing to building around them.
- Structuring AI prompts and context deliberately makes collaboration with tools like Cursor much more productive.

**Final thoughts**  
This project was both practical and smooth. It reinforced the importance of planning and documentation — not just for myself, but for the AI tools helping me build.

This project has been built as part of my AI August App-A-Day Challenge. You can read more information on the full project here: [https://github.com/davedonnellydev/ai-august-2025-challenge](https://github.com/davedonnellydev/ai-august-2025-challenge).

## 🧪 Testing

![CI](https://github.com/davedonnellydev/ai-august-2025-15/actions/workflows/npm_test.yml/badge.svg)  
_Note: Test suite runs automatically with each push/merge._

## Quick Start

1. **Clone and install:**

   ```bash
   git clone https://github.com/davedonnellydev/ai-august-2025-15.git
   cd ai-august-2025-15
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development:**

   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

```

### Key Configuration Files

- `next.config.mjs` – Next.js config with bundle analyzer
- `tsconfig.json` – TypeScript config with path aliases (`@/*`)
- `theme.ts` – Mantine theme customization
- `eslint.config.mjs` – ESLint rules (Mantine + TS)
- `jest.config.cjs` – Jest testing config
- `.nvmrc` – Node.js version

### Path Aliases

```ts
import { Component } from '@/components/Component'; // instead of '../../../components/Component'
```

## 📦 Available Scripts

### Build and dev scripts

- `npm run dev` – start dev server
- `npm run build` – bundle application for production
- `npm run analyze` – analyze production bundle

### Testing scripts

- `npm run typecheck` – checks TypeScript types
- `npm run lint` – runs ESLint
- `npm run jest` – runs jest tests
- `npm run jest:watch` – starts jest watch
- `npm test` – runs `prettier:check`, `lint`, `typecheck` and `jest`

### Other scripts

- `npm run prettier:check` – checks files with Prettier
- `npm run prettier:write` – formats files with Prettier

## 📜 License

![GitHub License](https://img.shields.io/github/license/davedonnellydev/ai-august-2025-15)  
This project is licensed under the MIT License.
