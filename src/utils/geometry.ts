import { DataPoint } from "../types";

/**
 * Returns the angle of a line in degrees.
 */
export function angle(line: [DataPoint, DataPoint]): number {
  return (
    Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0]) *
    (180 / Math.PI)
  );
}

/**
 * Returns the midpoint of a line.
 */
export function midpoint(line: [DataPoint, DataPoint]): DataPoint {
  return [
    (line[0][0] + line[1][0]) / 2,
    (line[0][1] + line[1][1]) / 2
  ];
}
