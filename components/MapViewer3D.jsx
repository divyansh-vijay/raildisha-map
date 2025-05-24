import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FaMarker, FaStairs, FaStore, FaElevator, FaDoorOpen, FaInfoCircle } from 'react-icons/fa';
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
const getIconPath = (Icon) => {
    const icon = new Icon();
    return icon.icon[4];
};

// Main component
const MapViewer3D = ({ floorData, selectedFloor }) => {
    const mapRef = useRef(null);

    // Early return if no data
    if (!floorData || !selectedFloor || !floorData[selectedFloor]) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7fa' }}>
                <div style={{ fontSize: 22, color: '#888', marginBottom: 24 }}>No map data available</div>
                <button
                    onClick={() => window.location.href = '/builder'}
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
                onClick={() => window.location.href = '/builder'}
                >
                    Return to Builder
                </div>
            </MapContainer>
        </div>
    );
};

export default MapViewer3D; 