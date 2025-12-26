# BeyondChats - AI Content Improver

A full-stack application that scrapes blog content, performs automated research using Google Search (with smart fallbacks), and uses Gemini AI to rewrite articles into authoritative, high-quality content.

##  Architecture & Data Flow

This project uses a monolithic architecture with three distinct services working in harmony.

graph TD
    User["User / Browser"] -->|View Dashboard| React["Frontend (React + Vite)"]
    React -->|Fetch API| Laravel["Backend (Laravel API)"]
    Laravel <-->|Store Data| Mongo[("MongoDB Atlas")]
    
    subgraph "Background AI Service"
        Worker["Node.js Worker"] -->|1. Poll Pending Articles| Laravel
        Worker -->|2. Smart Research (Cheerio/Google)| Google["Web Search"]
        Worker -->|3. Enhance Content| Gemini["Gemini AI"]
        Worker -->|4. Update Database| Laravel
    end

Local Setup Instructions
Follow these steps to run the entire project locally.

Prerequisites
Node.js (v18+) & NPM

PHP (v8.1+) & Composer

MongoDB (Local or Atlas Connection String)



1. Backend Setup (Laravel)
cd backend

# Install PHP dependencies
composer install

# Set up environment variables
cp .env.example .env
# Open .env and add your MongoDB connection string (DB_DSN)

# Generate App Key
php artisan key:generate

# Start the server
php artisan serve
Backend will run at: http://127.0.0.1:8000



2. Worker Setup (Node.js)
cd ../node-worker

# Install Node dependencies
npm install

# Set up environment variables
# Create a .env file with:
# GEMINI_API_KEY=your_google_gemini_key
# LARAVEL_API=[http://127.0.0.1:8000/api/articles](http://127.0.0.1:8000/api/articles)

# Start the worker
node index.js



3. Frontend Setup (React)
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with:
# VITE_API_BASE_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

# Start the dev server
npm run dev
Frontend will run at: http://localhost:5173
