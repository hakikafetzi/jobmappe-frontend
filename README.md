<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/logo-mark-dark.svg">
    <img src="./public/logo-mark.svg" alt="JobMappe logo" width="72" height="72">
  </picture>
</p>

<h1 align="center">JobMappe — Frontend</h1>

<p align="center">
  <strong>Web frontend of JobMappe, a job-application tracker for the German job market</strong><br>
  Job postings, companies, applications and notes in one place, from the first draft to the final answer.<br><br>
  <a href="https://github.com/hakikafetzi/jobmappe"><strong>Project overview</strong></a> ·
  <a href="https://github.com/hakikafetzi/jobmappe-backend"><strong>Backend (Spring Boot)</strong></a> ·
  <a href="#ai-assisted-development"><strong>AI-assisted development</strong></a> ·
  <a href="#getting-started"><strong>Getting started</strong></a>
</p>

<p align="center">
  <a href="https://github.com/hakikafetzi/jobmappe-frontend/actions/workflows/ci.yaml"><img src="https://github.com/hakikafetzi/jobmappe-frontend/actions/workflows/ci.yaml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query 5">
  <br>
  <img src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Tests: Vitest">
  <img src="https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white" alt="Built with Claude Code">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License: MIT">
</p>

---

![Home page](docs/screenshots/home.png)

## About

This repository contains the web frontend of [JobMappe](https://github.com/hakikafetzi/jobmappe). It talks to the [Spring Boot REST API](https://github.com/hakikafetzi/jobmappe-backend). The user interface is in German.

I built the frontend with an AI coding agent: to work with a modern React and TypeScript stack, and to find out how far I can take a real application with AI while keeping control of scope, design and quality. How that worked is described in [AI-assisted development](#ai-assisted-development).

> The full feature list, more screenshots and the Docker Compose setup for the complete application are in the [project overview](https://github.com/hakikafetzi/jobmappe). This README is about the frontend itself. All screenshots show fictional sample data.

## Table of contents

- [User interface](#user-interface)
- [AI-assisted development](#ai-assisted-development)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Testing](#testing)
- [Docker image](#docker-image)
- [CI/CD](#cicd)
- [License](#license)
- [Author](#author)

## User interface

What the frontend adds on top of the features of the API:

- **Kanban board** for applications with drag and drop between statuses, a drop zone for closing an application and "load more" per column; animated switch between board and table.
- **Command palette** (⌘K / Ctrl+K) for pages and actions, and to search postings, applications, companies and notes.
- **Keyboard shortcuts**, e.g. `N` for a new posting and `1`–`3` for the main areas.
- **Floating note windows** with a rich-text editor that stores Markdown; windows can be minimized into a tray, survive a reload and can be popped out into a separate browser window.
- **Personalisation per browser**: light, dark or system appearance, animations on or off, default views and a display name for the greeting.
- **Responsive layout** with a mobile dock.
- **Accessibility**: native dialogs, full keyboard navigation, ARIA where needed, and lint rules for accessible markup.
- **German error messages** derived from the API's status codes and field names, shown inline in forms or as a toast.

## AI-assisted development

The frontend was developed with **[Claude Code](https://claude.com/claude-code)**, Anthropic's AI coding agent, as a pair programmer. Most of the code was written by the AI; I set the direction, made the decisions and reviewed the results. The [backend](https://github.com/hakikafetzi/jobmappe-backend), in contrast, I wrote myself.

### My role

- **Product and concept**: the idea, the requirements, the feature scope and the UX design of the screens.
- **Architecture and rules**: the tech stack, the project structure, the API contract between frontend and backend, and the project rules the agent works by.
- **Steering and review**: breaking the work into tasks, reviewing the changes, deciding between alternatives and testing the app.

### How the workflow is set up

- **Project rules in [`CLAUDE.md`](CLAUDE.md)**: product rules (e.g. only build what the API supports, never filter on the client), architecture, conventions and error handling. The agent reads this file in every session, so decisions are made once and applied consistently.
- **API contract as the source of truth**: [`api-contract-backend-v1.md`](api-contract-backend-v1.md) describes endpoints, fields and error titles of the backend.
- **Tests as guardrails**: an in-memory fake backend that mirrors the API, served through MSW, lets every feature be tested against real HTTP requests, validation errors and conflicts.
- **One quality gate**: `npm run check` (format, lint, type-check and build, tests) has to pass before every commit, locally and in CI.
- **Strict tooling**: TypeScript in strict mode with `noUncheckedIndexedAccess` and Oxlint (including accessibility rules) catch many mistakes before review.

### What I learned

Working with an AI agent is fast, but only as good as its guidance: clear written rules, small well-defined tasks and automated checks matter more than long prompts. The agent speeds up the implementation; responsibility for the scope, the design decisions and the quality of the result stays with me.

## Tech stack

| Area         | Tools                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| UI           | [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org) (strict)                                     |
| Build        | [Vite 8](https://vite.dev)                                                                                               |
| Routing      | [React Router 8](https://reactrouter.com) (data router, lazy-loaded routes)                                              |
| Server state | [TanStack Query 5](https://tanstack.com/query)                                                                           |
| Styling      | CSS Modules with shared design tokens (light and dark theme), self-hosted fonts via [Fontsource](https://fontsource.org) |
| Testing      | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com), [MSW](https://mswjs.io)                    |
| Code quality | [Oxlint](https://oxc.rs), [Prettier](https://prettier.io)                                                                |
| Delivery     | [nginx](https://nginx.org) in Docker, GitHub Actions                                                                     |
| Development  | [Claude Code](https://claude.com/claude-code) (AI-assisted, see [above](#ai-assisted-development))                       |

## Architecture

```text
src/
├── app/        App shell, router, providers, path builders, global hotkeys
├── api/        One module per resource: endpoints, query/mutation hooks, DTO types
├── domain/     Enum labels and colours, allowed status transitions
├── features/   Pages and feature components: postings, applications, notes,
│               categories, home, settings, command palette
├── shared/     Design-system components, editor, hooks, theme, settings, utilities
├── styles/     Design tokens (light and dark), fonts and base reset
└── test/       Fake backend, MSW setup and render helpers
```

Key decisions:

- **The server does the work.** Lists are paginated, filtered, searched and sorted by the backend; the client never filters or re-sorts a page.
- **The URL is the state.** Filters, search, sorting, page, page size and view live in the query string, so every view can be bookmarked and shared.
- **Central error handling.** The backend returns Problem Details; the frontend maps status codes and field names to its own German messages and shows them inline or as a toast.
- **Rules in one place.** Status transitions live in a single module (`src/domain/transitions.ts`), which the board, the status pills and the detail page all use.
- **CSS Modules and design tokens.** Every component has its own stylesheet; colours, radii and shadows come from shared tokens with a light and a dark set.
- **No requests to third parties.** Fonts are bundled with the app instead of loaded from Google Fonts.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 24 and npm
- The [JobMappe backend](https://github.com/hakikafetzi/jobmappe-backend) running on `http://localhost:8080` (see its [Getting started](https://github.com/hakikafetzi/jobmappe-backend#getting-started))

### Installation

```bash
git clone https://github.com/hakikafetzi/jobmappe-frontend.git
cd jobmappe-frontend
npm ci
```

### Run the app

```bash
npm run dev
```

The app runs on [http://localhost:5173](http://localhost:5173). During development, Vite proxies every request to `/api` to `http://localhost:8080`, so no CORS setup is needed.

### Configuration

| Variable            | Default | Description                                                                                                                                |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | `/api`  | Base URL of the API, e.g. when frontend and backend run on different hosts. Not needed with the Docker image, which proxies `/api` itself. |

### Production build

```bash
npm run build     # type-checks and bundles into dist/
npm run preview   # serves the production build locally
```

## Scripts

| Command                | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Start the development server                                           |
| `npm run build`        | Type-check (`tsc -b`) and create a production build                    |
| `npm run preview`      | Serve the production build locally                                     |
| `npm run check`        | Format check, lint, build and unit tests — **run before every commit** |
| `npm test`             | Run unit and component tests once                                      |
| `npm run test:watch`   | Run unit and component tests in watch mode                             |
| `npm run lint`         | Lint with Oxlint                                                       |
| `npm run format`       | Format all files with Prettier                                         |
| `npm run format:check` | Check formatting without writing                                       |

## Testing

Unit and component tests run with Vitest in jsdom. Components are rendered against an in-memory implementation of the backend API (`src/test/fake-backend`), served through MSW, so the tests exercise real requests, pagination, validation errors and conflicts without a running backend. Pure logic (URL parsing, sorting parameters, status rules, note layout) lives in plain `.ts` files and is tested on its own.

```bash
npm test
npx vitest run src/features/home/homeText.test.ts   # a single file
npx vitest run -t "<test name>"                     # filter by name
```

## Docker image

Every release publishes a multi-platform image (`linux/amd64`, `linux/arm64`) to GitHub Container Registry:

```bash
docker pull ghcr.io/hakikafetzi/jobmappe-frontend:latest
```

The image builds the app with Node and serves it with **nginx** as a non-root user on port `8080`. nginx:

- serves the static files, with a fallback to `index.html` for client-side routes;
- proxies `/api/`, Swagger UI (`/swagger-ui/`, `/swagger-ui.html`) and the OpenAPI document (`/v3/api-docs`) to the backend; `/actuator` is not reachable;
- forwards the original host, port and protocol (`X-Forwarded-*`), also from an outer reverse proxy, so the backend builds correct absolute URLs;
- caches hashed assets for a year and always revalidates `index.html`;
- sets basic security headers and compresses text responses;
- answers health checks on `/healthz`.

| Variable      | Default               | Description                                                                                  |
| ------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `BACKEND_URL` | `http://backend:8080` | Address of the backend, resolved per request, so nginx also starts while the backend is down |

The nginx configuration is in [`nginx/`](nginx). Build the image locally:

```bash
docker build -t jobmappe-frontend .
```

To run the complete application, use the Docker Compose setup in the [project overview](https://github.com/hakikafetzi/jobmappe).

## CI/CD

- [`ci.yaml`](.github/workflows/ci.yaml) runs `npm run check` on every push to `main` and on every pull request.
- [`release.yaml`](.github/workflows/release.yaml) runs on version tags (`v1.2.3`): it runs the checks, then builds and pushes the image with the tags `1.2.3`, `1.2` and `latest`. Pre-releases (e.g. `v1.3.0-rc.1`) only get their own version tag.

## License

[MIT](LICENSE) © 2026 Haki Kafetzi

The bundled fonts (Inter, JetBrains Mono) are licensed under the SIL Open Font License; the license texts are shipped with the build as `fonts-LICENSE.txt`.

## Author

**Haki Kafetzi** · [GitHub](https://github.com/hakikafetzi) · [LinkedIn](https://www.linkedin.com/in/hakikafetzi)
