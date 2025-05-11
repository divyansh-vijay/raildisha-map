import React, { useState, useEffect } from "react";
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
    const mapRef = React.useRef(null);

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

    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        // Start watching position
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const newPos = [position.coords.latitude, position.coords.longitude];
                
                setUserPosition(newPos);
                setUserPath(prev => [...prev, newPos]);
                
                // Auto-center map on user
                if (mapRef.current) {
                    mapRef.current.setView(newPos);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Error getting location. Please check permissions.');
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 20000
            }
        );
        
        setWatchId(id);
        setIsTracking(true);
    };

    const stopTracking = () => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsTracking(false);
    };

    useEffect(() => {
        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

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
                    onClick={isTracking ? stopTracking : startTracking}
                    style={{ 
                        margin: '0 4px', 
                        padding: 6,
                        backgroundColor: isTracking ? '#ff4444' : '#44ff44'
                    }}
                >
                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </button>
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
