export default function wgs84ToUtmZone37N(lat, lon) {
  // Constants for UTM Zone 37N (WGS84)
  const a = 6378137; // Semi-major axis (meters)
  const f = 1 / 298.257223563; // Flattening
  const k0 = 0.9996; // UTM scale factor
  const E0 = 500000; // Easting offset
  const N0 = 0; // Northing offset (Northern Hemisphere)

  // WGS84 parameters
  const e = Math.sqrt(2 * f - f * f); // Eccentricity
  const e2 = e * e;
  const e_prime_squared = e2 / (1 - e2); // Corrected: Second eccentricity squared

  // Degree to radian
  const degToRad = Math.PI / 180;

  // Convert coordinates
  const latRad = lat * degToRad;
  const lonRad = lon * degToRad;

  // Correct central meridian for Zone 37N (39°E)
  const lon0 = 39 * degToRad; // Previously 33° (wrong zone)

  const deltaLon = lonRad - lon0;

  // Helper variables
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);

  // Radius of curvature in prime vertical
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = e_prime_squared * cosLat * cosLat; // Corrected: Use e_prime_squared
  const A = cosLat * deltaLon;

  // Meridian arc length
  const M = a * (
      (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * latRad
      - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * Math.sin(2*latRad)
      + (15*e2*e2/256 + 45*e2*e2*e2/1024) * Math.sin(4*latRad)
      - (35*e2*e2*e2/3072) * Math.sin(6*latRad)
  );

  // Calculate coordinates with corrected expansion terms
  const x = E0 + k0 * N * (
      A 
      + (1 - T + C) * A**3 / 6 
      + (5 - 18*T + T**2 + 72*C - 58*e_prime_squared) * A**5 / 120
  );

  const y = N0 + k0 * (
      M 
      + N * tanLat * (
          A**2 / 2 
          + (5 - T + 9*C + 4*C**2) * A**4 / 24 
          + (61 - 58*T + T**2 + 600*C - 330*e_prime_squared) * A**6 / 720
      )
  );

  return { x, y };
}