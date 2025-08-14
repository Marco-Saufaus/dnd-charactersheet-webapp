# D&D Character Sheet App

A modern web application for managing Dungeons & Dragons character sheets.

## Features
- FastAPI backend with MongoDB integration
- REST API for character management
- Vite-powered frontend with client-side routing
- Character list view and navigation (Home, Characters, Search, Settings)

## Project Structure
```
backend/    # FastAPI backend
frontend/   # Vite frontend
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js (v18+ recommended)
- MongoDB 8.0+

### Backend Setup
1. Install dependencies:
   ```sh
   cd backend
   poetry install
   ```
2. Start the backend server:
   ```sh
   poetry run dev
   ```

### Frontend Setup
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
- Visit `http://localhost:5173` in your browser.
- Navigate using the menu.
- Manage characters via the Characters page.

## License
MIT
