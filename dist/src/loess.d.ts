import { Accessor, DataPoint } from "./types";
type LoessRegressionRoot = (data: DataPoint[]) => Array<DataPoint>;
export interface LoessRegression extends LoessRegressionRoot {
    (data: DataPoint[]): Array<DataPoint>;
    bandwidth(): number;
    bandwidth(bw: number): this;
    x(): Accessor;
    x(fn: Accessor): this;
    y(): Accessor;
    y(fn: Accessor): this;
}
export default function loess(): LoessRegression;
export {};
