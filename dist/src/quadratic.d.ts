import { Accessor, DataPoint, PredictFunction, Domain } from "./types";
type QuadraticOutputRoot = [DataPoint, DataPoint];
interface QuadraticOutput extends QuadraticOutputRoot {
    a: number;
    b: number;
    c: number;
    predict: PredictFunction;
    rSquared: number;
}
type QuadraticRegressionRoot = (data: DataPoint[]) => QuadraticOutput;
interface QuadraticRegression extends QuadraticRegressionRoot {
    (data: DataPoint[]): QuadraticOutput;
    domain(): Domain;
    domain(domain?: Domain): QuadraticRegression;
    x(): Accessor;
    x(x: Accessor): QuadraticRegression;
    y(): Accessor;
    y(y: Accessor): QuadraticRegression;
}
export default function quadratic(): QuadraticRegression;
export {};
