import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLng, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeaderButton from '../components/HeaderButton';

const markerIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface MapSelectionPageProps {
    onClose: () => void;
    onConfirm: (p1: LatLng, p2: LatLng) => void;
    title: string;
}

function MapInstanceSelector({ setMap }: { setMap: (map: LeafletMap) => void }) {
    // This helper sits inside the map to "grab" the actual map object as soon as it's ready.
    // It then gives that object to our main page so we can programmatically move the view 
    // (like when searching for a track).
    const map = useMap();
    useEffect(() => {
        setMap(map);
    }, [map, setMap]);
    return null;
}

export default function EndpointSelectionPage({ onClose, onConfirm, title }: MapSelectionPageProps) {
    const [points, setPoints] = useState<LatLng[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Reference to the Leaflet map instance to programmatically control view
    const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

    // Component to handle map click events
    function MapEvents() {
        useMapEvents({
            click(e) {
                if (points.length < 2) {
                    // Add new point if we have less than 2
                    setPoints([...points, e.latlng]);
                } else {
                    setPoints([e.latlng]);
                }
            },
        });
        return null;
    }

    // Geocoding search using Nominatim OpenStreetMap API
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery || !mapInstance) return;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data.length > 0) {
                // Move map to the first search result
                const newCenter: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                mapInstance.setView(newCenter, 16);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    function handleConfirmSelection() {
        onConfirm(points[0], points[1]);
        setPoints([]);
    }

    return (
        <div className="w-screen h-screen absolute flex flex-col z-30 bg-bg-1 overflow-hidden">
            <div className="h-header-h flex flex-row items-center justify-end bg-bg-1">
                <HeaderButton onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg text-icon-1 active:text-icon-active-1">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </HeaderButton>
            </div>

            <div className="flex flex-col flex-1 items-center justify-start p-p-md gap-gap-md relative bg-bg-1">
                <span className="text-text-1 text-3xl font-mono tracking-widest uppercase text-center">{title}</span>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="w-full max-w-md flex gap-gap-md">
                    <input type="text" placeholder="CITY, TRACK OR COUNTRY" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())} className="flex-1 bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"/>
                    <button type="submit" className="px-4 border border-border-1 text-text-1 font-mono text-xs uppercase hover:bg-bg-hover-1 active:bg-bg-active-1">
                        GO
                    </button>
                </form>
                
                {/* Map Container */}
                <div className="w-full flex-1 border border-border-1 relative overflow-hidden">
                    <MapContainer center={[45.621, 9.281]} zoom={15} className="h-full w-full">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri'/>
                        <MapInstanceSelector setMap={setMapInstance} />
                        <MapEvents />
                        
                        {points.map((p, i) => (
                            <Marker key={i} position={p} icon={markerIcon} />
                        ))}

                        {/* Draw a dashed line between the two points representing the gate */}
                        {points.length === 2 && (
                            <Polyline positions={points} color="var(--border-1)" weight={4} dashArray="10, 10" />
                        )}
                    </MapContainer>

                    {/* Action Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-1000 w-full max-w-xs px-4">
                        {points.length < 2 ? (
                            <div className="bg-bg-1 border border-border-1 text-text-1 p-3 text-center font-mono text-[10px] uppercase">
                                Tap {points.length === 0 ? "first" : "second"} endpoint
                            </div>
                        ) : (
                            <button onClick={handleConfirmSelection} 
                                className="w-full h-16 bg-bg-1 border border-border-1 text-text-1 font-mono font-bold uppercase tracking-widest hover:bg-bg-hover-1 active:bg-bg-active-1">
                                Confirm Gate
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}