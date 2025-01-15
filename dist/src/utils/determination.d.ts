import { Accessor, DataPoint, PredictFunction } from "../types";
/**
 * Given a dataset, x- and y-accessors, the mean center of the y-values (uY),
 * and a prediction function, return the coefficient of determination, R^2.
 */
export declare function determination(data: DataPoint[], x: Accessor, y: Accessor, uY: number, predict: PredictFunction): number;
