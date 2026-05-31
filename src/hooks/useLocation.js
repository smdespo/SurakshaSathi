import { useState, useCallback } from "react";

/**
 * Tries Capacitor Geolocation first (works in native app),
 * falls back to browser navigator.geolocation (works in web).
 *
 * Usage:
 *   const { location, loading, error, fetchLocation } = useLocation();
 */
export function useLocation() {
  const [location, setLocation] = useState(null); // { latitude, longitude, accuracy }
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ── Try Capacitor first ──
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setLocation({
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy:  pos.coords.accuracy,
      });
      setLoading(false);
      return;
    } catch (_) {
      // Capacitor not available — fall through to browser API
    }

    // ── Browser fallback ──
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location access denied. Please enable permissions."
            : "Unable to retrieve GPS coordinates."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { location, loading, error, fetchLocation };
}