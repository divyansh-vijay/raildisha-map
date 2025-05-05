import React, { useRef, useEffect } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"

const MapComponent = () => {
	const mapRef = useRef(null)

	useEffect(() => {
		const map = L.map(mapRef.current, {
			center: [51.505, -0.09],
			zoom: 13,
			scrollWheelZoom: false,
		})

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map)

		return () => {
			map.remove()
		}
	}, [])

	return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />
}

export default MapComponent
