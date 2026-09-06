# TrenchSync

**Coordinate Before You Dig.**

GIS-driven, rule-based pre-excavation coordination platform for road and utility work.

## Quick Start

### Backend
```bash
cd backend
npm install
npm start
```
Runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

## Demo Scenario

Open the app and navigate to **MG Road** on the GIS Map or Conflicts page to see the primary demo:
- Water (Sept 10–15)
- Telecom (Sept 12–16)
- Electricity (Sept 14–18)

The system detects spatial + temporal overlap, calculates a Rule-Based Coordination Score, compares scenarios, and allows Human Approval of coordination proposals.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS, Leaflet, OpenStreetMap
- **Backend:** Node.js, Express
- **Database:** SQLite

## Note

All data is synthetic demo data for prototype demonstration.
# TrenchSync
