import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapBuilder from '../components/MapBuilder';
import MapViewer2D from '../components/MapViewer2D';
import './App.css';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/builder" element={<MapBuilder />} />
				<Route path="/viewer" element={<MapViewer2D />} />
				<Route path="/" element={<Navigate to="/builder" replace />} />
			</Routes>
		</Router>
	);
}

export default App;
