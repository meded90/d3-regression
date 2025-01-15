import { PredictFunction, Accessor, DataPoint, Domain } from "./types";
export type LinearOutput = [DataPoint, DataPoint] & {
    a: number;
    b: number;
    predict: PredictFunction;
    rSquared: number;
};
type LinearRegressionRoot = (data: DataPoint[]) => LinearOutput;
export interface LinearRegression extends LinearRegressionRoot {
    (data: DataPoint[]): LinearOutput;
    domain(): Domain;
    domain(arr: Domain): this;
    x(): Accessor;
    x(fn: Accessor): this;
    y(): Accessor;
    y(fn: Accessor): this;
}
export default function linear(): LinearRegression;
export {};
