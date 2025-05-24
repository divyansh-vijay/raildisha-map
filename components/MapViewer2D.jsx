import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polygon, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FaMarker, FaStore, FaDoorOpen, FaInfoCircle } from 'react-icons/fa';
import { FaElevator, FaStairs } from 'react-icons/fa6';
import { FaUtensils } from 'react-icons/fa';

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
    arrows: '#64b5f6'
};

// Helper function to get icon path
const getIconPath = (IconComponent) => {
    const paths = {
        // POI icons
        FaUtensils: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
        FaShoppingBag: "M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 4c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2zm2-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm4 6c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2z",
        FaBuilding: "M17 11V3H7v4H3v14h18V11H17zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 8H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z",
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
const MapViewer2D = () => {
    const mapRef = useRef(null);
    const navigate = useNavigate();
    const [floorData, setFloorData] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from localStorage when component mounts
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('rd_map_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.floorData && parsedData.selectedFloor) {
                    setFloorData(parsedData.floorData);
                    setSelectedFloor(parsedData.selectedFloor);
                }
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Early return for loading state
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7fa' }}>
                <div style={{ fontSize: 22, color: '#888', marginBottom: 24 }}>Loading map data...</div>
            </div>
        );
    }

    // Early return if no data
    if (!floorData || !selectedFloor || !floorData[selectedFloor]) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7fa' }}>
                <div style={{ fontSize: 22, color: '#888', marginBottom: 24 }}>No map data available</div>
                <button
                    onClick={() => navigate('/builder')}
                    style={{ background: '#4285F4', color: 'white', border: 'none', borderRadius: 4, padding: '12px 24px', fontWeight: 500, fontSize: 16 }}
                >
                    Return to Builder
                </button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
            <MapContainer
                center={[26.4494, 80.1935]}
                zoom={18}
                maxZoom={30}
                style={{ height: '100vh', width: '100vw' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={20}
                    maxNativeZoom={19}
                    attribution="&copy; OSM contributors"
                />

                {/* Render markers */}
                {floorData[selectedFloor]?.objects?.map(obj => (
                    <Marker
                        key={obj.id}
                        position={obj.latlng}
                        icon={L.divIcon({
                            className: '',
                            html: `<div style="
                                background: ${MARKER_TYPES[obj.type]?.color || '#2196f3'};
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
                ))}

                {/* Render boundaries */}
                {floorData[selectedFloor]?.boundaries?.map((boundary) => (
                    <Polygon
                        key={boundary.id}
                        positions={boundary.geometry.coordinates[0].map(c => [c[1], c[0]])}
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
                                    {boundary.properties?.name || 'Boundary'}
                                </div>
                            </div>
                        </Popup>
                    </Polygon>
                ))}

                {/* Render inner boundaries */}
                {floorData[selectedFloor]?.innerBoundaries?.map((boundary) => (
                    <Polygon
                        key={boundary.id}
                        positions={boundary.geometry.coordinates[0].map(c => [c[1], c[0]])}
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
                                    {boundary.properties?.name || 'Inner Boundary'}
                                </div>
                                {boundary.properties?.category && (
                                    <div style={{ marginBottom: 8 }}>
                                        <label>Category: </label>
                                        <span>{boundary.properties.category}</span>
                                    </div>
                                )}
                                {boundary.properties?.description && (
                                    <div style={{ marginBottom: 8 }}>
                                        <label>Description: </label>
                                        <span>{boundary.properties.description}</span>
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Polygon>
                ))}

                {/* Render routes */}
                {floorData[selectedFloor]?.routes?.map((route) => (
                    <React.Fragment key={route.id}>
                        {/* Path casing (outer white border) */}
                        <Polyline
                            positions={route.path.map(p => [p.y, p.x])}
                            color="#FFFFFF"
                            weight={8}
                            opacity={1}
                            lineCap="round"
                            lineJoin="round"
                        />
                        {/* Main path */}
                        <Polyline
                            positions={route.path.map(p => [p.y, p.x])}
                            color={PATH_COLORS.primary}
                            weight={6}
                            opacity={1}
                            smoothFactor={1}
                            lineCap="round"
                            lineJoin="round"
                        />
                        {/* Animated arrows */}
                        <Polyline
                            positions={route.path.map(p => [p.y, p.x])}
                            color={PATH_COLORS.arrows}
                            weight={2}
                            opacity={0.8}
                            dashArray="12, 24"
                            lineCap="round"
                            lineJoin="round"
                        />
                    </React.Fragment>
                ))}

                {/* Return to builder button */}
                <div style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    zIndex: 1000,
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: 4,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                }}
                    onClick={() => navigate('/builder')}
                >
                    Return to Builder
                </div>
            </MapContainer>
        </div>
    );
};

export default MapViewer2D; 