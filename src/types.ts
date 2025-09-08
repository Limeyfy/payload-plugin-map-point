export type GeocoderProvider = 'mapbox' | 'nominatim'

export type MapPointPluginOptions = {
  defaultCenter?: [number, number]
  defaultZoom?: number
  geocoder?: {
    provider?: GeocoderProvider
    apiKey?: string // required for mapbox
    placeholder?: string
  }
}

