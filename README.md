# LeadNavigatorAI 2.0

Welcome to **LeadNavigatorAI 2.0**, a powerful, full-stack lead generation tool rebuilt from the ground up for stability, scalability, and a professional user experience. This version replaces the previous fragile web scraper with the official **Google Places API** and introduces a persistent **SQLite database**, transforming it into a robust platform for discovering and managing business leads.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)](#)
[![Users](https://img.shields.io/badge/Users-Skyler%20%26%20Eden-blue.svg)](#)
[![API](https://img.shields.io/badge/API-Google%20Places%20(New)-orange.svg)](#)

---

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd LeadNavigatorAI
npm install

# Configure environment
cp backend/.env.example backend/.env
# Add your Google Places API key to backend/.env

# Start development servers
npm run dev

# Access system
open http://localhost:5174/
```

**Login Tokens:**
- **Skyler**: `dialed-in-partner-access-2024`
- **Eden**: `dialed-in-business-partner-2024`

---

## ✨ Key Features

### 👥 **Multi-User Collaboration**
- **Shared lead database** - no duplicate work
- **User identity tracking** - "Found by: Skyler/Eden" badges
- **Separate API key billing** - financial control per user
- **Real-time collaboration** - see leads as they're added

### 🎯 **Premium Lead Generation**
- **Real Google Places data** - no synthetic/fake leads
- **Value-based ranking** - Premium (90-100), High (75-89), Medium (60-74), Standard (<60)
- **Phone number enrichment** - ~85% coverage with Google Places Details API
- **Advanced filtering** - city, category, value tier, contributor

### 🔒 **Secure & Professional**
- **Token-based authentication** - private business partner access
- **API key management** - per-user configuration and testing
- **Error handling** - robust JSON responses, never fails silently
- **Production ready** - Netlify deployment with security headers

---

## 🏗️ Architecture

```
/LeadNavigatorAI
  /backend
    - index.js
    - scraper.js
    - package.json
    - .env.example
  /frontend
    - src/App.jsx
    - vite.config.js
    - package.json
    - tailwind.config.js
  README.md
```

## Technology Stack

- **Backend**: Node.js, Express.js, Puppeteer
- **Frontend**: React, Vite, Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm

### Backend Setup

1.  **Navigate to the backend directory:**
    ```sh
    cd backend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory by copying the example file:
    ```sh
    cp .env.example .env
    ```
    You can modify the `PORT` in the `.env` file if needed.

4.  **Start the backend server:**
    ```sh
    npm start
    ```
    The server will be running on `http://localhost:3001` by default.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Start the frontend development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## How to Use

1.  Ensure both the backend and frontend servers are running.
2.  Open your browser and go to the frontend URL (e.g., `http://localhost:5173`).
3.  Enter a city and a business category into the input fields.
4.  Click the "Scrape Leads" button.
5.  The application will display the scraped business names, ratings, and review counts in a table.
