import { determination } from "./utils/determination";
import { interpose } from "./utils/interpose";
import { visitPoints } from "./utils/points";
import { PredictFunction, Domain, DataPoint, Accessor } from "./types";

/**
 * Sigmoidal (logistic) regression of the form:
 *   f(x) = C + A / (1 + exp(-B * (x - M)))
 * where A, B, C, M are parameters found via gradient descent.
 */
export type SigmoidalOutput = [DataPoint, DataPoint] & {
  A: number;
  B: number;
  C: number;
  M: number;
  predict: PredictFunction;
  rSquared: number;
};

export interface SigmoidalRegression<T> {
  (data: T[]): SigmoidalOutput;
  domain(): Domain;
  domain(domain: Domain): this;
  x(): Accessor<T>;
  x(fn: Accessor<T>): this;
  y(): Accessor<T>;
  y(fn: Accessor<T>): this;
}

export default function sigmoidal<T = DataPoint>(): SigmoidalRegression<T> {
  let x: Accessor<T> = (d: T) => (d as DataPoint)[0],
      y: Accessor<T> = (d: T) => (d as DataPoint)[1],
      domain: Domain,
      maxIter = 2000,
      alpha = 1e-4; // learning rate

  function sigmoidalRegression(data: T[]): SigmoidalOutput {
    let n = 0,
        Xmin = domain ? +domain[0] : Infinity,
        Xmax = domain ? +domain[1] : -Infinity,
        Ymin = Infinity,
        Ymax = -Infinity,
        sumY = 0;

    // Gather data & track min/max for domain if not preset
    visitPoints(data, x, y, (dx, dy) => {
      n++;
      sumY += dy;
      if (!domain) {
        if (dx < Xmin) Xmin = dx;
        if (dx > Xmax) Xmax = dx;
      }
      if (dy < Ymin) Ymin = dy;
      if (dy > Ymax) Ymax = dy;
    });

    if (!domain && (Xmin === Infinity || Xmax === -Infinity)) {
      Xmin = 0;
      Xmax = 1;
    }

    // Initialize parameters
    let A = Ymax - Ymin;   // amplitude
    let B = 1;             // logistic slope
    let C = Ymin;          // baseline offset
    let M = (Xmin + Xmax) / 2; // midpoint

    // Predict function
    function f(xx: number) {
      return C + A / (1 + Math.exp(-B * (xx - M)));
    }

    // Gradient Descent
    for (let iter = 0; iter < maxIter; iter++) {
      let dA = 0, dB = 0, dC = 0, dM = 0;
      visitPoints(data, x, y, (dx, dy) => {
        const yhat = f(dx);
        const err = dy - yhat;
        const ex = Math.exp(-B * (dx - M));
        const g = 1 / (1 + ex); // logistic
        // partial derivatives
        const df_dA = g;
        const df_dC = 1;
        const df_dB = A * g * (1 - g) * (dx - M);
        // Note the negative sign for M:
        const df_dM = -A * B * g * (1 - g);

        const factor = -2 * err;
        dA += factor * df_dA;
        dB += factor * df_dB;
        dC += factor * df_dC;
        dM += factor * df_dM;
      });
      A -= alpha * (dA / n);
      B -= alpha * (dB / n);
      C -= alpha * (dC / n);
      M -= alpha * (dM / n);
    }

    const predict = (xx: number) => C + A / (1 + Math.exp(-B * (xx - M)));
    const out = interpose(Xmin, Xmax, predict) as SigmoidalOutput;
    out.A = A;
    out.B = B;
    out.C = C;
    out.M = M;
    out.predict = predict;

    // R^2
    const meanY = sumY / n;
    out.rSquared = determination(data, x, y, meanY, predict);
    return out;
  }

  sigmoidalRegression.domain = function(arr?: Domain): any {
    if (!arguments.length) return domain;
    domain = arr;
    return sigmoidalRegression;
  };

  sigmoidalRegression.x = function(fn?: Accessor<T>): any {
    if (!arguments.length) return x;
    x = fn!;
    return sigmoidalRegression;
  };

  sigmoidalRegression.y = function(fn?: Accessor<T>): any {
    if (!arguments.length) return y;
    y = fn!;
    return sigmoidalRegression;
  };

  return sigmoidalRegression;
}