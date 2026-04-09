import {
  IconCloud,
  IconSun,
  IconRain,
  IconMainlyClear,
  IconPartlyCloudy,
  IconFog,
  IconDrizzle,
  IconSnow,
  IconThunder,
} from './Icons'

/** @param {{ icon: string, className?: string }} props */
export function WeatherGlyph({ icon, className = 'hq-weather__glyph' }) {
  const c = { className }
  switch (icon) {
    case 'clear':
      return <IconSun {...c} />
    case 'mainly_clear':
      return <IconMainlyClear {...c} />
    case 'partly':
      return <IconPartlyCloudy {...c} />
    case 'fog':
      return <IconFog {...c} />
    case 'drizzle':
      return <IconDrizzle {...c} />
    case 'rain':
      return <IconRain {...c} />
    case 'snow':
      return <IconSnow {...c} />
    case 'thunder':
      return <IconThunder {...c} />
    case 'cloud':
    default:
      return <IconCloud {...c} />
  }
}
