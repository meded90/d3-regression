import { PredictFunction, DataPoint, Accessor, Domain } from "./types";
type PowerOutputRoot = [DataPoint, DataPoint];
interface PowerOutput extends PowerOutputRoot {
    a: number;
    b: number;
    predict: PredictFunction;
    rSquared: number;
}
type PowerRegressionRoot = (data: DataPoint[]) => PowerOutput;
interface PowerRegression extends PowerRegressionRoot {
    (data: DataPoint[]): PowerOutput;
    domain(): Domain;
    domain(domain?: Domain): PowerRegression;
    x(): Accessor;
    x(x: Accessor): PowerRegression;
    y(): Accessor;
    y(y: Accessor): PowerRegression;
}
export default function power(): PowerRegression;
export {};
