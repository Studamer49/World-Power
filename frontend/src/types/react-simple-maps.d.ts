declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string | Function;
    projectionConfig?: Record<string, any>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }

  export interface GeographiesProps {
    geography?: string | object;
    children?: (data: { geographies: any[] }) => React.ReactNode;
    parseGeographies?: (geos: any[]) => any[];
    [key: string]: any;
  }

  export interface GeographyProps {
    geography?: any;
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    onClick?: (e: any) => void;
    onDoubleClick?: (e: any) => void;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: Record<string, React.CSSProperties>;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface MarkerProps {
    coordinates?: [number, number];
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    onClick?: (e: any) => void;
    onDoubleClick?: (e: any) => void;
    style?: Record<string, React.CSSProperties>;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    [key: string]: any;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Graticule: React.FC<any>;
  export const Sphere: React.FC<any>;
  export const Annotation: React.FC<any>;
  export const Line: React.FC<any>;
}
