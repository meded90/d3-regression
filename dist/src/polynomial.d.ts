import { PredictFunction, Accessor, DataPoint, Domain } from "./types";
type PolynomialOutputRoot = [DataPoint, DataPoint];
export type PolynomialOutput = PolynomialOutputRoot & {
    coefficients: number[];
    predict: PredictFunction;
    rSquared: number;
};
interface PolynomialRegression {
    (data: DataPoint[]): PolynomialOutput;
    domain(): Domain;
    domain(domain?: Domain): PolynomialRegression;
    x(): Accessor;
    x(x: Accessor): PolynomialRegression;
    y(): Accessor;
    y(y: Accessor): PolynomialRegression;
    order(): number;
    order(order: number): PolynomialRegression;
}
export default function polynomial(): PolynomialRegression;
export {};
