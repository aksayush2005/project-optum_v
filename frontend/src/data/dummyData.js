export const kpiCards = [
  { label: "Current Yield", value: "92.4%", delta: "+1.8%", positive: true },
  { label: "Energy / Batch", value: "438 kWh", delta: "-4.7%", positive: true },
  { label: "Emission Intensity", value: "123 kgCO2e", delta: "-2.9%", positive: true },
  { label: "Quality Index", value: "88.6", delta: "-0.4", positive: false }
];

export const trendData = [
  { shift: "06:00", yield: 90.2, energy: 462, quality: 87.8 },
  { shift: "08:00", yield: 91.1, energy: 451, quality: 88.3 },
  { shift: "10:00", yield: 91.9, energy: 447, quality: 88.7 },
  { shift: "12:00", yield: 92.4, energy: 438, quality: 88.6 },
  { shift: "14:00", yield: 92.1, energy: 441, quality: 88.4 },
  { shift: "16:00", yield: 92.7, energy: 435, quality: 89.1 }
];

export const batchVsSignature = [
  { metric: "Yield (%)", current: 92.4, golden: 93.1, status: "Deviation" },
  { metric: "Energy (kWh)", current: 438, golden: 426, status: "Deviation" },
  { metric: "Quality Score", current: 88.6, golden: 89.2, status: "Within" },
  { metric: "Emission (kgCO2e)", current: 123, golden: 118, status: "Deviation" }
];

export const signatures = [
  {
    id: "GS-YE-014",
    mode: "Best Yield + Lowest Energy",
    version: "v14",
    approvedBy: "Process Engineer",
    createdAt: "2026-02-26",
    yield: 93.1,
    energy: 426,
    quality: 89.4,
    emission: 118,
    state: "Active"
  },
  {
    id: "GS-QY-009",
    mode: "Optimal Quality + Best Yield",
    version: "v9",
    approvedBy: "Quality Lead",
    createdAt: "2026-02-21",
    yield: 92.8,
    energy: 434,
    quality: 90.3,
    emission: 121,
    state: "Archived"
  },
  {
    id: "GS-PE-006",
    mode: "Max Performance + Min Environment",
    version: "v6",
    approvedBy: "Sustainability Manager",
    createdAt: "2026-02-18",
    yield: 91.9,
    energy: 419,
    quality: 88.9,
    emission: 112,
    state: "Candidate"
  }
];

// Normalized 0-100 scores for Radar chart
export const radarSignatures = [
  { axis: "Yield", "GS-YE-014": 93, "GS-QY-009": 88, "GS-PE-006": 80 },
  { axis: "Quality", "GS-YE-014": 85, "GS-QY-009": 95, "GS-PE-006": 76 },
  { axis: "Energy", "GS-YE-014": 92, "GS-QY-009": 80, "GS-PE-006": 97 },
  { axis: "Emission", "GS-YE-014": 78, "GS-QY-009": 70, "GS-PE-006": 96 },
  { axis: "Throughput", "GS-YE-014": 88, "GS-QY-009": 84, "GS-PE-006": 82 },
];

export const proposedUpdates = [
  {
    id: "CAND-031",
    mode: "Best Yield + Lowest Energy",
    confidence: 0.92,
    expectedYieldGain: 0.6,
    expectedEnergyReduction: 9.4,
    objectives: { yield: 93.7, energy: 416.6, quality: 89.6, emission: 115.2 }
  },
  {
    id: "CAND-032",
    mode: "Max Performance + Min Environment",
    confidence: 0.88,
    expectedYieldGain: 0.3,
    expectedEnergyReduction: 12.1,
    objectives: { yield: 92.2, energy: 406.9, quality: 89.1, emission: 108.4 }
  }
];

export const liveParameters = [
  { key: "Temperature", value: "191.4 C", status: "Within" },
  { key: "Pressure", value: "5.8 bar", status: "Within" },
  { key: "Mixing Speed", value: "338 rpm", status: "Deviation" },
  { key: "Batch Size", value: "1120 kg", status: "Within" }
];

export const recommendations = [
  { parameter: "Mixing Speed", current: 338, recommended: 322, unit: "rpm", confidence: "91%" },
  { parameter: "Temperature", current: 191.4, recommended: 189.8, unit: "C", confidence: "86%" },
  { parameter: "Feed Delay", current: 17, recommended: 14, unit: "sec", confidence: "82%" }
];

// Monitoring gauges
export const gaugeData = {
  batchVariability: 72,   // 0-100, lower is better
  targetCompliance: 88    // 0-100, higher is better
};

export const historyRows = [
  { batch: "B-4071", machine: "Line-2", yield: 91.7, quality: 88.1, energy: 446, emission: 126, roi: 1420 },
  { batch: "B-4072", machine: "Line-3", yield: 92.8, quality: 89.4, energy: 433, emission: 120, roi: 1760 },
  { batch: "B-4073", machine: "Line-1", yield: 93.2, quality: 89.1, energy: 428, emission: 117, roi: 1815 },
  { batch: "B-4074", machine: "Line-2", yield: 91.9, quality: 88.6, energy: 439, emission: 122, roi: 1540 },
  { batch: "B-4075", machine: "Line-1", yield: 92.6, quality: 89.0, energy: 431, emission: 119, roi: 1695 }
];

// Reliability rating per batch based on energy deviation from golden (426 kWh)
export const reliabilityMap = {
  "B-4071": { label: "Medium", color: "#f5c842" },
  "B-4072": { label: "High", color: "#10b981" },
  "B-4073": { label: "High", color: "#10b981" },
  "B-4074": { label: "Medium", color: "#f5c842" },
  "B-4075": { label: "High", color: "#10b981" }
};

export const energySavingsTrend = [
  { week: "W1", savings: 2.4 },
  { week: "W2", savings: 3.1 },
  { week: "W3", savings: 3.9 },
  { week: "W4", savings: 4.2 },
  { week: "W5", savings: 4.8 },
  { week: "W6", savings: 5.1 }
];

// Asset Health / Maintenance Notifications
export const assetAlerts = [
  {
    id: "ALT-001",
    severity: "warn",
    title: "Mixing Motor Power Spike",
    body: "Line-2 motor drawing 12% above golden baseline for 18 min.",
    time: "09:31",
    read: false
  },
  {
    id: "ALT-002",
    severity: "warn",
    title: "Coolant Flow Rate Drop",
    body: "Line-1 coolant flow at 94% of nominal — check valve V-07.",
    time: "10:04",
    read: false
  },
  {
    id: "ALT-003",
    severity: "info",
    title: "Predictive Maintenance Due",
    body: "Line-3 pump scheduled for inspection in 2 operating shifts.",
    time: "08:00",
    read: true
  }
];
