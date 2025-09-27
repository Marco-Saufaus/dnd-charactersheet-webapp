# D&D Character Sheet Webapp

A modern web application for managing Dungeons & Dragons character sheets.

## Features
- FastAPI backend with MongoDB integration
- REST API for character management
- Vite-powered frontend with client-side routing
- Character list view and navigation (Home, Characters, Search, Settings)

## Docker Architecture

The application runs as a multi-container Docker setup with automated data import and SPA routing support:

![docker-architecture](docs/docker-architecture.svg)

## Project Structure
```
backend/            # FastAPI backend
frontend/           # Vite frontend
docs/               # Documentation and diagrams
data/               # D&D 5e tools data for import
docker-compose.yml  # Multi-container orchestration
```

## Getting Started

### Docker Setup (Recommended)
Run the entire application stack with one command:
```sh
docker compose up --build
```

This will:
- Start MongoDB with persistent data storage
- Build and run the backend with automatic data import
- Build and run the frontend with SPA routing support
- Set up proper networking between all services

Access the application at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:28017

### Local Development Setup

#### Prerequisites
- Python 3.11+
- Node.js (v18+ recommended)
- MongoDB 8.0+

#### Backend Setup
1. Install dependencies:
   ```sh
   cd backend
   poetry install
   ```
2. Start the backend server:
   ```sh
   poetry run dev
   ```

#### Frontend Setup
1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Start the frontend dev server:
   ```sh
   npm run dev
   ```

### Usage
- Visit the application in your browser
- Navigate using the menu (Home, Characters, Search, Settings)
- Manage characters via the Characters page
- All D&D 5e data is automatically imported and searchable

## Releasing

1. Update the container image tags in `docker-compose.yml` to the desired semantic version (for example `0.2.0`).
2. Commit the change to your main branch.
3. From the **Actions** tab, run the **Release** workflow. Optionally provide a different git ref if you need to release from a branch or commit other than the current default.
4. The workflow will:
   - Validate that both backend and frontend images share the same version tag.
   - Build and publish Docker images to GitHub Container Registry with the new version and the `latest` tag.
   - Create and push a git tag (`vX.Y.Z`).
   - Create a GitHub Release with auto-generated notes.

## License
MIT
