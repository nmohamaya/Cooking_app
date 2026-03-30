# Architecture Overview

This document provides a high-level view of the MyRecipeApp system architecture, covering system context, container structure, component responsibilities, and data flow.

## System Context Diagram

This diagram shows how MyRecipeApp fits into the broader ecosystem of users and external services.

```mermaid
graph TB
    User["User (Mobile / Web Browser)"]

    subgraph MyRecipeApp System
        Frontend["MyRecipeApp Frontend\n(React Native + Expo)"]
        Backend["Backend API Server\n(Node.js + Express)"]
    end

    subgraph External Services
        YouTube["YouTube / Instagram / TikTok\n(Video Platforms)"]
        YtDlp["yt-dlp\n(CLI Tool - Subtitle Extraction)"]
        AsyncStorageDB["AsyncStorage\n(On-Device Persistence)"]
    end

    User -->|"Browse recipes, plan meals,\nmanage shopping lists"| Frontend
    User -->|"Paste video URL"| Frontend
    Frontend -->|"REST API calls\n(Axios over HTTP)"| Backend
    Frontend -->|"Read/write recipes,\nmeal plans, settings"| AsyncStorageDB
    Backend -->|"Spawn child process\nfor subtitle extraction"| YtDlp
    YtDlp -->|"Download VTT subtitles"| YouTube
```

## Container Diagram

This diagram breaks the system into its deployable containers and shows the technology choices and communication patterns.

```mermaid
graph LR
    subgraph Client Device
        FE["Frontend App\n\nReact Native 0.81.5\nExpo SDK 54\nReact Navigation 6.x\nAsyncStorage"]
    end

    subgraph Backend Server
        API["Express API Server\n\nNode.js >= 18\nExpress 4.18.2\nWinston logging\nHelmet + Rate Limiting"]
        FS["File System\n\ntemp/uploads/\ntemp/cache/\ntemp/subtitles/\nlogs/cost-tracking.json"]
    end

    subgraph External
        VP["Video Platforms\n\nYouTube\nInstagram\nTikTok"]
        YTDLP["yt-dlp\n\nSubtitle extraction\nVideo download"]
    end

    FE -->|"HTTP/JSON\nport 3001 (default)"| API
    API -->|"child_process spawn"| YTDLP
    YTDLP -->|"HTTP/HTTPS"| VP
    API -->|"Read/Write"| FS
```

## Component Responsibilities

### Frontend (MyRecipeApp/)

| Component | Responsibility |
|-----------|---------------|
| **App.js** | Main entry point. Manages top-level state (recipes, timers, meal plans, shopping lists), screen routing via custom tab navigation, and data persistence with AsyncStorage. |
| **Screens (8)** | UI for each app section: HomeScreen, AddRecipeScreen, EditRecipeScreen, RecipeDetailScreen, RecipesTab, MealPlanTab, ShoppingTab, CostMonitoringScreen. |
| **Components (10+)** | Reusable UI: TopTabBar (icon-based tab navigation), TabNavigator, WeeklyMealPlanView, VideoRecipeExtractionWorkflow, TimerComponents (floating widget, modals), TranscriptionProgress. |
| **Services (11)** | Business logic layer: apiClient (centralized HTTP with retry), youtubeExtractorService, recipeExtraction (text parsing), timerService, platform-specific extractors (Instagram, TikTok, website). |
| **Contexts** | RecipeContext provides shared recipe state (CRUD operations) with AsyncStorage persistence. |

### Backend (backend/)

| Component | Responsibility |
|-----------|---------------|
| **server.js** | Express app setup: middleware stack (helmet, rate limiter, CORS, JSON parser), route mounting, 404/error handlers, graceful shutdown. |
| **Routes (4)** | HTTP request handling: download (video download), transcribe (subtitle extraction), recipes (recipe extraction from text), cost (usage monitoring). |
| **Services (8)** | Core logic: downloadService (yt-dlp video download), transcriptionService (yt-dlp subtitle extraction + VTT parsing), recipeExtractionService (text-to-structured-recipe), ingredientService, cookingStepsService, audioService, cacheService (in-memory Map), costTracker (file-based JSON log). |
| **Config** | env.js (environment variable loading), logger.js (Winston structured logging), deploymentUtils.js. |

## Data Flow Overview

### Recipe Extraction (Primary Use Case)

The main use case is extracting a structured recipe from a cooking video URL. The flow spans both frontend and backend:

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend App
    participant Backend as Express API
    participant YtDlp as yt-dlp (CLI)
    participant Platform as Video Platform

    User->>Frontend: Paste video URL
    Frontend->>Backend: POST /api/transcribe {url}
    Backend-->>Frontend: 202 {jobId, status: "queued"}

    Backend->>YtDlp: spawn yt-dlp --write-sub --skip-download
    YtDlp->>Platform: Request VTT subtitles
    Platform-->>YtDlp: VTT subtitle file
    YtDlp-->>Backend: Subtitle file on disk

    Backend->>Backend: Parse VTT, clean text
    Backend->>Backend: Cache transcription (in-memory)
    Backend->>Backend: Track cost ($0.00 for subtitles)

    Frontend->>Backend: GET /api/transcribe/:jobId (poll)
    Backend-->>Frontend: {status: "completed", text: "..."}

    Frontend->>Backend: POST /api/recipes {transcribedText}
    Backend-->>Frontend: 202 {jobId, status: "queued"}

    Backend->>Backend: ingredientService.parse()
    Backend->>Backend: cookingStepsService.parse()
    Backend->>Backend: Assemble structured recipe

    Frontend->>Backend: GET /api/recipes/:jobId (poll)
    Backend-->>Frontend: {status: "completed", recipe: {...}}

    Frontend->>Frontend: Display recipe preview
    User->>Frontend: Confirm and save
    Frontend->>Frontend: AsyncStorage.setItem()
```

### Local Operations (No Backend)

Many features operate entirely on-device without backend calls:

- **Recipe CRUD** -- recipes are stored in AsyncStorage and managed through RecipeContext
- **Meal Planning** -- weekly meal plan assignments stored in AsyncStorage
- **Shopping Lists** -- auto-generated from meal plan ingredients, stored locally
- **Cooking Timers** -- managed by timerService with local state and vibration alerts
- **Search and Filter** -- client-side filtering of the local recipe collection
- **Import/Export** -- JSON-based recipe sharing via file system

### Data Persistence

All user data is persisted on-device using AsyncStorage with these keys:

| Key | Data |
|-----|------|
| `recipes` | Array of recipe objects |
| `@myrecipeapp/meal_plan` | Weekly meal plan assignments (also written to `mealPlan` for backward compat) |
| `shoppingList` | Current shopping list items |
| `cookingTimers` | Active timer state |
| `extractionHistory` | Last 10 extraction URLs |
| `extractionFeedback` | User feedback on extractions |

The backend maintains no persistent user data. It uses:
- **In-memory Maps** for job queues (download, transcribe, recipe extraction) -- lost on restart
- **In-memory Map** for transcription cache -- lost on restart
- **File-based JSON log** for cost tracking (`logs/cost-tracking.json`)
