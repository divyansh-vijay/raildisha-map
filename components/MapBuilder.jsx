import React, { useState, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    FeatureGroup,
    useMapEvents,
    Marker,
    Popup,
    Polyline,
    Polygon,
    CircleMarker
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
// Add these constants at the top with other constants
const PATH_COLORS = {
    primary: '#fcd89a',    // Google Maps blue
    secondary: '#fcd89a',  // Lighter blue for casing
    arrows: '#FFFFFF'      // White arrows
};

// Add these constants at the top
const STEP_CONFIG = {
    threshold: 10,       // Minimum acceleration change to count as step
    cooldown: 250,       // Minimum time between steps (ms)
    lowPassAlpha: 0.1    // Low-pass filter coefficient (0-1)
};

// === ICONS ===
const vendingMachineIcon = new L.DivIcon({
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="red" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><rect width="2" height="8" x="11" y="4"/><rect width="2" height="2" x="11" y="14"/><rect width="2" height="2" x="11" y="17"/></svg>',
    className: '', iconSize: [24, 24], iconAnchor: [12, 24]
});
const stairsIcon = new L.DivIcon({
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="blue" viewBox="0 0 24 24"><path d="M4 20h16v-2H6v-2h4v-2h4v-2h4v-2H10v2H6v2H4v6z"/></svg>',
    className: '', iconSize: [24, 24], iconAnchor: [12, 24]
});
const benchIcon = new L.DivIcon({
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="green" viewBox="0 0 24 24"><path d="M4 10h16v2H4v-2zm0 4h16v2H4v-2zm1 4h2v2H5v-2zm12 0h2v2h-2v-2z"/></svg>',
    className: '', iconSize: [24, 24], iconAnchor: [12, 24]
});
const getIconByType = type => {
    switch (type) {
        case "vendingMachine": return vendingMachineIcon;
        case "stairs": return stairsIcon;
        case "bench": return benchIcon;
        default: return null;
    }
};
// Add these constants for dead reckoning and Kalman filter
const DR_CONFIG = {
    stepLength: 0.7, // meters
    headingOffset: 0, // calibration offset
    stepThreshold: 1.0, // acceleration threshold for step detection
    timeThreshold: 250 // minimum time between steps (ms)
};

// Add these helper functions at the top level
const MERGE_THRESHOLD = 0.0001;
const OBJECT_BUFFER = 0.0002; // Buffer zone around objects where paths won't merge

// Add this helper function to check if a point is near any object
const isNearObject = (point, objects, buffer = OBJECT_BUFFER) => {
    return objects.some(obj => {
        const [lat, lng] = obj.latlng;
        const distance = Math.sqrt(
            Math.pow(point.x - lng, 2) +
            Math.pow(point.y - lat, 2)
        );
        return distance < buffer;
    });
};

const findNearbyPoints = (point, allRoutes, objects, threshold = MERGE_THRESHOLD) => {
    // Don't merge if point is near an object
    if (isNearObject(point, objects)) {
        return [];
    }

    const nearby = [];

    allRoutes.forEach(route => {
        route.path.forEach(pathPoint => {
            // Skip points that are near objects
            if (isNearObject(pathPoint, objects)) {
                return;
            }

            const distance = Math.sqrt(
                Math.pow(point.x - pathPoint.x, 2) +
                Math.pow(point.y - pathPoint.y, 2)
            );

            if (distance < threshold && distance > 0) {
                nearby.push(pathPoint);
            }
        });
    });

    return nearby;
};

const getMergedPath = (route, allRoutes, objects) => {
    const mergedPath = [];

    route.path.forEach((point, index) => {
        const nearbyPoints = findNearbyPoints(point, allRoutes, objects);

        if (nearbyPoints.length > 0) {
            const avgX = (point.x + nearbyPoints.reduce((sum, p) => sum + p.x, 0)) / (nearbyPoints.length + 1);
            const avgY = (point.y + nearbyPoints.reduce((sum, p) => sum + p.y, 0)) / (nearbyPoints.length + 1);

            mergedPath.push({
                x: avgX,
                y: avgY,
                merged: true,
                count: nearbyPoints.length + 1
            });
        } else {
            mergedPath.push({
                ...point,
                merged: false,
                count: 1
            });
        }
    });

    return mergedPath;
};

// Handle marker placement clicks
const ClickHandler = ({ addLatLng, selectedType, isAddingPath }) => {
    useMapEvents({
        click: e => {
            if (!isAddingPath && selectedType) addLatLng([e.latlng.lat, e.latlng.lng], selectedType);
        }
    });
    return null;
};

// Track zoom changes
const ZoomHandler = ({ setZoom }) => {
    useMapEvents({ zoomend: e => setZoom(e.target.getZoom()) });
    return null;
};

const MapBuilder = () => {
    // State
    const [objects, setObjects] = useState([
        {
            "id": "vendingMachine_1",
            "latlng": [
                26.45014692079585,
                80.19301503896715
            ],
            "type": "vendingMachine"
        },
        {
            "id": "stairs_2",
            "latlng": [
                26.450071232242305,
                80.19295737147331
            ],
            "type": "stairs"
        },
        {
            "id": "bench_3",
            "latlng": [
                26.44988020852889,
                80.19285544753076
            ],
            "type": "bench"
        },
        {
            "id": "bench_4",
            "latlng": [
                26.449830950790382,
                80.19290506839754
            ],
            "type": "bench"
        },
        {
            "id": "bench_5",
            "latlng": [
                26.450119288472514,
                80.19316121935846
            ],
            "type": "bench"
        },
        {
            "id": "bench_6",
            "latlng": [
                26.45008444770761,
                80.19319608807564
            ],
            "type": "bench"
        }
    ]);
    const [routes, setRoutes] = useState([
        {
            "from": "vendingMachine_1",
            "to": "bench_3",
            "type": "corridor",
            "weight": 2,
            "path": [
                {
                    "x": 80.19301503896715,
                    "y": 26.450158860237014
                },
                {
                    "x": 80.19285544753076,
                    "y": 26.449895752221284
                }
            ]
        },
        {
            "from": "bench_3",
            "to": "bench_6",
            "type": "corridor",
            "weight": 2,
            "path": [
                {
                    "x": 80.19285812973978,
                    "y": 26.4498868402302
                },
                {
                    "x": 80.19319407641889,
                    "y": 26.450090478694275
                }
            ]
        },
        {
            "from": "bench_3",
            "to": "bench_4",
            "type": "corridor",
            "weight": 2,
            "path": [
                {
                    "x": 80.19285544753076,
                    "y": 26.44988020852889
                },
                {
                    "x": 80.19290506839754,
                    "y": 26.449830950790382
                }
            ]
        },
        {
            "from": "bench_5",
            "to": "bench_4",
            "type": "corridor",
            "weight": 6,
            "path": [
                {
                    "x": 80.19316121935846,
                    "y": 26.450119288472514
                },
                {
                    "x": 80.19301486768379,
                    "y": 26.45015295691295
                },
                {
                    "x": 80.19293443630978,
                    "y": 26.450095890154028
                },
                {
                    "x": 80.19283054578501,
                    "y": 26.45002500719302
                },
                {
                    "x": 80.19280306506559,
                    "y": 26.44995172137389
                },
                {
                    "x": 80.19290506839754,
                    "y": 26.449830950790382
                }
            ]
        }
    ]);
    const [boundaries, setBoundaries] = useState([
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            80.192927,
                            26.449739
                        ],
                        [
                            80.192717,
                            26.449994
                        ],
                        [
                            80.19305,
                            26.450253
                        ],
                        [
                            80.193281,
                            26.450046
                        ],
                        [
                            80.192927,
                            26.449739
                        ]
                    ]
                ]
            }
        }
    ]);
    const [mapType, setMapType] = useState("normal");
    const [selectedType, setSelectedType] = useState(null);
    const [isAddingPath, setIsAddingPath] = useState(false);
    const [fromNode, setFromNode] = useState("");
    const [toNode, setToNode] = useState("");
    const [isAddingBoundary, setIsAddingBoundary] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(18);
    const [userPosition, setUserPosition] = useState(null);
    const [userPath, setUserPath] = useState([]);
    const [isTracking, setIsTracking] = useState(false);
    const [watchId, setWatchId] = useState(null);
    const [deadReckoning, setDeadReckoning] = useState(null);
    const hasInitialPosition = useRef(false);
    const mapRef = React.useRef(null);
    // Add these state declarations after other state variables
    const [stepCount, setStepCount] = useState(0);
    const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
    const [isInitialPositionSet, setIsInitialPositionSet] = useState(false);
    const lastStepTime = useRef(0);
    const filteredAccel = useRef({ x: 0, y: 0, z: 0 });
    // Load from localStorage
    // useEffect(() => {
    //     const savedObjs = localStorage.getItem('rd_objects');
    //     const savedRts = localStorage.getItem('rd_routes');
    //     const savedBnds = localStorage.getItem('rd_boundaries');
    //     if (savedObjs) setObjects(JSON.parse(savedObjs));
    //     if (savedRts) setRoutes(JSON.parse(savedRts));
    //     if (savedBnds) setBoundaries(JSON.parse(savedBnds));
    // }, []);

    useEffect(() => {
        console.log(objects, routes, boundaries);
    }, [objects, routes, boundaries]);

    // Save to localStorage
    // useEffect(() => localStorage.setItem('rd_objects', JSON.stringify(objects)), [objects]);
    // useEffect(() => localStorage.setItem('rd_routes', JSON.stringify(routes)), [routes]);
    // useEffect(() => localStorage.setItem('rd_boundaries', JSON.stringify(boundaries)), [boundaries]);

    // Add new facility marker
    const addLatLng = (latlng, type) => {
        const newId = `${type}_${objects.length + 1}`;
        const newObj = { id: newId, latlng, type };
        setObjects(prev => [...prev, newObj]);
    };
    const recenterPosition = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = [position.coords.latitude, position.coords.longitude];
                setUserPosition(newPos);

                if (mapRef.current) {
                    mapRef.current.setView(newPos, 19);
                }

                // Update dead reckoning initial position
                if (deadReckoning) {
                    deadReckoning.updatePosition(newPos[0], newPos[1]);
                }

                setIsInitialPositionSet(true);
            },
            (error) => {
                console.error('Error getting position:', error);
                alert('Error getting location. Please check permissions.');
            },
            { enableHighAccuracy: true }
        );
    };
    const handleMotion = (event) => {
        if (!deadReckoning || !isInitialPositionSet) return;

        const now = Date.now();
        const acceleration = {
            x: event.accelerationIncludingGravity.x,
            y: event.accelerationIncludingGravity.y,
            z: event.accelerationIncludingGravity.z
        };

        // Apply low-pass filter to smooth acceleration data
        filteredAccel.current = {
            x: filteredAccel.current.x + STEP_CONFIG.lowPassAlpha * (acceleration.x - filteredAccel.current.x),
            y: filteredAccel.current.y + STEP_CONFIG.lowPassAlpha * (acceleration.y - filteredAccel.current.y),
            z: filteredAccel.current.z + STEP_CONFIG.lowPassAlpha * (acceleration.z - filteredAccel.current.z)
        };

        // Calculate acceleration magnitude
        const accelMagnitude = Math.sqrt(
            filteredAccel.current.x ** 2 +
            filteredAccel.current.y ** 2 +
            filteredAccel.current.z ** 2
        );

        const lastAccelMagnitude = Math.sqrt(
            lastAcceleration.x ** 2 +
            lastAcceleration.y ** 2 +
            lastAcceleration.z ** 2
        );

        // Detect step using peak detection with cooldown
        const magnitudeDelta = Math.abs(accelMagnitude - lastAccelMagnitude);
        if (magnitudeDelta > STEP_CONFIG.threshold && 
            (now - lastStepTime.current) > STEP_CONFIG.cooldown) {
            setStepCount(prev => prev + 1);
            lastStepTime.current = now;
            console.log('Step detected:', magnitudeDelta); // Debug log
        }

        setLastAcceleration(filteredAccel.current);

        const orientation = {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0
        };

        if (deadReckoning.processMotion(acceleration, orientation)) {
            const newPosition = deadReckoning.getPosition();
            setUserPosition(newPosition);
            setUserPath(prev => [...prev, newPosition]);

            // Auto-center map if tracking is active
            if (mapRef.current && isTracking) {
                mapRef.current.setView(newPosition);
            }
        }
    };
    const requestSensorPermissions = async () => {
        try {
            // iOS Safari
            if (typeof DeviceMotionEvent.requestPermission === 'function' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                const motionPermission = await DeviceMotionEvent.requestPermission();
                const orientationPermission = await DeviceOrientationEvent.requestPermission();
                
                return (motionPermission === 'granted' && orientationPermission === 'granted');
            } 
            // Android Chrome and other browsers
            else {
                // Check if sensors are available
                if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
                    return true; // Permissions are implied on Android
                }
                return false;
            }
        } catch (error) {
            console.error('Error requesting sensor permissions:', error);
            // If error occurs, still try to use sensors if available
            return !!(window.DeviceMotionEvent && window.DeviceOrientationEvent);
        }
    };

    const startTracking = async () => {
        if (!isInitialPositionSet) {
            alert('Please use Recenter GPS first to get initial position');
            return;
        }

        // Check if running on HTTPS
        if (window.location.protocol !== 'https:') {
            alert('Sensors require HTTPS. Please use a secure connection.');
            return;
        }

        // Try to get permissions
        const hasPermissions = await requestSensorPermissions();
        if (!hasPermissions) {
            alert('Motion sensors not available or permission denied');
            return;
        }

        setStepCount(0);
        lastStepTime.current = 0;
        filteredAccel.current = { x: 0, y: 0, z: 0 };

        window.addEventListener('devicemotion', handleMotion);
        window.addEventListener('deviceorientation', handleOrientation);
        setIsTracking(true);
    };

    const handleOrientation = (event) => {
        if (!deadReckoning || !hasInitialPosition.current) return;

        // Calibrate using true heading if available
        if (event.webkitCompassHeading) {
            deadReckoning.calibrate(event.webkitCompassHeading);
        }
    };

    const stopTracking = () => {
        if (isTracking) {
            window.removeEventListener('devicemotion', handleMotion);
            window.removeEventListener('deviceorientation', handleOrientation);
            setIsTracking(false);
            hasInitialPosition.current = false;
        }
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [deadReckoning]);

    useEffect(() => {
        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

    // For path mode: select from/to nodes
    const handleMarkerClick = id => {
        if (!isAddingPath) return;
        if (!fromNode) setFromNode(id);
        else if (!toNode && id !== fromNode) setToNode(id);
    };

    // When a new path is drawn
    const handleRouteCreated = e => {
        if (e.layerType !== 'polyline' || !fromNode || !toNode) return;

        const fromObject = objects.find(o => o.id === fromNode);
        const toObject = objects.find(o => o.id === toNode);

        const latlngs = e.layer.getLatLngs();
        let path = latlngs.map(p => ({ x: p.lng, y: p.lat }));

        // Correctly map start point
        path[0] = {
            x: fromObject.latlng[1], // longitude is second element
            y: fromObject.latlng[0]  // latitude is first element
        };

        // Correctly map end point
        path[path.length - 1] = {
            x: toObject.latlng[1],   // longitude is second element
            y: toObject.latlng[0]    // latitude is first element
        };

        setRoutes(prev => [...prev, {
            from: fromNode,
            to: toNode,
            type: 'corridor',
            weight: path.length,
            path
        }]);

        setIsAddingPath(false);
        setFromNode('');
        setToNode('');
    };

    // When a new boundary is drawn
    const handleBoundaryCreated = e => {
        if (e.layerType !== 'polygon') return;
        const geojson = e.layer.toGeoJSON();
        setBoundaries(prev => [...prev, geojson]);
        setIsAddingBoundary(false);
    };

    return (
        <div>
            {/* Controls panel */}
            <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, background: '#fff', color: '#000', padding: 8, borderRadius: 8 }}>
                {['vendingMachine', 'stairs', 'bench'].map(t => (
                    <button key={t} onClick={() => { setSelectedType(t); setIsAddingPath(false); setIsAddingBoundary(false); }} style={{ margin: '0 4px', padding: 6 }}>
                        {t.slice(0, 2).toUpperCase()}
                    </button>
                ))}
                <button onClick={() => { setIsAddingPath(true); setSelectedType(null); setIsAddingBoundary(false); setFromNode(''); setToNode(''); }} style={{ margin: '0 4px', padding: 6 }}>
                    Add Path
                </button>
                <button onClick={() => { setIsAddingBoundary(true); setSelectedType(null); setIsAddingPath(false); }} style={{ margin: '0 4px', padding: 6 }}>
                    Add Boundary
                </button>
                <button onClick={() => setMapType(prev => prev === 'normal' ? 'satellite' : 'normal')} style={{ margin: '0 4px', padding: 6 }}>
                    {mapType === 'normal' ? 'Satellite' : 'Normal'}
                </button>
                <button
                    onClick={recenterPosition}
                    style={{
                        margin: '0 4px',
                        padding: 6,
                        backgroundColor: '#4285F4',
                        color: 'white'
                    }}
                >
                    Recenter GPS
                </button>
                <button
                    onClick={isTracking ? stopTracking : startTracking}
                    style={{
                        margin: '0 4px',
                        padding: 6,
                        backgroundColor: isTracking ? '#ff4444' : '#44ff44'
                    }}
                >
                    {isTracking ? 'Stop Tracking' : 'Start DR Tracking'}
                </button>
                {isTracking && (
                    <span style={{
                        marginLeft: 8,
                        padding: '4px 8px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: 4
                    }}>
                        Steps: {stepCount}
                    </span>
                )}
                {isAddingPath && (fromNode || toNode) && <span style={{ marginLeft: 8 }}>{fromNode && "From : " + fromNode} - {toNode && "To : " + toNode}</span>}
                {isAddingPath && <span style={{ marginLeft: 8 }}>{!fromNode ? 'Select From' : !toNode ? 'Select To' : 'Draw Line'}</span>}
                {isAddingBoundary && <span style={{ marginLeft: 8 }}>Draw Boundary</span>}
            </div>

            <MapContainer
                center={userPosition || [26.4494, 80.1935]}
                zoom={18}
                maxZoom={30}
                style={{ height: '100vh', width: '100vw' }}
                ref={mapRef}
            >
                <TileLayer
                    url={mapType === 'normal'
                        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    }
                    maxZoom={20}
                    maxNativeZoom={19}
                    attribution={mapType === 'normal' ? '&copy; OSM contributors' : '&copy; Esri'}
                />

                <ZoomHandler setZoom={setZoomLevel} />

                {/* Drawing modes */}
                {isAddingBoundary && (
                    <FeatureGroup>
                        <EditControl
                            position="topright"
                            draw={{ rectangle: false, polygon: true, polyline: false, circle: false, marker: false }}
                            onCreated={handleBoundaryCreated}
                        />
                    </FeatureGroup>
                )}
                {isAddingPath && fromNode && toNode && (
                    <FeatureGroup>
                        <EditControl
                            position="topright"
                            draw={{ rectangle: false, polygon: false, polyline: true, circle: false, marker: false }}
                            onCreated={handleRouteCreated}
                        />
                    </FeatureGroup>
                )}

                {/* Render indoor elements only at zoom >=18 */}
                {zoomLevel >= 19 && (
                    <>
                        {/* Markers */}
                        {objects.map(obj => (
                            <Marker
                                key={obj.id}
                                position={obj.latlng}
                                icon={getIconByType(obj.type)}
                                eventHandlers={{ click: () => handleMarkerClick(obj.id) }}
                            >
                                <Popup>{obj.id}</Popup>
                            </Marker>
                        ))}

                        {/* Boundaries */}
                        {boundaries.map((b, i) => (
                            <Polygon
                                key={i}
                                positions={b.geometry.coordinates[0].map(c => [c[1], c[0]])}
                            />
                        ))}

                        {/* Routes */}
                        {routes.map((route, i) => {
                            const mergedPath = getMergedPath(route, routes, objects);

                            return (
                                <React.Fragment key={i}>
                                    {/* Path casing (outer white border) */}
                                    <Polyline
                                        positions={mergedPath.map(p => [p.y, p.x])}
                                        color="#FFFFFF"
                                        weight={8}
                                        opacity={1}
                                        lineCap="round"
                                        lineJoin="round"
                                        shadowColor="#000"
                                        shadowOpacity={0.2}
                                        shadowBlur={5}
                                    />

                                    {/* Main path */}
                                    <Polyline
                                        positions={mergedPath.map(p => [p.y, p.x])}
                                        color={PATH_COLORS.primary}
                                        weight={6}
                                        opacity={1}
                                        smoothFactor={1}
                                        lineCap="round"
                                        lineJoin="round"
                                        shadowColor="#000"
                                        shadowOpacity={0.2}
                                        shadowBlur={5}
                                    />

                                    {/* Animated arrows */}
                                    <Polyline
                                        positions={mergedPath.map(p => [p.y, p.x])}
                                        color={PATH_COLORS.arrows}
                                        weight={2}
                                        opacity={0.8}
                                        className="path-arrow"
                                        dashArray="12, 24"
                                        lineCap="round"
                                        lineJoin="round"
                                        shadowColor="#000"
                                        shadowOpacity={0.2}
                                        shadowBlur={5}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </>
                )}

                {/* User location and path */}
                {userPosition && (
                    <>
                        {/* User marker */}
                        <CircleMarker
                            center={userPosition}
                            radius={8}
                            color="#4285F4"
                            weight={2}
                            fillColor="#4285F4"
                            fillOpacity={0.7}
                        >
                            <Popup>You are here</Popup>
                        </CircleMarker>

                        {/* User path */}
                        {userPath.length > 1 && (
                            <>
                                {/* Path casing */}
                                <Polyline
                                    positions={userPath}
                                    color="#FFFFFF"
                                    weight={8}
                                    opacity={1}
                                    lineCap="round"
                                    lineJoin="round"
                                />

                                {/* Main path */}
                                <Polyline
                                    positions={userPath}
                                    color="#4285F4"
                                    weight={6}
                                    opacity={0.8}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            </>
                        )}
                    </>
                )}

                <ClickHandler addLatLng={addLatLng} selectedType={selectedType} isAddingPath={isAddingPath} />
            </MapContainer>
        </div>
    );
};

export default MapBuilder;
