// types/map/IRouteGeometry.ts
export interface IRouteGeometry {
    type: string; // typically "LineString" for GeoJSON
    coordinates: [number, number][]; // array of [longitude, latitude] pairs
  }