import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

const CollegeMap = () => {
  useEffect(() => {
    // Ensure map tiles load properly
    return () => {};
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer 
        center={[39.8283, -98.5795]} 
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />

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