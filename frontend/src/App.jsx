import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const GoldenSignaturePage = lazy(() => import("./pages/GoldenSignaturePage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const TargetConfigPage = lazy(() => import("./pages/TargetConfigPage"));
const HistoricalPage = lazy(() => import("./pages/HistoricalPage"));

function App() {
  return (
    <Layout>
      <Suspense fallback={<p className="subtle">Loading page...</p>}>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/signatures" element={<GoldenSignaturePage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/targets" element={<TargetConfigPage />} />
          <Route path="/history" element={<HistoricalPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
