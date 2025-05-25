import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    FeatureGroup,
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
import MapViewer2D from './MapViewer2D';
import { FaMap, FaRoute, FaDrawPolygon, FaChevronLeft, FaChevronRight, FaUpload, FaDownload, FaMapMarkerAlt, FaUtensils, FaShoppingBag, FaBuilding, FaParking, FaInfoCircle, FaMarker, FaUser, FaStore, FaCoffee, FaBook, FaFirstAid, FaWheelchair, FaArrowUp, FaDoorOpen } from 'react-icons/fa';
import { FaStairs } from "react-icons/fa6";
import { SiBlockbench } from "react-icons/si";
import { createFloor, createMarker, createPath, createBoundary } from "../src/services/api";
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
// const getIconByType = type => { ... };

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

    route.path.forEach((point) => {
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


// Add POI types and icons
const POI_TYPES = {
    restaurant: { icon: FaUtensils, color: '#e53935', label: 'Restaurant' },
    shop: { icon: FaShoppingBag, color: '#8e24aa', label: 'Shop' },
    toilet: { icon: FaBuilding, color: '#43a047', label: 'Toilet' },  // Changed from FaWc to FaBuilding
    office: { icon: FaBuilding, color: '#1e88e5', label: 'Office' },
    parking: { icon: FaParking, color: '#fb8c00', label: 'Parking' },
    info: { icon: FaInfoCircle, color: '#00acc1', label: 'Information' }
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

// Add custom marker types and icons
const CUSTOM_MARKER_TYPES = {
    user: { icon: FaUser, color: '#2196f3', label: 'User Location' },
    store: { icon: FaStore, color: '#4caf50', label: 'Store' },
    cafe: { icon: FaCoffee, color: '#ff9800', label: 'Cafe' },
    library: { icon: FaBook, color: '#9c27b0', label: 'Library' },
    medical: { icon: FaFirstAid, color: '#f44336', label: 'Medical' },
    accessibility: { icon: FaWheelchair, color: '#795548', label: 'Accessibility' },
    elevator: { icon: FaArrowUp, color: '#607d8b', label: 'Elevator' },
    entrance: { icon: FaDoorOpen, color: '#009688', label: 'Entrance' }
};

export default function MapBuilder() {
    const navigate = useNavigate();
    // Initialize state with null to prevent premature rendering
    const [floors, setFloors] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [floorData, setFloorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const mapRef = useRef(null);
    const [highlightedObjectId, setHighlightedObjectId] = useState(null);
    const [highlightedRouteIdx, setHighlightedRouteIdx] = useState(null);
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const fileInputRef = useRef(null);
    const [sidebarTab, setSidebarTab] = useState('elements');
    const [mapType, setMapType] = useState('normal');
    const [drawingMode, setDrawingMode] = useState(null);
    const drawControlRef = useRef(null);
    const featureGroupRef = useRef(null);
    const [currentMeasurement, setCurrentMeasurement] = useState(null);
    const [pathFromMarker, setPathFromMarker] = useState(null);
    const [pathToMarker, setPathToMarker] = useState(null);
    const [pathCreationStep, setPathCreationStep] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [showMarkerDetails, setShowMarkerDetails] = useState(false);
    const [showPathAnchors, setShowPathAnchors] = useState(false);
    const [selectedAnchorPoint, setSelectedAnchorPoint] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);

    // Define all callbacks at the top level
    const handleSaveToLocalStorage = () => {
        if (!floors || !floorData) {
            console.warn('No data to save');
            return;
        }

        try {
            const dataToSave = {
                floors,
                floorData,
                selectedFloor
            };
            localStorage.setItem('rd_map_data', JSON.stringify(dataToSave));
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    const handleLoadFromLocalStorage = () => {
        try {
            const savedData = localStorage.getItem('rd_map_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.floors && parsedData.floorData) {
                    setFloors(parsedData.floors);
                    setFloorData(parsedData.floorData);
                    setSelectedFloor(parsedData.selectedFloor || parsedData.floors[0]?.id);
                    setShowSaveToast(true);
                    setTimeout(() => setShowSaveToast(false), 2000);
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    };

    const handleExportJSON = useCallback(() => {
        const data = {
            floors,
            floorData
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [floors, floorData]);

    const handleImportJSON = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.floors && data.floorData) {
                    if (window.confirm('Importing will overwrite current map data. Continue?')) {
                        setFloors(data.floors);
                        setFloorData(data.floorData);
                        setSelectedFloor(data.floors[0]?.id || 'floor_1');
                        setShowSaveToast(true);
                        setTimeout(() => setShowSaveToast(false), 2000);
                    }
                } else {
                    alert('Invalid map data format.');
                }
            } catch (err) {
                alert('Failed to import: ' + err.message);
            }
        };
        reader.readAsText(file);
    }, []);

    // Map initialization effect
    useEffect(() => {
        if (mapRef.current) {
            const map = mapRef.current;
            if (!map._loaded) {
                map.invalidateSize();
            }
        }
    }, [selectedFloor, floorData]);

    // Auto-save effect
    useEffect(() => {
        if (!isLoading && floors && floorData) {
            const saveData = () => {
                try {
                    const dataToSave = {
                        floors,
                        floorData,
                        selectedFloor
                    };
                    localStorage.setItem('rd_map_data', JSON.stringify(dataToSave));
                } catch (err) {
                    console.error('Error auto-saving:', err);
                }
            };

            saveData();
        }
    }, [floors, floorData, selectedFloor, isLoading]);

    // Initial data loading effect
    useEffect(() => {
        const loadData = () => {
            try {
                const savedData = localStorage.getItem('rd_map_data');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.floors && parsedData.floorData) {
                        setFloors(parsedData.floors);
                        setFloorData(parsedData.floorData);
                        setSelectedFloor(parsedData.selectedFloor || parsedData.floors[0]?.id);
                    } else {
                        initializeDefaultData();
                    }
                } else {
                    initializeDefaultData();
                }
            } catch (err) {
                console.error('Error loading data:', err);
                initializeDefaultData();
            } finally {
                setIsLoading(false);
            }
        };

        const initializeDefaultData = () => {
            const defaultFloors = [{ id: 'floor_1', name: 'Floor 1' }];
            const defaultFloorData = {
                'floor_1': {
                    objects: [],
                    routes: [],
                    boundaries: [],
                    innerBoundaries: []
                }
            };
            setFloors(defaultFloors);
            setFloorData(defaultFloorData);
            setSelectedFloor('floor_1');
        };

        loadData();
    }, []); // Only run on component mount

    // Add this new function to handle anchor point clicks
    const handleAnchorPointClick = (point, routeId, pointIndex) => {
        if (drawingMode === 'polyline') {
            if (pathCreationStep === 'from') {
                setPathFromMarker({ id: `anchor_${routeId}_${pointIndex}`, type: 'anchor', latlng: [point.y, point.x] });
                setPathCreationStep('to');
                setCurrentMeasurement(`Selected start point: Anchor point ${pointIndex + 1}`);
            } else if (pathCreationStep === 'to') {
                setPathToMarker({ id: `anchor_${routeId}_${pointIndex}`, type: 'anchor', latlng: [point.y, point.x] });
                setPathCreationStep('draw');
                setCurrentMeasurement(`Selected end point: Anchor point ${pointIndex + 1}. Now draw the path.`);
                // Enable polyline drawing
                if (drawControlRef.current) {
                    const drawControl = drawControlRef.current.leafletElement;
                    if (drawControl) {
                        drawControl._toolbars.draw._modes.polyline.handler.enable();
                    }
                }
            }
        }
    };

    // Update handleSetDrawingMode to show/hide anchor points
    const handleSetDrawingMode = (mode) => {
        setDrawingMode(mode);
        setShowPathAnchors(mode === 'polyline');

        // Reset path creation states when starting new path
        if (mode === 'polyline') {
            setPathFromMarker(null);
            setPathToMarker(null);
            setPathCreationStep('from');
            setCurrentMeasurement(null);
            setSelectedAnchorPoint(null);
        } else {
            setPathCreationStep(null);
            setShowPathAnchors(false);
        }

        // If switching to a new drawing mode, enable the appropriate draw control
        if (drawControlRef.current) {
            const drawControl = drawControlRef.current.leafletElement;
            if (drawControl) {
                // Disable all drawing modes first
                drawControl._toolbars.draw._modes.marker.handler.disable();
                drawControl._toolbars.draw._modes.polygon.handler.disable();
                drawControl._toolbars.draw._modes.polyline.handler.disable();

                // Enable the selected mode
                if (mode === 'marker') {
                    drawControl._toolbars.draw._modes.marker.handler.enable();
                } else if (mode === 'polygon' || mode === 'innerPolygon') {
                    drawControl._toolbars.draw._modes.polygon.handler.enable();
                } else if (mode === 'polyline' && pathCreationStep === 'draw') {
                    drawControl._toolbars.draw._modes.polyline.handler.enable();
                }
            }
        }
    };

    // Add click handler for markers during path creation
    const handleMarkerClick = (marker) => {
        if (drawingMode === 'polyline') {
            if (pathCreationStep === 'from') {
                setPathFromMarker(marker);
                setPathCreationStep('to');
                setCurrentMeasurement(`Selected start point: ${marker.name || marker.id}`);
            } else if (pathCreationStep === 'to') {
                setPathToMarker(marker);
                setPathCreationStep('draw');
                setCurrentMeasurement(`Selected end point: ${marker.name || marker.id}. Now draw the path.`);
                // Enable polyline drawing
                if (drawControlRef.current) {
                    const drawControl = drawControlRef.current.leafletElement;
                    if (drawControl) {
                        drawControl._toolbars.draw._modes.polyline.handler.enable();
                    }
                }
            }
        } else {
            setSelectedMarker(marker);
            setShowMarkerDetails(true);
        }
    };

    // Add helper function to calculate distance
    const calculateDistance = (points) => {
        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const dx = curr.lng - prev.lng;
            const dy = curr.lat - prev.lat;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        // Convert to meters (approximate)
        return (totalDistance * 111000).toFixed(1);
    };

    // Add helper function to calculate area
    const calculateArea = (points) => {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].lng * points[j].lat;
            area -= points[j].lng * points[i].lat;
        }
        // Convert to square meters (approximate)
        return (Math.abs(area / 2) * 111000 * 111000).toFixed(1);
    };

    // Update handleCreated for polyline
    const handleCreated = (e) => {
        const layer = e.layer;
        const type = e.layerType;

        // Reset measurement
        setCurrentMeasurement(null);

        if (type === 'marker') {
            try {
                const latLng = layer.getLatLng();
                if (!latLng) {
                    console.error('Invalid marker position');
                    return;
                }

                console.log('Creating new marker at:', latLng);
                const newMarker = {
                    id: `marker_${Date.now()}`,
                    type: 'vendingMachine',
                    name: `Marker ${Date.now()}`,
                    latlng: [latLng.lat, latLng.lng]
                };

                // Set marker options
                layer.options.id = newMarker.id;
                layer.options.type = newMarker.type;
                layer.options.name = newMarker.name;

                setFloorData(prev => {
                    if (!prev || !selectedFloor) {
                        console.warn('Invalid floor data or selected floor:', { prev, selectedFloor });
                        return prev;
                    }
                    console.log('Adding marker to floor data:', { newMarker, selectedFloor });
                    const floor = prev[selectedFloor] || { objects: [], routes: [], boundaries: [], innerBoundaries: [] };
                    const updatedFloor = {
                        ...floor,
                        objects: [...(floor.objects || []), newMarker]
                    };
                    console.log('Updated floor data:', updatedFloor);
                    return {
                        ...prev,
                        [selectedFloor]: updatedFloor
                    };
                });

                // Remove the temporary marker layer
                if (layer && layer.remove) {
                    layer.remove();
                }
            } catch (err) {
                console.error('Error creating marker:', err);
            }
        } else if (type === 'polygon') {
            const points = layer.getLatLngs()[0];
            const area = calculateArea(points);
            setCurrentMeasurement(`Area: ${area} m²`);

            // Set the layer type for proper handling in edit/delete operations
            const polygonId = `polygon_${Date.now()}`;
            layer.options.id = polygonId;
            layer.options.type = drawingMode === 'innerPolygon' ? 'innerBoundary' : 'boundary';

            const newPolygon = {
                id: polygonId,
                type: drawingMode === 'innerPolygon' ? 'innerBoundary' : 'boundary',
                geometry: layer.toGeoJSON().geometry,
                properties: drawingMode === 'innerPolygon' ? {
                    name: `Inner Boundary ${Date.now()}`,
                    category: 'facility',
                    description: ''
                } : {}
            };

            setFloorData(prev => {
                const floor = prev[selectedFloor] || { objects: [], routes: [], boundaries: [], innerBoundaries: [] };
                if (drawingMode === 'innerPolygon') {
                    return {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            innerBoundaries: [...(floor.innerBoundaries || []), newPolygon]
                        }
                    };
                } else {
                    return {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            boundaries: [...(floor.boundaries || []), newPolygon]
                        }
                    };
                }
            });

            // Remove the temporary polygon layer
            if (layer && layer.remove) {
                layer.remove();
            }
        } else if (type === 'polyline') {
            const points = layer.getLatLngs();
            const distance = calculateDistance(points);
            setCurrentMeasurement(`Length: ${distance} m`);

            // Replace first and last points with exact marker positions
            const fromMarker = floorData[selectedFloor].objects.find(obj => obj.id === pathFromMarker?.id);
            const toMarker = floorData[selectedFloor].objects.find(obj => obj.id === pathToMarker?.id);

            if (fromMarker && toMarker) {
                // Create new path array with exact marker positions
                const adjustedPath = [
                    { x: fromMarker.latlng[1], y: fromMarker.latlng[0] }, // from marker position
                    ...points.slice(1, -1).map(latLng => ({ x: latLng.lng, y: latLng.lat })), // middle points
                    { x: toMarker.latlng[1], y: toMarker.latlng[0] } // to marker position
                ];

                // Get existing routes for merging
                const existingRoutes = floorData[selectedFloor].routes || [];

                // Create the new path with marker references
                const newPath = {
                    id: `path_${Date.now()}`,
                    type: 'corridor',
                    from: pathFromMarker?.id,
                    to: pathToMarker?.id,
                    path: getMergedPath({ path: adjustedPath }, existingRoutes, floorData[selectedFloor].objects)
                };

                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    return {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            routes: [...(floor.routes || []), newPath]
                        }
                    };
                });
            }

            // Reset path creation states
            setPathFromMarker(null);
            setPathToMarker(null);
            setPathCreationStep(null);

            // Remove the temporary path layer
            if (layer && layer.remove) {
                layer.remove();
            }
        }

        setDrawingMode(null);
    };

    // Fix handleDrawStart
    const handleDrawStart = () => {
        setCurrentMeasurement(null);
    };

    const handleDrawVertex = (e) => {
        const layer = e.layer;
        const type = e.layerType;

        if (type === 'polygon') {
            const points = layer.getLatLngs()[0];
            if (points.length > 2) {
                const area = calculateArea(points);
                setCurrentMeasurement(`Area: ${area} m²`);
            }
        } else if (type === 'polyline') {
            const points = layer.getLatLngs();
            if (points.length > 1) {
                const distance = calculateDistance(points);
                setCurrentMeasurement(`Length: ${distance} m`);
            }
        }
    };

    // Update the handleEdited function
    const handleEdited = (e) => {
        const layers = e.layers;
        let hasChanges = false;

        layers.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const newLatLng = layer.getLatLng();
                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    const updatedObjects = floor.objects.map(obj => {
                        if (obj.id === layer.options.options.id) {
                            hasChanges = true;
                            return {
                                ...obj,
                                latlng: [newLatLng.lat, newLatLng.lng]
                            };
                        }
                        return obj;
                    });

                    const newFloorData = {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            objects: updatedObjects
                        }
                    };

                    // Save to localStorage immediately after state update
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newFloorData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    return newFloorData;
                });
            } else if (layer instanceof L.Polygon) {
                const newGeometry = layer.toGeoJSON().geometry;
                console.log('Editing polygon:', layer.options.options.id, 'Type:', layer.options.type, 'Options:', layer.options);

                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    // Check if it's an inner boundary by looking at the options
                    const isInnerBoundary = layer.options.options?.type === 'innerBoundary';
                    console.log('Is inner boundary:', isInnerBoundary);

                    const boundaries = isInnerBoundary ? floor.innerBoundaries : floor.boundaries;
                    const updatedBoundaries = boundaries.map(boundary => {
                        if (boundary.id === layer.options.options.id) {
                            hasChanges = true;
                            return {
                                ...boundary,
                                geometry: {
                                    type: newGeometry.type,
                                    coordinates: newGeometry.coordinates
                                }
                            };
                        }
                        return boundary;
                    });

                    const newFloorData = {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            [isInnerBoundary ? 'innerBoundaries' : 'boundaries']: updatedBoundaries
                        }
                    };

                    // Save to localStorage immediately after state update
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newFloorData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    return newFloorData;
                });
            } else if (layer instanceof L.Polyline) {
                const newPath = layer.getLatLngs().map(latLng => ({ x: latLng.lng, y: latLng.lat }));
                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    const updatedRoutes = floor.routes.map(route => {
                        if (route.id === layer.options.options.id) {
                            hasChanges = true;
                            return {
                                ...route,
                                path: newPath
                            };
                        }
                        return route;
                    });

                    const newFloorData = {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            routes: updatedRoutes
                        }
                    };

                    // Save to localStorage immediately after state update
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newFloorData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    return newFloorData;
                });
            }
        });

        if (hasChanges) {
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        }
    };

    // Update the handleDeleted function
    const handleDeleted = (e) => {
        const layers = e.layers;
        let hasChanges = false;

        layers.eachLayer(layer => {
            console.log('Layer:', layer);
            console.log('Layer options:', layer.options);

            if (layer instanceof L.Marker) {
                const markerId = layer.options.options.id;
                console.log('Deleting marker with ID:', markerId);

                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    const updatedObjects = floor.objects.filter(obj => obj.id !== markerId);
                    const updatedRoutes = floor.routes.filter(route =>
                        route.from !== markerId && route.to !== markerId
                    );

                    const updatedFloor = {
                        ...floor,
                        objects: updatedObjects,
                        routes: updatedRoutes
                    };

                    const newData = {
                        ...prev,
                        [selectedFloor]: updatedFloor
                    };

                    // Save to localStorage immediately
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    hasChanges = true;
                    return newData;
                });
            } else if (layer instanceof L.Polygon) {
                const polygonId = layer.options.options.id;
                console.log('Deleting polygon with ID:', polygonId);

                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    const isInnerBoundary = layer.options.options.type === 'innerBoundary';
                    const boundaries = isInnerBoundary ? floor.innerBoundaries : floor.boundaries;
                    const updatedBoundaries = boundaries.filter(boundary => boundary.id !== polygonId);
                    const newData = {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            [isInnerBoundary ? 'innerBoundaries' : 'boundaries']: updatedBoundaries
                        }
                    };

                    // Save to localStorage immediately
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    hasChanges = true;
                    return newData;
                });
            } else if (layer instanceof L.Polyline) {
                const pathId = layer.options.options.id;
                console.log('Deleting path with ID:', pathId);

                setFloorData(prev => {
                    const floor = prev[selectedFloor];
                    const updatedRoutes = floor.routes.filter(route => route.id !== pathId);

                    const newData = {
                        ...prev,
                        [selectedFloor]: {
                            ...floor,
                            routes: updatedRoutes
                        }
                    };

                    // Save to localStorage immediately
                    try {
                        localStorage.setItem('rd_map_data', JSON.stringify({
                            floors,
                            floorData: newData,
                            selectedFloor
                        }));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }

                    hasChanges = true;
                    return newData;
                });
            }
        });

        if (hasChanges) {
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        }
    };

    // Restore necessary handlers
    const handleDeleteMarker = (id) => {
        setFloorData(prev => {
            const floor = prev[selectedFloor];
            return {
                ...prev,
                [selectedFloor]: {
                    ...floor,
                    objects: floor.objects.filter(obj => obj.id !== id),
                    routes: floor.routes.filter(route => route.from !== id && route.to !== id)
                }
            };
        });
    };

    const handleDeletePath = (pathIdx) => {
        setFloorData(prev => {
            const floor = prev[selectedFloor];
            const updatedRoutes = floor.routes.filter((_, i) => i !== pathIdx);
            return {
                ...prev,
                [selectedFloor]: {
                    ...floor,
                    routes: updatedRoutes
                }
            };
        });
    };

    // Add marker types for selection
    const MARKER_TYPES = {
        vendingMachine: { icon: FaUtensils, color: '#e53935', label: 'Vending Machine' },
        stairs: { icon: FaStairs, color: '#8e24aa', label: 'Stairs' },
        bench: { icon: SiBlockbench, color: '#43a047', label: 'Bench' },
        elevator: { icon: FaArrowUp, color: '#1e88e5', label: 'Elevator' },
        entrance: { icon: FaDoorOpen, color: '#fb8c00', label: 'Entrance' },
        info: { icon: FaInfoCircle, color: '#00acc1', label: 'Information' }
    };

    // Add handler for marker property updates
    const handleMarkerUpdate = (updates) => {
        setFloorData(prev => {
            const floor = prev[selectedFloor];
            const updatedObjects = floor.objects.map(obj => {
                if (obj.id === selectedMarker.id) {
                    return { ...obj, ...updates };
                }
                return obj;
            });

            const newFloorData = {
                ...prev,
                [selectedFloor]: {
                    ...floor,
                    objects: updatedObjects
                }
            };

            // Update the selected marker state with the new values
            setSelectedMarker(prev => ({
                ...prev,
                ...updates
            }));

            // Save to localStorage immediately
            try {
                localStorage.setItem('rd_map_data', JSON.stringify({
                    floors,
                    floorData: newFloorData,
                    selectedFloor
                }));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }

            return newFloorData;
        });
    };

    const handleUpload = async () => {
        try {
            setIsUploading(true);
            setUploadStatus('Uploading floor data...');

            // Extract floor number from selectedFloor (e.g., "floor_1" -> 1)
            const floorNumber = parseInt(selectedFloor.replace('floor_', ''), 10);
            if (isNaN(floorNumber)) {
                throw new Error('Invalid floor number');
            }

            // Create floor with all map data
            const uploadData = {
                name: `Floor ${floorNumber}`,
                level: floorNumber,
                map_data: {
                    objects: floorData[selectedFloor].objects.map(obj => ({
                        id: obj.id,
                        name: obj.name || 'Unnamed Marker',
                        description: obj.description || '',
                        position: { lat: obj.latlng[0], lng: obj.latlng[1] },
                        type: obj.type || 'default'
                    })),
                    routes: floorData[selectedFloor].routes.map(route => ({
                        id: route.id,
                        name: route.name || 'Unnamed Path',
                        description: route.description || '',
                        points: route.path.map(point => ({ lat: point.y, lng: point.x })),
                        type: route.type || 'default'
                    })),
                    boundaries: floorData[selectedFloor].boundaries.map(boundary => ({
                        id: boundary.id,
                        name: boundary.name || 'Unnamed Boundary',
                        description: boundary.description || '',
                        points: boundary.geometry.coordinates[0].map(point => ({ lat: point[1], lng: point[0] })),
                        type: boundary.type || 'default'
                    })),
                    innerBoundaries: floorData[selectedFloor].innerBoundaries.map(boundary => ({
                        id: boundary.id,
                        name: boundary.properties?.name || 'Unnamed Inner Boundary',
                        description: boundary.properties?.description || '',
                        points: boundary.geometry.coordinates[0].map(point => ({ lat: point[1], lng: point[0] })),
                        type: boundary.type || 'default',
                        category: boundary.properties?.category || 'facility'
                    }))
                }
            };

            await createFloor(uploadData);
            setUploadStatus('Upload complete!');
            setTimeout(() => setUploadStatus(null), 3000);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    // Early return for loading state
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7fa' }}>
                <div style={{ fontSize: 22, color: '#888', marginBottom: 24 }}>Loading map data...</div>
            </div>
        );
    }

    // Early return for no floor data
    if (!selectedFloor || !floorData || !floorData[selectedFloor]) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7fa' }}>
                <div style={{ fontSize: 22, color: '#888', marginBottom: 24 }}>Initializing map...</div>
                <button
                    onClick={() => {
                        const newId = 'floor_1';
                        console.log('Initializing new map with floor:', newId);
                        setFloors([{ id: newId, name: 'Floor 1' }]);
                        setFloorData({
                            [newId]: {
                                objects: [],
                                routes: [],
                                boundaries: [],
                                innerBoundaries: []
                            }
                        });
                        setSelectedFloor(newId);
                    }}
                    style={{ background: '#4285F4', color: 'white', border: 'none', borderRadius: 4, padding: '12px 24px', fontWeight: 500, fontSize: 16 }}
                >
                    Initialize New Map
                </button>
            </div>
        );
    }

    // Main render
    return (
        <div style={{ 
            position: 'fixed',  // Change from relative to fixed
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            color: 'black',
            background: '#f7f7fa',
            overflow: 'hidden'  // Prevent scrolling
        }}>
            {/* Sidebar (fixed left, overlay) */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: sidebarCollapsed ? 48 : 260,
                background: '#fff',
                borderRight: '1px solid #e0e0e0',
                boxShadow: '2px 0 16px rgba(0,0,0,0.08)',
                zIndex: 2001,
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.2s',
                overflow: 'hidden',
            }}>
                {/* Sidebar header and tabs */}
                <div style={{ display: 'flex', alignItems: 'center', padding: sidebarCollapsed ? 8 : 14, borderBottom: '1px solid #e0e0e0', background: '#f5f5f7', fontWeight: 600, fontSize: 16, justifyContent: 'space-between', position: 'relative' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaMap style={{ color: '#4285F4', fontSize: 20 }} />
                        {!sidebarCollapsed && <span>Map Builder</span>}
                    </span>
                    {/* Tabs */}
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
                            <button
                                onClick={() => setSidebarTab('elements')}
                                style={{
                                    background: sidebarTab === 'elements' ? '#e3f2fd' : 'transparent',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 10px',
                                    fontWeight: 500,
                                    color: sidebarTab === 'elements' ? '#1976d2' : '#888',
                                    cursor: 'pointer',
                                    fontSize: 13
                                }}
                            >Elements</button>
                            <button
                                onClick={() => setSidebarTab('functions')}
                                style={{
                                    background: sidebarTab === 'functions' ? '#e3f2fd' : 'transparent',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 10px',
                                    fontWeight: 500,
                                    color: sidebarTab === 'functions' ? '#1976d2' : '#888',
                                    cursor: 'pointer',
                                    fontSize: 13
                                }}
                            >Functions</button>
                        </div>
                    )}
                    {/* Always show open/close button, fixed to left edge */}
                    <button
                        onClick={() => setSidebarCollapsed(v => !v)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#888',
                            fontSize: 20,
                            position: 'absolute',
                            left: sidebarCollapsed ? 8 : 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 2002,
                        }}
                        title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>
                <div style={{ padding: sidebarCollapsed ? 0 : 8, flex: 1, overflowY: 'auto', minWidth: 0, display: sidebarCollapsed ? 'none' : 'block' }}>
                    {!sidebarCollapsed && sidebarTab === 'elements' && selectedFloor && floorData[selectedFloor] && <>
                        <div style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                            <div style={{ fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><FaMap style={{ color: '#90caf9' }} /> Objects</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                                {floorData[selectedFloor].objects.map(obj => (
                                    <li key={obj.id} style={{
                                        background: highlightedObjectId === obj.id ? '#e3f2fd' : 'transparent',
                                        borderRadius: 3,
                                        padding: '2px 4px',
                                        marginBottom: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        fontSize: 12
                                    }}
                                        onMouseEnter={() => setHighlightedObjectId(obj.id)}
                                        onMouseLeave={() => setHighlightedObjectId(null)}
                                    >
                                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <div style={{
                                                background: MARKER_TYPES[obj.type]?.color || '#2196f3',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                                                    <path d={getIconPath(MARKER_TYPES[obj.type]?.icon || FaMarker)} />
                                                </svg>
                                            </div>
                                            {obj.name || obj.id} <span style={{ color: '#888', fontSize: 12 }}>({MARKER_TYPES[obj.type]?.label || obj.type})</span>
                                        </span>
                                        <button onClick={() => handleDeleteMarker(obj.id)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 16, marginLeft: 8 }} title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                            <div style={{ fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><FaRoute style={{ color: '#ffb300' }} /> Routes</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                                {floorData[selectedFloor].routes.map((route, i) => (
                                    <li key={i} style={{
                                        background: highlightedRouteIdx === i ? '#e3f2fd' : 'transparent',
                                        borderRadius: 3,
                                        padding: '2px 4px',
                                        marginBottom: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        fontSize: 12
                                    }}
                                        onMouseEnter={() => setHighlightedRouteIdx(i)}
                                        onMouseLeave={() => setHighlightedRouteIdx(null)}
                                    >
                                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <FaRoute style={{ color: '#ffb300' }} />
                                            {route.from} → {route.to} <span style={{ color: '#888', fontSize: 12 }}>({route.type})</span>
                                        </span>
                                        <button onClick={() => handleDeletePath(i)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 16, marginLeft: 8 }} title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><FaDrawPolygon style={{ color: '#7e57c2' }} /> Boundaries</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                                {floorData[selectedFloor].boundaries.map((b, i) => (
                                    <li key={i} style={{
                                        background: 'transparent',
                                        borderRadius: 3,
                                        padding: '2px 4px',
                                        marginBottom: 1,
                                        color: '#888',
                                        fontSize: 11
                                    }}>
                                        <FaDrawPolygon style={{ color: '#7e57c2', marginRight: 4 }} /> Polygon #{i + 1}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                            <div style={{ fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, color: '#ff7043', fontSize: 13 }}><FaDrawPolygon style={{ color: '#ff7043' }} /> Shops / POIs</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                                {(floorData[selectedFloor].shops || []).map((shop, i) => (
                                    <li key={i} style={{
                                        background: 'transparent',
                                        borderRadius: 3,
                                        padding: '2px 4px',
                                        marginBottom: 1,
                                        color: '#ff7043',
                                        fontSize: 12
                                    }}>
                                        <FaDrawPolygon style={{ color: '#ff7043', marginRight: 4 }} /> {shop.type.charAt(0).toUpperCase() + shop.type.slice(1)} #{i + 1}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>}
                </div>
                {/* Functions tab content */}
                {!sidebarCollapsed && sidebarTab === 'functions' && (
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={handleSaveToLocalStorage} style={{ background: '#4285F4', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, fontSize: 14 }} title="Save to LocalStorage">Save</button>
                        <button onClick={handleLoadFromLocalStorage} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, fontSize: 14 }} title="Load from LocalStorage">Load</button>
                        <button onClick={() => navigate('/viewer')} style={{ background: '#222', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, fontSize: 14 }} title="View Map">View Map</button>
                        <button onClick={handleExportJSON} style={{ background: '#fff', color: '#4285F4', border: '1px solid #4285F4', borderRadius: 4, padding: '8px 0', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }} title="Export JSON"><FaDownload />Export</button>
                        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: '#fff', color: '#4285F4', border: '1px solid #4285F4', borderRadius: 4, padding: '8px 0', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }} title="Import JSON"><FaUpload />Import</button>
                        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportJSON} />
                        <button 
                            onClick={handleUpload} 
                            disabled={isUploading}
                            style={{ 
                                background: isUploading ? '#ccc' : '#4caf50', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 4, 
                                padding: '8px 0', 
                                fontWeight: 500, 
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: isUploading ? 'not-allowed' : 'pointer'
                            }} 
                            title="Upload to Server"
                        >
                            <FaUpload />
                            {isUploading ? 'Uploading...' : 'Upload to Server'}
                        </button>
                        {uploadStatus && (
                            <div style={{ 
                                background: 'white', 
                                padding: '8px', 
                                borderRadius: 4, 
                                border: '1px solid #ddd',
                                fontSize: 12,
                                color: '#666'
                            }}>
                                {uploadStatus}
                            </div>
                        )}
                    </div>
                )}
                {showSaveToast && (
                    <div style={{ position: 'absolute', bottom: 80, left: 16, background: '#4caf50', color: 'white', padding: '8px 16px', borderRadius: 6, fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        Saved!
                    </div>
                )}
            </div>
            {/* Add measurement display */}
            {currentMeasurement && (
                <div style={{
                    position: 'fixed',
                    bottom: 100,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    zIndex: 1000,
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    {currentMeasurement}
                </div>
            )}
            {/* Add Marker Details Panel */}
            {showMarkerDetails && selectedMarker && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 2000,
                    minWidth: '300px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Marker Details</h3>
                        <button
                            onClick={() => setShowMarkerDetails(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Name</label>
                        <input
                            type="text"
                            value={selectedMarker.name || ''}
                            onChange={(e) => handleMarkerUpdate({ name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Type</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                background: MARKER_TYPES[selectedMarker.type]?.color || '#2196f3',
                                color: 'white',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d={getIconPath(MARKER_TYPES[selectedMarker.type]?.icon || FaMarker)} />
                                </svg>
                            </div>
                            <select
                                value={selectedMarker.type || 'vendingMachine'}
                                onChange={(e) => handleMarkerUpdate({ type: e.target.value })}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                {Object.entries(MARKER_TYPES).map(([value, { label }]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Description</label>
                        <textarea
                            value={selectedMarker.description || ''}
                            onChange={(e) => handleMarkerUpdate({ description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                minHeight: '80px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                            onClick={() => {
                                handleDeleteMarker(selectedMarker.id);
                                setShowMarkerDetails(false);
                            }}
                            style={{
                                padding: '8px 16px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setShowMarkerDetails(false)}
                            style={{
                                padding: '8px 16px',
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* Main map area */}
            <div style={{ 
                position: 'fixed',  // Change from relative to fixed
                top: 0,
                left: sidebarCollapsed ? 48 : 260,
                right: 0,
                bottom: 0,
                overflow: 'hidden'  // Prevent scrolling
            }}>
                {selectedFloor && floorData[selectedFloor] && (
                    <>
                        {/* Bottom-center drawing controls bar */}
                        <div style={{
                            position: 'fixed',
                            left: sidebarCollapsed ? 48 : 260,
                            right: 0,
                            bottom: 24,
                            zIndex: 1100,
                            display: 'flex',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#fff',
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                padding: '8px 16px',
                                gap: 8,
                                pointerEvents: 'auto',
                                minWidth: 320,
                                maxWidth: 600,
                                margin: '0 auto',
                            }}>
                                <span style={{ marginRight: 8 }}>Floor:</span>
                                <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)} style={{ marginRight: 8 }}>
                                    {floors.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        const newId = `floor_${floors.length + 1}`;
                                        setFloors(prev => [...prev, { id: newId, name: `Floor ${floors.length + 1}` }]);
                                        setFloorData(prev => ({
                                            ...prev,
                                            [newId]: { objects: [], routes: [], boundaries: [], innerBoundaries: [] }
                                        }));
                                        setSelectedFloor(newId);
                                    }}
                                    style={{ padding: '4px 8px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 4, marginRight: 8 }}
                                >
                                    + Add Floor
                                </button>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => handleSetDrawingMode('marker')}
                                        style={{
                                            padding: '4px 8px',
                                            background: drawingMode === 'marker' ? '#e91e63' : '#fce4ec',
                                            color: drawingMode === 'marker' ? 'white' : '#e91e63',
                                            border: '1px solid #e91e63',
                                            borderRadius: 4,
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}
                                        title={drawingMode === 'marker' ? "Click on map to place marker" : "Add Marker"}
                                    >
                                        <FaMapMarkerAlt />
                                        {drawingMode === 'marker' ? 'Click on map to place marker' : 'Add Marker'}
                                    </button>

                                    <button
                                        onClick={() => handleSetDrawingMode('polygon')}
                                        style={{
                                            padding: '4px 8px',
                                            background: drawingMode === 'polygon' ? '#607d8b' : '#eceff1',
                                            color: drawingMode === 'polygon' ? 'white' : '#607d8b',
                                            border: '1px solid #607d8b',
                                            borderRadius: 4,
                                            fontWeight: 500
                                        }}
                                        title="Draw a boundary"
                                    >
                                        {drawingMode === 'polygon' ? 'Drawing Boundary...' : 'Add Boundary'}
                                    </button>

                                    <button
                                        onClick={() => handleSetDrawingMode('innerPolygon')}
                                        style={{
                                            padding: '4px 8px',
                                            background: drawingMode === 'innerPolygon' ? '#ff7043' : '#fff3e0',
                                            color: drawingMode === 'innerPolygon' ? 'white' : '#ff7043',
                                            border: '1px solid #ff7043',
                                            borderRadius: 4,
                                            fontWeight: 500
                                        }}
                                        title="Draw an inner boundary for shops/facilities"
                                    >
                                        {drawingMode === 'innerPolygon' ? 'Drawing Inner Boundary...' : 'Add Inner Boundary'}
                                    </button>

                                    <button
                                        onClick={() => handleSetDrawingMode('polyline')}
                                        style={{
                                            padding: '4px 8px',
                                            background: drawingMode === 'polyline' ? '#1976d2' : '#e3f2fd',
                                            color: drawingMode === 'polyline' ? 'white' : '#1976d2',
                                            border: '1px solid #1976d2',
                                            borderRadius: 4,
                                            fontWeight: 500
                                        }}
                                        title="Draw a path"
                                    >
                                        {drawingMode === 'polyline' ? 'Drawing Path...' : 'Add Path'}
                                    </button>

                                    <button
                                        onClick={() => setMapType(mapType === 'normal' ? 'satellite' : 'normal')}
                                        style={{ padding: '4px 8px', background: mapType === 'normal' ? '#eceff1' : '#607d8b', color: mapType === 'normal' ? '#607d8b' : 'white', border: '1px solid #607d8b', borderRadius: 4, fontWeight: 500 }}
                                    >
                                        {mapType === 'normal' ? 'Satellite' : 'Normal'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <MapContainer
                            center={[26.4494, 80.1935]}
                            zoom={18}
                            maxZoom={30}
                            style={{ 
                                height: '100%',  // Change from 100vh to 100%
                                width: '100%',   // Change from 100vw to 100%
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0
                            }}
                            ref={mapRef}
                            whenReady={() => {
                                if (mapRef.current) {
                                    mapRef.current.invalidateSize();
                                }
                            }}
                        >
                            <TileLayer
                                url={mapType === 'normal'
                                    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'}
                                maxZoom={20}
                                maxNativeZoom={19}
                                attribution={mapType === 'normal' ? '&copy; OSM contributors' : '&copy; Esri'}
                            />

                            {/* Single EditControl for both drawing and editing */}
                            <FeatureGroup ref={featureGroupRef}>
                                {/* Add existing markers */}
                                {floorData[selectedFloor]?.objects?.map(obj => (
                                    <Marker
                                        key={obj.id}
                                        position={obj.latlng}
                                        icon={L.divIcon({
                                            className: '',
                                            html: `<div style="
                                                background: ${drawingMode === 'polyline' &&
                                                    ((pathCreationStep === 'from' && pathFromMarker?.id === obj.id) ||
                                                        (pathCreationStep === 'to' && pathToMarker?.id === obj.id))
                                                    ? '#e91e63' : MARKER_TYPES[obj.type]?.color || '#2196f3'};
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
                                        options={{
                                            id: obj.id,
                                            type: obj.type,
                                            name: obj.name
                                        }}
                                        eventHandlers={{
                                            click: () => handleMarkerClick(obj)
                                        }}
                                    />
                                ))}

                                {/* Add existing boundaries */}
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
                                        options={{
                                            id: boundary.id,
                                            type: 'boundary',
                                            options: {
                                                id: boundary.id,
                                                type: 'boundary'
                                            }
                                        }}
                                    />
                                ))}

                                {/* Add existing inner boundaries */}
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
                                        options={{
                                            id: boundary.id,
                                            type: 'innerBoundary',
                                            options: {
                                                id: boundary.id,
                                                type: 'innerBoundary'
                                            }
                                        }}
                                    />
                                ))}

                                {/* Add existing routes */}
                                {floorData[selectedFloor]?.routes?.map((route) => (
                                    <React.Fragment key={route.id}>
                                        <Polyline
                                            positions={route.path.map(p => [p.y, p.x])}
                                            color={PATH_COLORS.primary}
                                            weight={6}
                                            opacity={1}
                                            smoothFactor={1}
                                            lineCap="round"
                                            lineJoin="round"
                                            options={{
                                                id: route.id,
                                                options: {
                                                    id: route.id
                                                }
                                            }}
                                        />
                                        {/* Add anchor points when in path creation mode */}
                                        {showPathAnchors && route.path.map((point, index) => (
                                            <CircleMarker
                                                key={`${route.id}_${index}`}
                                                center={[point.y, point.x]}
                                                radius={6}
                                                pathOptions={{
                                                    color: '#1976d2',
                                                    fillColor: '#fff',
                                                    fillOpacity: 1,
                                                    weight: 2
                                                }}
                                                eventHandlers={{
                                                    click: () => handleAnchorPointClick(point, route.id, index)
                                                }}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}

                                {/* EditControl */}
                                <EditControl
                                    ref={drawControlRef}
                                    position="topright"
                                    draw={{
                                        rectangle: false,
                                        polygon: drawingMode === 'polygon' || drawingMode === 'innerPolygon',
                                        polyline: drawingMode === 'polyline' && pathCreationStep === 'draw',
                                        circle: false,
                                        marker: drawingMode === 'marker',
                                        circlemarker: false
                                    }}
                                    edit={true}
                                    onCreated={handleCreated}
                                    onEdited={handleEdited}
                                    onDeleted={handleDeleted}
                                    onDrawStart={handleDrawStart}
                                    onDrawVertex={handleDrawVertex}
                                />
                            </FeatureGroup>
                        </MapContainer>
                    </>
                )}
            </div>
        </div>
    );
};

