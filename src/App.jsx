import {
	MapContainer,
	TileLayer,
	FeatureGroup,
	useMapEvents,
	Marker,
	Popup
} from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { useState, useEffect } from "react"
import L from "leaflet"

// SVG icons
const vendingMachineIcon = new L.DivIcon({
	html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="red" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><rect width="2" height="8" x="11" y="4"/><rect width="2" height="2" x="11" y="14"/><rect width="2" height="2" x="11" y="17"/></svg>',
	className: '',
	iconSize: [24, 24],
	iconAnchor: [12, 24],
})

const stairsIcon = new L.DivIcon({
	html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="blue" viewBox="0 0 24 24"><path d="M4 20h16v-2H6v-2h4v-2h4v-2h4v-2H10v2H6v2H4v6z"/></svg>',
	className: '',
	iconSize: [24, 24],
	iconAnchor: [12, 24],
})

const benchIcon = new L.DivIcon({
	html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="green" viewBox="0 0 24 24"><path d="M4 10h16v2H4v-2zm0 4h16v2H4v-2zm1 4h2v2H5v-2zm12 0h2v2h-2v-2z"/></svg>',
	className: '',
	iconSize: [24, 24],
	iconAnchor: [12, 24],
})

// Capture map clicks
const ClickHandler = ({ addLatLng, selectedType }) => {
	useMapEvents({
		click(e) {
			if (selectedType) {
				addLatLng([e.latlng.lat, e.latlng.lng], selectedType)
			}
		},
	})
	return null
}

const App = () => {
	const [objects, setObjects] = useState([
		{ latlng: [26.450076, 80.193008], type: "stairs" },
		{ latlng: [26.450043, 80.192989], type: "stairs" },
		{ latlng: [26.449967, 80.192747], type: "bench" },
		{ latlng: [26.449871, 80.192842], type: "bench" },
		{ latlng: [26.449808, 80.192913], type: "bench" },
		{ latlng: [26.450028, 80.192853], type: "vendingMachine" },
		{ latlng: [26.450133, 80.193053], type: "vendingMachine" }
	])

	const [polygons, setPolygons] = useState([]) // NEW: Store drawn polygons
	const [mapType, setMapType] = useState("normal")
	const [selectedType, setSelectedType] = useState(null)

	const addLatLng = (latlng, type) => {
		setObjects((prev) => [...prev, { latlng, type }])
	}

	useEffect(() => {
		console.log("Markers:", objects)
	}, [objects])

	useEffect(() => {
		console.log("Polygons:", polygons)
	}, [polygons])

	const getIconByType = (type) => {
		switch (type) {
			case "vendingMachine":
				return vendingMachineIcon
			case "stairs":
				return stairsIcon
			case "bench":
				return benchIcon
			default:
				return null
		}
	}

	return (
		<div>
			<div style={{ position: "absolute", zIndex: 1000, top: 10, left: 10, background: "white", padding: "10px", borderRadius: "8px" }}>
				<button onClick={() => setSelectedType("vendingMachine")}>Add Vending Machine</button>
				<button onClick={() => setSelectedType("stairs")} style={{ marginLeft: "10px" }}>Add Stairs</button>
				<button onClick={() => setSelectedType("bench")} style={{ marginLeft: "10px" }}>Add Bench</button>
				<button
					onClick={() => setMapType((prev) => prev === "normal" ? "satellite" : "normal")}
					style={{ marginLeft: "10px" }}>
					{mapType === "normal" ? "Switch to Satellite" : "Switch to Normal"}
				</button>
				{selectedType && <span style={{ marginLeft: "10px", fontWeight: "bold" }}>Selected: {selectedType}</span>}
			</div>

			<MapContainer center={[26.4494, 80.1935]} zoom={18} maxZoom={30} style={{ height: "100vh", width: "100vw" }}>
				{mapType === "normal" ? (
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution="&copy; OpenStreetMap contributors"
					/>
				) : (
					<TileLayer
						url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
						attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
					/>
				)}

				<FeatureGroup>
					<EditControl
						position="topright"
						onCreated={(e) => {
							const layer = e.layer
							const geojson = layer.toGeoJSON()
							setPolygons((prev) => [...prev, geojson])
							console.log("Created shape GeoJSON:", geojson)
						}}
						draw={{
							rectangle: true,
							polygon: true,
							polyline: true,
							circle: false,
							marker: false, // we already handle markers
						}}
					/>
				</FeatureGroup>

				{objects.map((obj, i) => (
					<Marker key={i} position={obj.latlng} icon={getIconByType(obj.type)}>
						<Popup>{obj.type}</Popup>
					</Marker>
				))}

				<ClickHandler addLatLng={addLatLng} selectedType={selectedType} />
			</MapContainer>

			<div style={{ position: "absolute", bottom: 10, left: 10, background: "white", padding: "10px", borderRadius: "8px", maxHeight: "200px", overflowY: "scroll", width: "300px" }}>
				<h4>Saved Polygons:</h4>
				<pre style={{ fontSize: "10px" }}>
					{JSON.stringify(polygons, null, 2)}
				</pre>
			</div>
		</div>
	)
}

export default App
