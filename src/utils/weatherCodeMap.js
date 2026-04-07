/**
 * Open-Meteo uses WMO Weather interpretation codes (WW).
 * https://open-meteo.com/en/docs#weathervariables
 *
 * `icon` keys match WeatherPanel glyph switch — add new icons there if you extend this.
 */

/** @typedef {'clear' | 'mainly_clear' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder'} WeatherIconKey */

/**
 * @param {number} code
 * @returns {{ label: string, icon: WeatherIconKey }}
 */
export function interpretWeatherCode(code) {
  const c = Number(code)
  if (c === 0) return { label: 'Clear', icon: 'clear' }
  if (c === 1) return { label: 'Mainly clear', icon: 'mainly_clear' }
  if (c === 2) return { label: 'Partly cloudy', icon: 'partly' }
  if (c === 3) return { label: 'Overcast', icon: 'cloud' }
  if (c === 45 || c === 48) return { label: 'Fog', icon: 'fog' }
  if (c === 51) return { label: 'Light drizzle', icon: 'drizzle' }
  if (c === 53) return { label: 'Drizzle', icon: 'drizzle' }
  if (c === 55) return { label: 'Dense drizzle', icon: 'drizzle' }
  if (c === 56 || c === 57) return { label: 'Freezing drizzle', icon: 'drizzle' }
  if (c === 61) return { label: 'Light rain', icon: 'rain' }
  if (c === 63) return { label: 'Rain', icon: 'rain' }
  if (c === 65) return { label: 'Heavy rain', icon: 'rain' }
  if (c === 66 || c === 67) return { label: 'Freezing rain', icon: 'rain' }
  if (c === 71) return { label: 'Light snow', icon: 'snow' }
  if (c === 73) return { label: 'Snow', icon: 'snow' }
  if (c === 75) return { label: 'Heavy snow', icon: 'snow' }
  if (c === 77) return { label: 'Snow grains', icon: 'snow' }
  if (c === 80) return { label: 'Rain showers', icon: 'rain' }
  if (c === 81) return { label: 'Moderate showers', icon: 'rain' }
  if (c === 82) return { label: 'Heavy showers', icon: 'rain' }
  if (c === 85) return { label: 'Snow showers', icon: 'snow' }
  if (c === 86) return { label: 'Heavy snow showers', icon: 'snow' }
  if (c === 95) return { label: 'Thunderstorm', icon: 'thunder' }
  if (c === 96) return { label: 'Thunderstorm & hail', icon: 'thunder' }
  if (c === 99) return { label: 'Thunderstorm & hail', icon: 'thunder' }
  return { label: 'Unknown', icon: 'cloud' }
}
