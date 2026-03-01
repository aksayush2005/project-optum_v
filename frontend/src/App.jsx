import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import GoldenSignaturePage from "./pages/GoldenSignaturePage";
import MonitoringPage from "./pages/MonitoringPage";
import TargetConfigPage from "./pages/TargetConfigPage";
import HistoricalPage from "./pages/HistoricalPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/signatures" element={<GoldenSignaturePage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/targets" element={<TargetConfigPage />} />
        <Route path="/history" element={<HistoricalPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
