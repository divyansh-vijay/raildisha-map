import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polygon, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FaMarker, FaStore, FaDoorOpen, FaInfoCircle, FaRoute } from 'react-icons/fa';
import { FaElevator, FaStairs } from 'react-icons/fa6';
import { FaUtensils } from 'react-icons/fa';
import { getMapData } from '../src/services/api';

// Constants
const MARKER_TYPES = {
    vendingMachine: { icon: FaUtensils, color: '#f44336', label: 'Vending Machine' },
    stairs: { icon: FaStairs, color: '#9c27b0', label: 'Stairs' },
    bench: { icon: FaStore, color: '#4caf50', label: 'Bench' },
    elevator: { icon: FaElevator, color: '#2196f3', label: 'Elevator' },
    entrance: { icon: FaDoorOpen, color: '#ff9800', label: 'Entrance' },
    information: { icon: FaInfoCircle, color: '#00bcd4', label: 'Information' }
};

const PATH_COLORS = {
    primary: '#1976d2',
    secondary: '#64b5f6',
    highlight: '#e91e63',
    highlightSecondary: '#f48fb1',
    arrows: '#FFFFFF'
};

// Helper function to get icon path
const getIconPath = (IconComponent) => {
    const paths = {
        // POI icons
        FaUtensils: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
        FaShoppingBag: "M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 4c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2zm2-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm4 6c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2z",
        FaBuilding: "M17 11V3H7v4H3v14h18V11H17zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 8H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z",
        FaParking: "M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z",
        FaInfoCircle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
        // Custom marker icons
        FaUser: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
        FaStore: "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",
        FaCoffee: "M2 21h18v-2H2v2zm6-4h12v-2H8v2zm-6-4h16v-2H2v2zm22-4v2c0 1.1-.9 2-2 2H2v-2c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-2-6H4v2h16V7z",
        FaBook: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
        FaFirstAid: "M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
        FaWheelchair: "M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z",
        FaArrowUp: "M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z",
        FaDoorOpen: "M12 3c-4.97 0-9 4.03-9 9h2c0-3.87 3.13-7 7-7s7 3.13 7 7h2c0-4.97-4.03-9-9-9zm0 14c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z",
        FaMarker: "M17.5 4.5c-1.484 0-2.5 1.016-2.5 2.5s1.016 2.5 2.5 2.5 2.5-1.016 2.5-2.5-1.016-2.5-2.5-2.5zm-3.5 2.5c0-1.484 1.016-2.5 2.5-2.5s2.5 1.016 2.5 2.5-1.016 2.5-2.5 2.5-2.5-1.016-2.5-2.5z",
        // Add stairs icon
        FaStairs: "M3 5v14h18V5H3zm16 12H5V7h14v10zM7 9h2v2H7V9zm0 4h2v2H7v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z",
        // Add vending machine icon
        FaVendingMachine: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 8h2v2H6V8zm0 4h2v2H6v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2z"
    };
    return paths[IconComponent.name] || paths.FaMarker;
};

// Main component
export default function MapViewer2D() {
    const mapRef = useRef(null);
    const navigate = useNavigate();
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [floorData, setFloorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [routeMode, setRouteMode] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [fromMarker, setFromMarker] = useState(null);
    const [toMarker, setToMarker] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                let data;
                
                // First try to load from API/database
                console.log('Fetching data from API...');
                try {
                    const apiResponse = await getMapData();
                    console.log('API response:', apiResponse);
                    
                    // Transform the API response into the expected format
                    data = {
                        floors: [{
                            id: `floor_${apiResponse.level}`,
                            name: apiResponse.name || `Floor ${apiResponse.level}`,
                            level: apiResponse.level
                        }],
                        floorData: {
                            [`floor_${apiResponse.level}`]: {
                                objects: apiResponse.map_data.objects || [],
                                routes: apiResponse.map_data.routes || [],
                                boundaries: apiResponse.map_data.boundaries || [],
                                innerBoundaries: apiResponse.map_data.innerBoundaries || []
                            }
                        },
                        selectedFloor: `floor_${apiResponse.level}`
                    };
                    
                    console.log('Transformed data:', data);
                    
                    // Save to localStorage for future use
                    if (data && data.floors && data.floorData) {
                        console.log('Saving data to localStorage...');
                        localStorage.setItem('rd_map_data', JSON.stringify(data));
                        console.log('Data saved to localStorage successfully');
                    }
                } catch (apiError) {
                    console.error('Error fetching from API:', apiError);
                    
                    // If API fails, try loading from localStorage
                    console.log('Falling back to localStorage...');
                    const savedData = localStorage.getItem('rd_map_data');
                    if (savedData) {
                        try {
                            data = JSON.parse(savedData);
                            console.log('Successfully loaded from localStorage:', {
                                hasFloors: !!data?.floors,
                                floorsCount: data?.floors?.length,
                                hasFloorData: !!data?.floorData,
                                floorDataKeys: data?.floorData ? Object.keys(data.floorData) : []
                            });
                        } catch (e) {
                            console.error('Error parsing localStorage data:', e);
                            localStorage.removeItem('rd_map_data');
                        }
                    }
                }
                
                if (!data || !data.floors || !data.floorData) {
                    console.error('Invalid data structure received:', data);
                    setError('Invalid data structure received from server');
                    return;
                }

                // Ensure floors are properly formatted
                const formattedFloors = data.floors.map(floor => ({
                    id: floor.id || `floor_${floor.level}`,
                    name: floor.name || `Floor ${floor.level}`,
                    level: floor.level
                }));

                console.log('Formatted floors:', formattedFloors);

                setFloors(formattedFloors);
                setFloorData(data.floorData);
                
                // Set initial selected floor
                if (data.selectedFloor) {
                    console.log('Setting selected floor from data:', data.selectedFloor);
                    setSelectedFloor(data.selectedFloor);
                } else if (formattedFloors.length > 0) {
                    console.log('Setting first floor as selected:', formattedFloors[0].id);
                    setSelectedFloor(formattedFloors[0].id);
                } else {
                    console.error('No floors available to select');
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load map data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return <div>Loading map data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!floorData || !selectedFloor || !floorData[selectedFloor]) {
        return <div>No map data available</div>;
    }

    const currentFloorData = floorData[selectedFloor];

    const handleMarkerClick = (marker) => {
        console.log('Marker clicked:', marker);
        if (routeMode === 'from') {
            setFromMarker(marker);
            setRouteMode('to');
        } else if (routeMode === 'to') {
            setToMarker(marker);
            findRoute();
        }
    };

    const findRoute = () => {
        if (!fromMarker || !toMarker) return;

        console.log('Finding route between:', {
            from: fromMarker,
            to: toMarker,
            availableRoutes: currentFloorData.routes
        });

        // Find routes that connect the markers based on their IDs
        const routes = currentFloorData.routes.filter(route => {
            console.log('Checking route:', {
                routeId: route.id,
                routeFrom: route.from,
                routeTo: route.to,
                fromMarkerId: fromMarker.id,
                toMarkerId: toMarker.id
            });

            // Check if route connects the markers by ID
            const connectsMarkers = (
                (route.from === fromMarker.id && route.to === toMarker.id) ||
                (route.from === toMarker.id && route.to === fromMarker.id)
            );

            console.log('Route match result:', {
                routeId: route.id,
                connectsMarkers
            });

            return connectsMarkers;
        });

        console.log('Found matching routes:', routes);

        if (routes.length > 0) {
            setSelectedRoute(routes[0]);
            console.log('Selected route:', routes[0]);
        } else {
            console.log('No route found between markers');
            alert(`No direct route found between these points.
From: ${fromMarker.name || 'Point ' + fromMarker.id}
To: ${toMarker.name || 'Point ' + toMarker.id}

Total available routes: ${currentFloorData.routes.length}`);
        }

        // Reset route mode
        setRouteMode(null);
    };

    // Update route rendering to use points array
    const renderRoute = (route) => {
        if (!route.path || !Array.isArray(route.path)) return null;

        // Convert points to [lat, lng] format
        const positions = route.path.map(point => [point.y, point.x]);

        return (
            <React.Fragment key={route.id}>
                {/* Outer glow effect */}
                <Polyline
                    positions={positions}
                    color={PATH_COLORS.highlightSecondary}
                    weight={12}
                    opacity={0.3}
                    lineCap="round"
                    lineJoin="round"
                />
                {/* Path casing (outer white border) */}
                <Polyline
                    positions={positions}
                    color={PATH_COLORS.arrows}
                    weight={8}
                    opacity={1}
                    lineCap="round"
                    lineJoin="round"
                />
                {/* Main path */}
                <Polyline
                    positions={positions}
                    color={PATH_COLORS.highlight}
                    weight={6}
                    opacity={1}
                    smoothFactor={1}
                    lineCap="round"
                    lineJoin="round"
                />
                {/* Animated arrows */}
                <Polyline
                    positions={positions}
                    color={PATH_COLORS.arrows}
                    weight={2}
                    opacity={0.8}
                    dashArray="12, 24"
                    lineCap="round"
                    lineJoin="round"
                />
            </React.Fragment>
        );
    };

    const startRouteSelection = () => {
        setRouteMode('from');
        setFromMarker(null);
        setToMarker(null);
        setSelectedRoute(null);
    };

    const cancelRouteSelection = () => {
        setRouteMode(null);
        setFromMarker(null);
        setToMarker(null);
        setSelectedRoute(null);
    };

    const handleFloorChange = (floorId) => {
        console.log('Changing floor to:', floorId);
        setSelectedFloor(floorId);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f7f7fa',
            overflow: 'hidden'
        }}>
            {/* Floor selector */}
            <div style={{
                position: 'absolute',
                bottom: 100,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '6px 12px',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                <select
                    value={selectedFloor}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'transparent',
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        paddingRight: 24
                    }}
                >
                    {floors.map(floor => (
                        <option key={floor.id} value={floor.id}>
                            {`Floor ${floor.level}`}
                        </option>
                    ))}
                </select>
                <div style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#666'
                }}>
                    ▼
                </div>
            </div>

            <MapContainer
                center={[26.4494, 80.1935]}
                zoom={18}
                maxZoom={30}
                zoomControl={false}
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }}
                ref={mapRef}
                whenReady={() => {
                    // Ensure map is properly initialized
                    if (mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={20}
                    maxNativeZoom={19}
                    attribution="&copy; OSM contributors"
                />

                {/* Custom Zoom Controls */}
                <div style={{
                    position: 'absolute',
                    bottom: 100,
                    right: 20,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px',
                    borderRadius: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <button
                        onClick={() => mapRef.current?.zoomIn()}
                        style={{
                            width: 32,
                            height: 32,
                            border: 'none',
                            background: 'transparent',
                            color: '#333',
                            fontSize: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        +
                    </button>
                    <button
                        onClick={() => mapRef.current?.zoomOut()}
                        style={{
                            width: 32,
                            height: 32,
                            border: 'none',
                            background: 'transparent',
                            color: '#333',
                            fontSize: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        −
                    </button>
                </div>

                {/* Render markers with click handler */}
                {currentFloorData.objects.map((obj) => {
                    console.log('Processing object:', obj);
                    // Check if latlng exists and is valid
                    const latlng = obj.latlng || obj.position || obj.coordinates;
                    if (!latlng) {
                        console.log('No coordinates found for object:', obj);
                        return null;
                    }

                    // Convert to [lat, lng] format if needed
                    let finalLatlng;
                    if (Array.isArray(latlng)) {
                        finalLatlng = latlng.length === 2 ? latlng : null;
                    } else if (typeof latlng === 'object' && latlng !== null) {
                        // Handle {lat, lng} or {x, y} format
                        if ('lat' in latlng && 'lng' in latlng) {
                            finalLatlng = [latlng.lat, latlng.lng];
                        } else if ('x' in latlng && 'y' in latlng) {
                            finalLatlng = [latlng.y, latlng.x]; // Convert x,y to lat,lng
                        }
                    }

                    if (!finalLatlng) {
                        console.log('Invalid coordinates format:', latlng);
                        return null;
                    }

                    // Log valid coordinates
                    console.log('Valid marker coordinates:', {
                        id: obj.id,
                        latlng: finalLatlng,
                        type: obj.type
                    });

                    return (
                        <Marker
                            key={obj.id}
                            position={finalLatlng}
                            icon={L.divIcon({
                                className: '',
                                html: `<div style="
                                    background: ${routeMode && (
                                        (routeMode === 'from' && fromMarker?.id === obj.id) ||
                                        (routeMode === 'to' && toMarker?.id === obj.id)
                                    ) ? '#e91e63' : MARKER_TYPES[obj.type]?.color || '#2196f3'};
                                    color: white;
                                    border-radius: 50%;
                                    width: 32px;
                                    height: 32px;
                                    transform: translate(-16px, -16px);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border: 2px solid white;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                ">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                        <path d="${getIconPath(MARKER_TYPES[obj.type]?.icon || FaMarker)}"/>
                                    </svg>
                                </div>`
                            })}
                            eventHandlers={{
                                click: () => handleMarkerClick(obj)
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 200 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                                        {obj.name || obj.type || 'Unnamed Marker'}
                                    </div>
                                    {obj.type && (
                                        <div style={{ marginBottom: 8 }}>
                                            <label>Type: </label>
                                            <span>{MARKER_TYPES[obj.type]?.label || obj.type}</span>
                                        </div>
                                    )}
                                    {obj.description && (
                                        <div style={{ marginBottom: 8 }}>
                                            <label>Description: </label>
                                            <span>{obj.description}</span>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Render boundaries */}
                {currentFloorData.boundaries.map((boundary) => {
                    console.log('Processing boundary:', boundary);

                    // Handle different boundary data structures
                    let coordinates;
                    if (boundary.geometry?.coordinates?.[0]) {
                        coordinates = boundary.geometry.coordinates[0];
                    } else if (boundary.coordinates) {
                        coordinates = boundary.coordinates;
                    } else if (boundary.points) {
                        coordinates = boundary.points;
                    }

                    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
                        console.log('Invalid boundary coordinates:', boundary);
                        return null;
                    }

                    // Convert coordinates to [lat, lng] format
                    const positions = coordinates.map(coord => {
                        if (Array.isArray(coord)) {
                            return coord.length === 2 ? [coord[1], coord[0]] : null;
                        } else if (typeof coord === 'object' && coord !== null) {
                            if ('lat' in coord && 'lng' in coord) {
                                return [coord.lat, coord.lng];
                            } else if ('x' in coord && 'y' in coord) {
                                return [coord.y, coord.x];
                            }
                        }
                        return null;
                    }).filter(Boolean);

                    if (positions.length < 3) {
                        console.log('Not enough valid points for boundary:', boundary);
                        return null;
                    }

                    return (
                        <Polygon
                            key={boundary.id}
                            positions={positions}
                            pathOptions={{
                                color: '#607d8b',
                                fillColor: '#b0bec5',
                                fillOpacity: 0.2,
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 200 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                                        {boundary.name || 'Boundary'}
                                    </div>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Render inner boundaries */}
                {currentFloorData.innerBoundaries?.map((boundary) => {
                    console.log('Processing inner boundary:', boundary);

                    // Handle different boundary data structures
                    let coordinates;
                    if (boundary.geometry?.coordinates?.[0]) {
                        coordinates = boundary.geometry.coordinates[0];
                    } else if (boundary.coordinates) {
                        coordinates = boundary.coordinates;
                    } else if (boundary.points) {
                        coordinates = boundary.points;
                    }

                    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
                        console.log('Invalid inner boundary coordinates:', boundary);
                        return null;
                    }

                    // Convert coordinates to [lat, lng] format
                    const positions = coordinates.map(coord => {
                        if (Array.isArray(coord)) {
                            return coord.length === 2 ? [coord[1], coord[0]] : null;
                        } else if (typeof coord === 'object' && coord !== null) {
                            if ('lat' in coord && 'lng' in coord) {
                                return [coord.lat, coord.lng];
                            } else if ('x' in coord && 'y' in coord) {
                                return [coord.y, coord.x];
                            }
                        }
                        return null;
                    }).filter(Boolean);

                    if (positions.length < 3) {
                        console.log('Not enough valid points for inner boundary:', boundary);
                        return null;
                    }

                    return (
                        <Polygon
                            key={boundary.id}
                            positions={positions}
                            pathOptions={{
                                color: '#ff7043',
                                fillColor: '#ffccbc',
                                fillOpacity: 0.3,
                                weight: 2,
                                dashArray: '5, 5'
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 200 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                                        {boundary.name || 'Inner Boundary'}
                                    </div>
                                    {boundary.properties?.description && (
                                        <div style={{ marginBottom: 8 }}>
                                            <label>Description: </label>
                                            <span>{boundary.properties.description}</span>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Render routes */}
                {currentFloorData.routes.map((route) => {
                    // Only show the selected route
                    if (!selectedRoute || route.id !== selectedRoute.id) return null;

                    // Validate route path points
                    if (!route.path || !Array.isArray(route.path)) return null;

                    const validPath = route.path.filter(point =>
                        point &&
                        typeof point.x === 'number' &&
                        typeof point.y === 'number' &&
                        !isNaN(point.x) &&
                        !isNaN(point.y)
                    );

                    if (validPath.length === 0) return null;

                    return renderRoute(route);
                })}

                {/* Control buttons */}
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    zIndex: 1000,
                    display: 'flex',
                    gap: 8
                }}>
                    {/* Return to builder button */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        backdropFilter: 'blur(8px)',
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 500
                    }}
                        onClick={() => navigate('/builder')}
                    >
                        Return to Builder
                    </div>

                    {/* Route button */}
                    <div style={{
                        background: routeMode ? PATH_COLORS.highlight : 'rgba(255, 255, 255, 0.9)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: routeMode ? 'white' : '#333',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(8px)'
                    }}
                        onClick={routeMode ? cancelRouteSelection : startRouteSelection}
                    >
                        <FaRoute />
                        {routeMode ? (
                            <span>
                                {routeMode === 'from' ? 'Select Start Point' : 'Select End Point'}
                            </span>
                        ) : (
                            <span>Find Route</span>
                        )}
                    </div>

                    {/* Clear route button - only show when a route is selected */}
                    {selectedRoute && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            padding: '8px 16px',
                            borderRadius: 20,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            backdropFilter: 'blur(8px)',
                            color: '#333',
                            fontSize: 14,
                            fontWeight: 500
                        }}
                            onClick={cancelRouteSelection}
                        >
                            Clear Route
                        </div>
                    )}
                </div>

                {/* Route info popup - only show when a route is selected */}
                {selectedRoute && (
                    <div style={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        backdropFilter: 'blur(8px)',
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 500
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: PATH_COLORS.highlight,
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                            <span>Selected Route</span>
                        </div>
                        <div style={{ color: '#666' }}>
                            {fromMarker?.name || 'Start'}
                            →
                            {toMarker?.name || 'End'}
                        </div>
                    </div>
                )}
            </MapContainer>
        </div>
    );
};
 