# 1️⃣ Project Title

## WanderLite Smart Tourism Dashboard

---

# 2️⃣ One-Line Summary

Real-time tourism dashboard that combines weather, currency exchange, and nearby attractions in one experience.

---

# 3️⃣ Short Project Summary

WanderLite is a web-based travel planning dashboard that helps users explore any city by viewing live weather, current exchange rates, and nearby attractions on an interactive map.

It centralizes essential travel intelligence into one clean, accessible interface for faster decision-making before and during trips.

---

# 4️⃣ Tech Stack

## Backend

- Node.js
- Express.js
- JavaScript (CommonJS)

## Frontend

- HTML/CSS
- Vanilla JavaScript
- Font Awesome (modern icon system)
- Leaflet.js (interactive map)

## Database

- None (API-driven platform)

## Deployment

- Local Node.js runtime (`npm start`)
- Render-compatible Express setup

## External Services / APIs

- OpenWeather API (weather + geocoding)
- Frankfurter API (live exchange rates)
- Geoapify Places API (primary attractions source)
- OpenStreetMap Overpass API (fallback attractions source)

---

# 5️⃣ Problem Statement

Travelers often switch between multiple apps/tabs for weather, currency conversion, and places to visit.

This causes friction and slows trip planning.

WanderLite solves this by aggregating key travel data into one structured, visual dashboard with real-time updates.

---

# 6️⃣ Key Features

- City-based weather insights (temperature, humidity, wind, pressure, sunrise/sunset)
- Live currency conversion across major currencies
- Category-based attraction discovery (sights, museums, parks, entertainment, restaurants)
- Interactive map with attraction markers and quick map actions
- Fallback provider logic for attraction availability
- Bright, modern, responsive UI with icon-rich navigation
- Public access (no authentication required)

---

# 7️⃣ System Architecture

## Architecture Pattern

Layered Web Architecture (Presentation + Application + Integration)

## Layers

- **Presentation Layer:** Static pages (`HTML/CSS/JS`) and client-side rendering
- **Application Layer:** Express route handlers and response normalization
- **Integration Layer:** External API connectors (weather, exchange, attractions)

## Flow

Client Request → Express Route → External API(s) → Normalized JSON → UI Rendering

## Design Decisions

- API calls and secrets moved to backend for security
- Standardized response models for predictable frontend rendering
- Attraction fallback strategy added for resilience
- Shared CSS design system for maintainability and consistent UX

---

# 8️⃣ Data Design

## Main Runtime Models

- Weather response object
- Exchange response object
- Attractions collection response object

## Key Runtime Relationships

- One city query → one weather payload + destination coordinates
- One coordinate pair → many nearby attractions
- One conversion request → one exchange result

## Validation & Constraints

- Required query parameters (`city`, `from`, `to`, `amount`, `lat`, `lon`)
- Numeric validation for coordinates and conversion amount
- Structured API error payloads for upstream failures
- Fallback to Overpass when Geoapify key is missing/invalid

---

# 9️⃣ Deployment & Hosting

## Docker

Not used

## Backend

Node.js + Express standalone app

## Environment Configuration

`.env` file for API keys and runtime port

Example:

```
WEATHER_API_KEY=your_openweather_key
GEOAPIFY_API_KEY=your_geoapify_key
PORT=3000
```

## Deployment Challenges

- Securing API keys while keeping frontend simple
- Handling third-party API instability and invalid credentials
- Keeping attraction results available via fallback provider

---

# 🔟 Demo Access

## Access Model

Public platform (no login credentials required)

## Run Locally

1. Install dependencies
2. Start server
3. Open app in browser

```
npm install
npm start
```

Open:

`http://localhost:3000`

---

# 1️⃣1️⃣ Engineering Decisions & Lessons Learned

- Chose Express + API-first design for rapid and modular delivery
- Migrated from static exchange data to live exchange API for accuracy
- Removed exposed client-side API keys and centralized integrations on backend
- Implemented fallback attractions provider to improve reliability
- Unified styling into a bright, reusable design system for portfolio quality
- Improved maintainability with modular scripts and helper-based server logic
