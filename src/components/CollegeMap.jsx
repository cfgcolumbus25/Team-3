import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import collegesData from "../data/university_data_geocoded.json";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to update map center and zoom when zipcode or distance changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [map, center, zoom]);
  return null;
}

// Convert distance in miles to appropriate zoom level
function calculateZoomFromDistance(distance) {
  if (distance >= 400) return 5;
  if (distance >= 200) return 6;
  if (distance >= 100) return 7;
  if (distance >= 50) return 8;
  if (distance >= 25) return 9;
  if (distance >= 10) return 10;
  if (distance >= 5) return 11;
  if (distance >= 2) return 12;
  if (distance >= 1) return 13;
  return 14;
}

const CollegeMap = ({ zipCode, distance = 100, selectedExam, selectedScore }) => {
  const [zipCoordinates, setZipCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  //Geocode ZIP code to coordinates
  useEffect(() => {
    if (!zipCode) {
      setIsLoading(false);
      return;
    }

    const geocodeZipCode = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
          { headers: { 'User-Agent': 'CollegeMap/1.0' } }
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setZipCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setZipCoordinates([39.8283, -98.5795]);
        }
      } catch (error) {
        console.error("Error geocoding ZIP code:", error);
        setZipCoordinates([39.8283, -98.5795]);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeZipCode();
  }, [zipCode]);

  const mapCenter = zipCoordinates || [39.8283, -98.5795];
  const mapZoom = useMemo(() => {
    return zipCoordinates ? calculateZoomFromDistance(distance) : 4;
  }, [zipCoordinates, distance]);

  //Filtering logic
  const filteredColleges = useMemo(() => {
    return collegesData.filter((college) => {
      // If no exam is selected, show all of the options
      if (!selectedExam) return true;

      const examScore = college[selectedExam];

      if (examScore === null || examScore === undefined) return false;

      // If a score filter exists, require that the college’s required score <= user’s score
      if (selectedScore && Number.isFinite(Number(selectedScore))) {
        return Number(examScore) <= Number(selectedScore);
      }

      return true;
    });
  }, [collegesData, selectedExam, selectedScore]);

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

        {/* Marker for ZIP code */}
        {zipCoordinates && (
          <Marker position={zipCoordinates}>
            <Popup>
              <b>Your Location</b><br />
              ZIP Code: {zipCode}
            </Popup>
          </Marker>
        )}

        {/* Filtered college markers */}
        {filteredColleges.map((college, idx) =>
          college.lat && college.lng ? (
            <Marker key={idx} position={[college.lat, college.lng]}>
              <Popup>
                <b>{college["School Name"]}</b><br />
                {college.City}, {college.State}<br />
                {selectedExam && college[selectedExam] !== null && (
                  <>
                    <hr />
                    <b>{selectedExam}</b><br />
                    Required Score: {college[selectedExam]}
                  </>
                )}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default CollegeMap;