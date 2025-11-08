import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import collegesData from "../data/university_data_geocoded.json";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to update map center and zoom when zipcode or distance changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    // Use setView with animate option for smooth transitions
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [map, center, zoom]);
  return null;
}

// Convert distance in miles to appropriate zoom level
function calculateZoomFromDistance(distance) {
  // Zoom levels: smaller number = zoomed out, larger number = zoomed in
  // Rough mapping based on typical map scales
  if (distance >= 400) return 5;  // Very zoomed out - multiple states
  if (distance >= 200) return 6;  // State/region level
  if (distance >= 100) return 7;  // Large area
  if (distance >= 50) return 8;   // Medium area
  if (distance >= 25) return 9;   // Smaller area
  if (distance >= 10) return 10;  // Local area
  if (distance >= 5) return 11;   // Neighborhood level
  if (distance >= 2) return 12;   // Very local
  if (distance >= 1) return 13;   // Street level
  return 14; // Very close - building level
}

const CollegeMap = ({ zipCode, distance = 100 }) => {
  const [zipCoordinates, setZipCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!zipCode) {
      setIsLoading(false);
      return;
    }

    // Geocode ZIP code to get coordinates
    const geocodeZipCode = async () => {
      setIsLoading(true);
      try {
        // Use OpenStreetMap Nominatim API for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'CollegeMap/1.0'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setZipCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          // Fallback to US center if geocoding fails
          setZipCoordinates([39.8283, -98.5795]);
        }
      } catch (error) {
        console.error("Error geocoding ZIP code:", error);
        // Fallback to US center on error
        setZipCoordinates([39.8283, -98.5795]);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeZipCode();
  }, [zipCode]);

  // Default center (US center)
  const mapCenter = zipCoordinates || [39.8283, -98.5795];
  // Calculate zoom based on distance, or default zoom if no coordinates
  // Use useMemo to ensure zoom recalculates when distance changes
  const mapZoom = useMemo(() => {
    return zipCoordinates ? calculateZoomFromDistance(distance) : 4;
  }, [zipCoordinates, distance]);

  if (isLoading) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />

        {/* Marker for the ZIP code location */}
        {zipCoordinates && (
          <Marker position={zipCoordinates}>
            <Popup>
              <b>Your Location</b><br />
              ZIP Code: {zipCode}
            </Popup>
          </Marker>
        )}

        {/* College markers */}
        {collegesData.map((college, idx) =>
          college.lat && college.lng ? (
            <Marker key={idx} position={[college.lat, college.lng]}>
              <Popup>
                <b>{college["School Name"]}</b><br />
                {college.City}, {college.State}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default CollegeMap;