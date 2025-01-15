import { PredictFunction, Domain, DataPoint, Accessor } from "./types";
export type ExponentialOutput = [DataPoint, DataPoint] & {
    a: number;
    b: number;
    predict: PredictFunction;
    rSquared: number;
};
type ExponentialRegressionRoot = (data: DataPoint[]) => ExponentialOutput;
export interface ExponentialRegression extends ExponentialRegressionRoot {
    (data: DataPoint[]): ExponentialOutput;
    domain(): Domain;
    domain(arr: Domain): this;
    x(): Accessor;
    x(fn: Accessor): this;
    y(): Accessor;
    y(fn: Accessor): this;
}
export default function exponential(): ExponentialRegression;
export {};
