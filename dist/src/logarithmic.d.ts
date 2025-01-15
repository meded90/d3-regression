import { PredictFunction, DataPoint, Accessor, Domain } from "./types";
type OutputRoot = [DataPoint, DataPoint];
type LogarithmicOutput = OutputRoot & {
    a: number;
    b: number;
    predict: PredictFunction;
    rSquared: number;
};
type LogarithmicRegressionRoot = (data: DataPoint[]) => LogarithmicOutput;
export interface LogarithmicRegression extends LogarithmicRegressionRoot {
    (data: DataPoint[]): LogarithmicOutput;
    domain(): Domain;
    domain(arr: Domain): this;
    x(): Accessor;
    x(fn: Accessor): this;
    y(): Accessor;
    y(fn: Accessor): this;
    base(): number;
    base(b: number): this;
}
export default function logarithmic(): LogarithmicRegression;
export {};
