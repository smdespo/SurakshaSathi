import React, { useState } from "react";

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const processLocationLocally = (latitude, longitude, accuracy) => {

    const dataPayload = {
      status: "success",
      latitude: latitude,
      longitude: longitude,
      accuracy: `${accuracy.toFixed(1)} meters`,
      updatedAt: new Date().toLocaleTimeString()
    };
    
    setProcessedData(dataPayload);
    
    console.log("=== User Location Update ===");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy:", accuracy);
  };

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);
    setProcessedData(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ latitude, longitude, accuracy });
        setLoading(false);
        processLocationLocally(latitude, longitude, accuracy);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError("Location access denied. Please enable permission in your browser settings.");
        } else {
          setError("Unable to retrieve location data.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Location Dashboard
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Click below to register and verify your current coordinates for your daily upload log.
        </p>

        <button
          onClick={handleGetLocation}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 ${
            loading
              ? "bg-red-400 text-red-100 cursor-not-allowed"
              : "bg-red-400 hover:bg-red-400 text-white shadow-sm active:scale-[0.99]"
          }`}
        >
          {loading ? "Updating Location..." : "Update Location"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {location && (
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <h3 className="font-semibold text-gray-700">Captured Coordinates:</h3>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>Lat: <span className="text-blue-600 font-semibold">{location.latitude.toFixed(5)}</span></div>
              <div>Long: <span className="text-blue-600 font-semibold">{location.longitude.toFixed(5)}</span></div>
              <div>Acc: <span className="text-blue-600 font-semibold">{location.accuracy.toFixed(1)}m</span></div>
            </div>
          </div>
        )}

        {processedData && (
          <div className="mt-4 space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700">Data Log Output:</h3>
            <div className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-lg overflow-x-auto">
              <pre>{JSON.stringify(processedData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;