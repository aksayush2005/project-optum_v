async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

export function getHealth() {
  return request("/health", { method: "GET" });
}

export function getActiveSignatures(mode) {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return request(`/signatures/active${query}`, { method: "GET" });
}

export function compareBatch(payload) {
  return request("/batches/compare", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getRecommendation(payload) {
  return request("/optimize/recommend", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function promoteSignature(payload) {
  return request("/signatures/promote", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateConstraints(payload) {
  return request("/constraints/update", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function simulateWhatIf(payload) {
  return request("/simulate/what-if", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
