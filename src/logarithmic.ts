import { determination } from "./utils/determination";
import { interpose } from "./utils/interpose";
import { ols } from "./utils/ols";
import { visitPoints } from "./utils/points";
import { PredictFunction, DataPoint, Accessor, Domain } from "./types";


type OutputRoot = [DataPoint, DataPoint]
type LogarithmicOutput = OutputRoot & {
  a: number;               // slope
  b: number;               // intercept
  predict: PredictFunction
  rSquared: number;
}
type LogarithmicRegressionRoot = (data: DataPoint[]) => LogarithmicOutput

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

export default function logarithmic(): LogarithmicRegression {
  let x: Accessor = d => d[0],
    y: Accessor = d => d[1],
    base: number = Math.E,
    domain: Domain;
  
  const logarithmicRegression = function logarithmicRegression(data: DataPoint[]): LogarithmicOutput {
    let n = 0,
      X = 0,
      Y = 0,
      XY = 0,
      X2 = 0,
      xmin = domain ? +domain[0] : Infinity,
      xmax = domain ? +domain[1] : -Infinity,
      lb = Math.log(base);
    
    visitPoints(data, x, y, (dx, dy) => {
      const lx = Math.log(dx) / lb;
      ++n;
      X += (lx - X) / n;
      Y += (dy - Y) / n;
      XY += (lx * dy - XY) / n;
      X2 += (lx * lx - X2) / n;
      
      if (!domain) {
        if (dx < xmin) xmin = dx;
        if (dx > xmax) xmax = dx;
      }
    });
    
    const [intercept, slope] = ols(X, Y, XY, X2);
    const fn = (xx: number) => slope * Math.log(xx) / lb + intercept;
    const out = interpose(xmin, xmax, fn) as LogarithmicOutput;
    
    out.a = slope;
    out.b = intercept;
    out.predict = fn;
    out.rSquared = determination(data, x, y, Y, fn);
    
    return out;
  } as LogarithmicRegression;
  
  logarithmicRegression.domain = function (arr?: [number, number]) {
    if (!arguments.length) return domain;
    domain = arr;
    return logarithmicRegression;
  } as LogarithmicRegression["domain"];
  
  logarithmicRegression.x = function (fn?: Accessor) {
    if (!arguments.length) return x;
    x = fn!;
    return logarithmicRegression;
  } as LogarithmicRegression["x"];
  
  logarithmicRegression.y = function (fn?: Accessor) {
    if (!arguments.length) return y;
    y = fn!;
    return logarithmicRegression;
  } as LogarithmicRegression["y"];
  
  logarithmicRegression.base = function (b?: number) {
    if (!arguments.length) return base;
    base = b!;
    return logarithmicRegression;
  } as LogarithmicRegression["base"];
  
  return logarithmicRegression;
}
