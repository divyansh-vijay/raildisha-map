import React, { useState, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    Polygon,
    CircleMarker
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaMapMarkerAlt, FaSearch, FaLocationArrow, FaCrosshairs } from 'react-icons/fa';

const MapViewer = ({ onSwitchToBuilder }) => {
    // Update the initial states
    const [floors, setFloors] = useState([{ id: 'floor_1', name: 'Floor 1' }]);
    const [floorData, setFloorData] = useState({
        floor_1: {
            objects: [],
            routes: [],
            boundaries: [],
            innerBoundaries: []
        }
    });
    const [selectedFloor, setSelectedFloor] = useState('floor_1');
    const [userPosition, setUserPosition] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [stepCount, setStepCount] = useState(0);
    const mapRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMarker, setSelectedMarker] = useState(null);

    // Update the useEffect for loading data
    useEffect(() => {
        const savedFloors = localStorage.getItem('rd_floors');
        const savedFloorData = localStorage.getItem('rd_floorData');
        if (savedFloors && savedFloorData) {
            try {
                const parsedFloors = JSON.parse(savedFloors);
                const parsedFloorData = JSON.parse(savedFloorData);
                console.log({ parsedFloors, parsedFloorData });
                if (parsedFloors.length > 0) {
                    setFloors(parsedFloors);
                    setFloorData(parsedFloorData);
                    setSelectedFloor(parsedFloors[0].id);
                }
            } catch (error) {
                console.error('Error parsing saved data:', error);
            }
        }
    }, []);

    // Get icons by type (reuse from MapBuilder)
    const getIconByType = type => {
        const iconSize = [35, 35];
        return L.divIcon({
            className: '',
            html: `
                <div style="
                    background: ${type === 'vendingMachine' ? '#d32f2f' :
                    type === 'stairs' ? '#2962ff' :
                        type === 'bench' ? '#00c853' : '#1976d2'
                };
                    color: white;
                    border-radius: 50%;
                    width: ${iconSize[0]}px;
                    height: ${iconSize[1]}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                    font-size: 18px;
                ">
                    <span>${type.charAt(0).toUpperCase()}</span>
                </div>
            `,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
        });
    };

    // Location tracking functions
    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = [position.coords.latitude, position.coords.longitude];
                setUserPosition(newPos);
                if (mapRef.current) {
                    mapRef.current.setView(newPos, 19);
                }
                setIsTracking(true);
                // Start motion tracking here
                startMotionTracking();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Error getting location. Please check permissions.');
            },
            { enableHighAccuracy: true }
        );
    };

    const startMotionTracking = () => {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        } else {
            alert('Device motion not supported');
        }
    };

    const handleMotion = (event) => {
        // Simple step detection
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
            const magnitude = Math.sqrt(
                acceleration.x ** 2 +
                acceleration.y ** 2 +
                acceleration.z ** 2
            );

            if (magnitude > 15) { // Threshold for step detection
                setStepCount(prev => prev + 1);
            }
        }
    };

    // Search function
    const handleSearch = () => {
        const searchLower = searchQuery.toLowerCase();
        const floor = floorData[selectedFloor];

        if (floor && floor.objects) {
            const found = floor.objects.find(obj =>
                obj.name?.toLowerCase().includes(searchLower) ||
                obj.type?.toLowerCase().includes(searchLower)
            );

            if (found) {
                setSelectedMarker(found);
                if (mapRef.current) {
                    mapRef.current.setView(found.latlng, 19);
                }
            }
        }
    };

    // Update the render condition check
    if (!selectedFloor || !floorData[selectedFloor]) {
        return <div>Loading map data...</div>;
    }

    return (

        <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
            {/* Top bar: Floor selector and toggle */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1100, background: '#fff', color: '#000', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>Floor:</span>
                <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)} style={{ marginRight: 8 }}>
                    {floors.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                <button
                    onClick={onSwitchToBuilder || (() => window.location.reload())}
                    style={{ padding: '4px 8px', background: '#222', color: 'white', border: 'none', borderRadius: 4 }}
                >
                    Switch to Builder
                </button>
            </div>

            {/* Search and controls overlay */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                display: 'flex',
                gap: 10,
                background: 'white',
                padding: '10px 20px',
                borderRadius: 8,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search locations..."
                    style={{
                        padding: '8px 12px',
                        borderRadius: 4,
                        border: '1px solid #ddd',
                        width: 200
                    }}
                />
                <button onClick={handleSearch} style={{ padding: '8px 12px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 4 }}>
                    <FaSearch />
                </button>
                <button onClick={startTracking} style={{ padding: '8px 12px', background: isTracking ? '#ff4444' : '#44ff44', color: 'white', border: 'none', borderRadius: 4 }}>
                    {isTracking ? <FaLocationArrow /> : <FaCrosshairs />}
                </button>
            </div>

            {/* Step counter */}
            {isTracking && (
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000,
                    background: 'white',
                    padding: '10px 20px',
                    borderRadius: 8,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    Steps: {stepCount}
                </div>
            )}

            {/* Map */}
            <MapContainer
                center={[26.4494, 80.1935]}
                zoom={18}
                maxZoom={30}
                style={{ height: '100vh', width: '100vw' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                {/* Render markers */}
                {floorData[selectedFloor]?.objects?.map((obj, i) => (
                    <Marker
                        key={i}
                        position={obj.latlng}
                        icon={getIconByType(obj.type)}
                    >
                        <Popup>
                            <div>
                                <h3>{obj.name || obj.type}</h3>
                                <p>Type: {obj.type}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Boundaries */}
                {floorData[selectedFloor]?.boundaries?.map((b, i) => (
                    <Polygon
                        key={i}
                        positions={b.geometry.coordinates[0].map(c => [c[1], c[0]])}
                        pathOptions={{
                            color: '#1a237e',
                            fillColor: '#3949ab',
                            fillOpacity: 0.4,
                            weight: 4,
                            opacity: 0.9
                        }}
                    />
                ))}

                {/* Inner Boundaries */}
                {floorData[selectedFloor]?.innerBoundaries?.map((b, i) => (
                    <Polygon
                        key={`inner-${i}`}
                        positions={b.geometry.coordinates[0].map(c => [c[1], c[0]])}
                        pathOptions={{
                            color: '#d32f2f',
                            fillColor: '#ef5350',
                            fillOpacity: 0.5,
                            weight: 4,
                            dashArray: '8, 8',
                            opacity: 0.9
                        }}
                    />
                ))}

                {/* Routes */}
                {floorData[selectedFloor]?.routes?.map((route, i) => (
                    <React.Fragment key={i}>
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
                            color={'#fcd89a'}
                            weight={6}
                            opacity={1}
                            smoothFactor={1}
                            lineCap="round"
                            lineJoin="round"
                        />
                        {/* Animated arrows */}
                        <Polyline
                            positions={route.path.map(p => [p.y, p.x])}
                            color={'#FFFFFF'}
                            weight={2}
                            opacity={0.8}
                            dashArray="12, 24"
                            lineCap="round"
                            lineJoin="round"
                        />
                    </React.Fragment>
                ))}

                {/* User position */}
                {userPosition && (
                    <CircleMarker
                        center={userPosition}
                        radius={8}
                        color="#4285F4"
                        fillColor="#4285F4"
                        fillOpacity={0.7}
                    >
                        <Popup>You are here</Popup>
                    </CircleMarker>
                )}
            </MapContainer>
        </div>
    );
};

export default MapViewer;