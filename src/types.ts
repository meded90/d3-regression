
export type DataPoint = [number, number];
export type Accessor = (d: DataPoint, i?: number, data?: DataPoint[]) => number;
export type PredictFunction = (x: number) => number;
export type Domain = [number, number] | undefined;
