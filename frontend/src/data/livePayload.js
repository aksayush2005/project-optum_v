// Full row including target columns — used by /batches/compare (which handles targets)
export const liveBatchRow = {
  machine_id: 2,
  material_type_id: 3,
  batch_size: 1120,
  temperature: 191.4,
  pressure: 5.8,
  mixing_speed: 338,
  vibration: 1.7,
  good_output: 1015,
  total_input: 1138,
  energy_kwh: 438,
  yield: 92.4,
  quality_score: 88.6,
  emission_kgco2e: 123,
  throughput_units_hr: 116
};

// Input-only row — used by /optimize/recommend (target columns excluded to avoid ParseErrors)
export const liveInputRow = {
  machine_id: 2,
  material_type_id: 3,
  batch_size: 1120,
  temperature: 191.4,
  pressure: 5.8,
  mixing_speed: 338,
  vibration: 1.7,
  good_output: 1015,
  total_input: 1138,
};

export const defaultMode = "yield_energy";
