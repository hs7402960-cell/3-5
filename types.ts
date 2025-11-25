export interface Axes {
  x: number;
  y: number;
  z: number;
  a: number; // Tilt (degrees)
  b: number; // Rotation (degrees) - Formerly C
}

export interface SimulationState {
  isScanning: boolean;
  scannedPoints: Float32Array; // Flattened xyz array
  axes: Axes;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}