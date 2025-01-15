import { determination } from "./utils/determination";
import { interpose } from "./utils/interpose";
import { ols } from "./utils/ols";
import { visitPoints } from "./utils/points";
import { PredictFunction, Domain, DataPoint, Accessor } from "./types";


export type ExponentialOutput = [DataPoint, DataPoint] & {
  a: number;               // slope
  b: number;               // intercept
  predict: PredictFunction
  rSquared: number;
}

type ExponentialRegressionRoot = (data: DataPoint[]) => ExponentialOutput

export interface ExponentialRegression extends ExponentialRegressionRoot {
  (data: DataPoint[]): ExponentialOutput;
  
  domain(): Domain;
  domain(arr: Domain): this;
  
  x(): Accessor;
  x(fn: Accessor): this;
  
  y(): Accessor;
  y(fn: Accessor): this;
}

export default function exponential(): ExponentialRegression {
  let x: Accessor = d => d[0],
    y: Accessor = d => d[1],
    domain: Domain;
  
  const exponentialRegression = function (data: DataPoint[]): ExponentialOutput {
    let n = 0,
      Y = 0,
      YL = 0,
      XY = 0,
      XYL = 0,
      X2Y = 0,
      xmin = domain ? +domain[0] : Infinity,
      xmax = domain ? +domain[1] : -Infinity;
    
    visitPoints(data, x, y, (dx, dy) => {
      const ly = Math.log(dy),
        xy = dx * dy;
      ++n;
      Y += (dy - Y) / n;
      XY += (xy - XY) / n;
      X2Y += (dx * xy - X2Y) / n;
      YL += (dy * ly - YL) / n;
      XYL += (xy * ly - XYL) / n;
      
      if (!domain) {
        if (dx < xmin) xmin = dx;
        if (dx > xmax) xmax = dx;
      }
    });
    
    let [a, b] = ols(XY / Y, YL / Y, XYL / Y, X2Y / Y);
    a = Math.exp(a);
    
    const fn = (xx: number) => a * Math.exp(b * xx);
    const out = <ExponentialOutput>interpose(xmin, xmax, fn);
    
    out.a = a;
    out.b = b;
    out.predict = fn;
    out.rSquared = determination(data, x, y, Y, fn);
    
    return out;
  } as ExponentialRegression;
  
  exponentialRegression.domain = function (arr) {
    if (!arguments.length) return domain;
    domain = arr;
    return exponentialRegression;
  } as ExponentialRegression["domain"];
  
  exponentialRegression.x = function (fn?: Accessor) {
    if (!arguments.length) return x;
    x = fn!;
    return exponentialRegression;
  } as ExponentialRegression["x"];
  
  exponentialRegression.y = function (fn?: Accessor) {
    if (!arguments.length) return y;
    y = fn!;
    return exponentialRegression;
  } as ExponentialRegression["y"];
  
  return exponentialRegression;
}
