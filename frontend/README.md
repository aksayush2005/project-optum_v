# Frontend Dashboard

Minimalist industrial React dashboard for the Golden Signature Multi-Objective Optimization Engine.

## Run
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Folder Structure
```text
frontend/
  index.html
  package.json
  vite.config.js
  src/
    App.jsx
    main.jsx
    styles.css
    components/
      Layout.jsx
      Sidebar.jsx
      Navbar.jsx
      KpiCard.jsx
    pages/
      OverviewPage.jsx
      GoldenSignaturePage.jsx
      MonitoringPage.jsx
      TargetConfigPage.jsx
      HistoricalPage.jsx
    data/
      dummyData.js
```

## Component Hierarchy
```text
App
  Layout
    Sidebar
    Navbar
    Routes
      OverviewPage
        KpiCard[]
      GoldenSignaturePage
      MonitoringPage
      TargetConfigPage
      HistoricalPage
```
