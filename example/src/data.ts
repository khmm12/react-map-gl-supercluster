export type Place = {
  id: string
  name: string
  city: string
  longitude: number
  latitude: number
  attendees: number
  color: string
}

type CitySeed = {
  city: string
  longitude: number
  latitude: number
  count: number
  spread: number
  color: string
}

const CITY_SEEDS: CitySeed[] = [
  { city: 'Amsterdam', longitude: 4.9041, latitude: 52.3676, count: 42, spread: 0.28, color: '#009688' },
  { city: 'Barcelona', longitude: 2.1734, latitude: 41.3851, count: 46, spread: 0.3, color: '#f97316' },
  { city: 'Berlin', longitude: 13.405, latitude: 52.52, count: 58, spread: 0.34, color: '#ef4444' },
  { city: 'Lisbon', longitude: -9.1393, latitude: 38.7223, count: 28, spread: 0.26, color: '#0ea5e9' },
  { city: 'London', longitude: -0.1276, latitude: 51.5072, count: 52, spread: 0.32, color: '#7c3aed' },
  { city: 'Madrid', longitude: -3.7038, latitude: 40.4168, count: 36, spread: 0.28, color: '#eab308' },
  { city: 'Milan', longitude: 9.19, latitude: 45.4642, count: 31, spread: 0.25, color: '#06b6d4' },
  { city: 'Paris', longitude: 2.3522, latitude: 48.8566, count: 64, spread: 0.35, color: '#ec4899' },
  { city: 'Prague', longitude: 14.4378, latitude: 50.0755, count: 25, spread: 0.24, color: '#84cc16' },
  { city: 'Stockholm', longitude: 18.0686, latitude: 59.3293, count: 22, spread: 0.3, color: '#14b8a6' },
  { city: 'Vienna', longitude: 16.3738, latitude: 48.2082, count: 29, spread: 0.25, color: '#f43f5e' },
  { city: 'Warsaw', longitude: 21.0122, latitude: 52.2297, count: 33, spread: 0.3, color: '#2563eb' },
]

export const places: Place[] = CITY_SEEDS.flatMap((seed, cityIndex) =>
  Array.from({ length: seed.count }, (_, index) => {
    const angle = (index * 137.508 + cityIndex * 29) * (Math.PI / 180)
    const radius = seed.spread * (0.2 + ((index * 37) % 100) / 100)
    const longitude = seed.longitude + Math.cos(angle) * radius * 1.35
    const latitude = seed.latitude + Math.sin(angle) * radius

    return {
      id: `${seed.city.toLowerCase()}-${index}`,
      name: `${seed.city} meetup ${index + 1}`,
      city: seed.city,
      longitude,
      latitude,
      attendees: 12 + ((index * 17 + cityIndex * 13) % 180),
      color: seed.color,
    }
  }),
)
