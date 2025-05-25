const API_BASE_URL = 'https://raildisha.divyanshvijay.in/api';

// Floor operations
export const createFloor = async (floorData) => {
  const response = await fetch(`${API_BASE_URL}/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(floorData)
  });
  return response.json();
};

// Get all floors
export const getFloors = async () => {
  const response = await fetch(`${API_BASE_URL}/maps`);
  return response.json();
};

// Get floor by ID
export const getFloor = async (floorId) => {
  const response = await fetch(`${API_BASE_URL}/maps/${floorId}`);
  return response.json();
};

// Marker operations
export const createMarker = async (markerData) => {
  const response = await fetch(`${API_BASE_URL}/markers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(markerData)
  });
  return response.json();
};

// Path operations
export const createPath = async (pathData) => {
  const response = await fetch(`${API_BASE_URL}/paths`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pathData)
  });
  return response.json();
};

// Boundary operations
export const createBoundary = async (boundaryData) => {
  const response = await fetch(`${API_BASE_URL}/boundaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boundaryData)
  });
  return response.json();
};

// Get all data for a floor
export const getFloorData = async (floorId) => {
  const [markers, paths, boundaries] = await Promise.all([
    fetch(`${API_BASE_URL}/markers?floor_id=${floorId}`).then(res => res.json()),
    fetch(`${API_BASE_URL}/paths?floor_id=${floorId}`).then(res => res.json()),
    fetch(`${API_BASE_URL}/boundaries?floor_id=${floorId}`).then(res => res.json())
  ]);
  return { markers, paths, boundaries };
}; 