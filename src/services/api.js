const API_BASE_URL = 'https://raildisha.divyanshvijay.in';

// Floor operations
export const createFloor = async (floorData) => {
  const response = await fetch(`${API_BASE_URL}/api/floors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(floorData)
  });
  return response.json();
};

// Get all floors
export async function getFloors() {
    const response = await fetch(`${API_BASE_URL}/api/floors`);
    if (!response.ok) {
        throw new Error('Failed to fetch floors');
    }
    return response.json();
}

// Get floor by ID
export const getFloor = async (floorId) => {
  const response = await fetch(`${API_BASE_URL}/api/floors/${floorId}`);
  return response.json();
};

// Marker operations
export const createMarker = async (markerData) => {
  const response = await fetch(`${API_BASE_URL}/api/markers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(markerData)
  });
  return response.json();
};

// Path operations
export const createPath = async (pathData) => {
  const response = await fetch(`${API_BASE_URL}/api/paths`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pathData)
  });
  return response.json();
};

// Boundary operations
export const createBoundary = async (boundaryData) => {
  const response = await fetch(`${API_BASE_URL}/api/boundaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boundaryData)
  });
  return response.json();
};

// Get all data for a floor
export async function getFloorData(floorId) {
    try {
        // Get markers
        const markersResponse = await fetch(`${API_BASE_URL}/api/markers?floor_id=${floorId}`);
        if (!markersResponse.ok) {
            throw new Error('Failed to fetch markers');
        }
        const markers = await markersResponse.json();
        console.log('Raw markers from API:', markers);

        // Get paths
        const pathsResponse = await fetch(`${API_BASE_URL}/api/paths?floor_id=${floorId}`);
        if (!pathsResponse.ok) {
            throw new Error('Failed to fetch paths');
        }
        const paths = await pathsResponse.json();
        console.log('Raw paths from API:', paths);

        // Get boundaries
        const boundariesResponse = await fetch(`${API_BASE_URL}/api/boundaries?floor_id=${floorId}`);
        if (!boundariesResponse.ok) {
            throw new Error('Failed to fetch boundaries');
        }
        const boundaries = await boundariesResponse.json();
        console.log('Raw boundaries from API:', boundaries);

        // Combine the data in the same format as localStorage
        const combinedData = {
            objects: markers.map(marker => {
                console.log('Processing marker:', marker);
                // Handle different position formats
                let latlng;
                if (marker.position) {
                    latlng = [marker.position.lat, marker.position.lng];
                } else if (marker.latlng) {
                    latlng = marker.latlng;
                } else if (marker.coordinates) {
                    latlng = [marker.coordinates.lat, marker.coordinates.lng];
                } else {
                    console.warn('Marker has no position data:', marker);
                    return null;
                }

                return {
                    id: marker.id,
                    name: marker.name || 'Unnamed Marker',
                    description: marker.description || '',
                    latlng: latlng,
                    type: marker.type || 'default',
                    color: marker.color || '#ff0000'
                };
            }).filter(Boolean), // Remove any null markers
            routes: paths.map(path => {
                console.log('Processing path:', path);
                // Handle different point formats
                const pathPoints = path.points?.map(point => {
                    if (point.lat && point.lng) {
                        return { x: point.lng, y: point.lat };
                    } else if (point.x && point.y) {
                        return { x: point.x, y: point.y };
                    } else if (Array.isArray(point)) {
                        return { x: point[0], y: point[1] };
                    }
                    console.warn('Invalid point format:', point);
                    return null;
                }).filter(Boolean) || [];

                return {
                    id: path.id,
                    name: path.name || 'Unnamed Path',
                    description: path.description || '',
                    path: pathPoints,
                    type: path.type || 'default',
                    color: path.color || '#2196f3'
                };
            }),
            boundaries: boundaries.map(boundary => {
                console.log('Processing boundary:', boundary);
                // Handle different coordinate formats
                let coordinates;
                if (boundary.geometry?.coordinates?.[0]) {
                    coordinates = boundary.geometry.coordinates[0];
                } else if (boundary.coordinates) {
                    coordinates = boundary.coordinates;
                } else if (boundary.points) {
                    coordinates = boundary.points.map(point => {
                        if (point.lat && point.lng) {
                            return [point.lng, point.lat];
                        } else if (point.x && point.y) {
                            return [point.x, point.y];
                        } else if (Array.isArray(point)) {
                            return point;
                        }
                        return null;
                    }).filter(Boolean);
                }

                if (!coordinates || coordinates.length < 3) {
                    console.warn('Invalid boundary coordinates:', boundary);
                    return null;
                }

                return {
                    id: boundary.id,
                    name: boundary.name || 'Unnamed Boundary',
                    description: boundary.description || '',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    },
                    type: boundary.type || 'default'
                };
            }).filter(Boolean), // Remove any null boundaries
            innerBoundaries: [] // Add inner boundaries if needed
        };

        console.log('Combined data:', combinedData);
        return combinedData;
    } catch (error) {
        console.error('Error fetching floor data:', error);
        throw error;
    }
}

export const saveCompleteMap = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/floors/save-complete-map`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        console.error('Error saving complete map:', error);
        throw error;
    }
};

// Get all map data
export const getMapData = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/maps`);
        if (!response.ok) {
            throw new Error('Failed to fetch map data');
        }
        const data = await response.json();
        console.log('Received map data:', data);
        
        // Ensure data has the expected structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data structure received from server');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching map data:', error);
        throw error;
    }
};

// Save map data
export const saveMapData = async (data) => {
    try {
        // Log the request data
        console.log('Sending data to API:', {
            url: `${API_BASE_URL}/api/maps`,
            method: 'POST',
            data: data
        });

        const response = await fetch(`${API_BASE_URL}/api/maps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        // Log the raw response
        console.log('Raw API Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        const responseData = await response.json();
        console.log('Parsed API Response:', responseData);
        
        if (!response.ok) {
            console.warn('Server response not ok:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            });
            return { success: false, error: responseData.message || 'Server error' };
        }
        
        return responseData;
    } catch (error) {
        console.error('Error saving map data:', error);
        return { success: false, error: error.message };
    }
}; 