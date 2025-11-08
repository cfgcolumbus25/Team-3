const fs = require("fs");
const fetch = require("node-fetch");

// Loading in the json file
const data = JSON.parse(fs.readFileSync("src/data/university_data.json", "utf-8"));

// Using Nominatim to geocode the zip codes
async function geocodeZip(zip, city = "", state = "") {
  const query = encodeURIComponent(`${zip}, ${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CollegeMapScript/1.0 (your-email@example.com)" }
    });
    const results = await res.json();
    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
      };
    }
  } catch (err) {
    console.error("Error geocoding", zip, err);
  }
  return null;
}

(async () => {
  for (let i = 0; i < data.length; i++) {
    const college = data[i];
    const coords = await geocodeZip(college.Zip, college.City, college.State);
    if (coords) {
      college.lat = coords.lat;
      college.lng = coords.lng;
      console.log(`Geocoded ${college["School Name"]}: ${coords.lat}, ${coords.lng}`);
    } else {
      console.log(`Could not geocode ${college["School Name"]}`);
    }
  }

  // Save new JSON
  fs.writeFileSync("university_data_geocoded.json", JSON.stringify(data, null, 2));
  console.log("Finished geocoding! Saved as university_data_geocoded.json");
})();
