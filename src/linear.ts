import { determination } from "./utils/determination";
import { ols } from "./utils/ols";
import { visitPoints } from "./utils/points";
import { PredictFunction, Accessor, DataPoint, Domain } from "./types";


export type LinearOutput =  [DataPoint, DataPoint] & {
  a: number;               // slope
  b: number;               // intercept
  predict: PredictFunction
  rSquared: number;
}
type  LinearRegressionRoot = (data: DataPoint[]) => LinearOutput


export interface LinearRegression extends LinearRegressionRoot {
  (data: DataPoint[]): LinearOutput;
  
  domain(): Domain;
  domain(arr: Domain): this;
  
  x(): Accessor;
  x(fn: Accessor): this;
  
  y(): Accessor;
  y(fn: Accessor): this;
}

export default function linear():LinearRegression {
  let x: Accessor = (d) => d[0],
    y: Accessor = (d) => d[1],
    domain: Domain;
  
  const linearRegression = function (data: DataPoint[]): LinearOutput {
    let n = 0,
      X = 0,  // sum of x
      Y = 0,  // sum of y
      XY = 0, // sum of x*y
      X2 = 0, // sum of x*x
      xmin = domain ? +domain[0] : Infinity,
      xmax = domain ? +domain[1] : -Infinity;
    
    visitPoints(data, x, y, (dx, dy) => {
      ++n;
      X += (dx - X) / n;
      Y += (dy - Y) / n;
      XY += (dx * dy - XY) / n;
      X2 += (dx * dx - X2) / n;
      
      if (!domain) {
        if (dx < xmin) xmin = dx;
        if (dx > xmax) xmax = dx;
      }
    });
    
    const [intercept, slope] = ols(X, Y, XY, X2);
    const fn = (xx: number) => slope * xx + intercept;
    
    const out = [[xmin, fn(xmin)], [xmax, fn(xmax)]] as LinearOutput;
    out.a = slope;
    out.b = intercept;
    out.predict = fn;
    out.rSquared = determination(data, x, y, Y, fn);
    
    return out;
  } as LinearRegression
  
  linearRegression.domain = function (arr) {
    if (!arguments.length) return domain;
    domain = arr;
    return linearRegression;
  } as LinearRegression["domain"];
  
  linearRegression.x = function (fn?: Accessor) {
    if (!arguments.length) return x;
    x = fn!;
    return linearRegression;
  } as LinearRegression["x"];
  
  linearRegression.y = function (fn?: Accessor) {
    if (!arguments.length) return y;
    y = fn!;
    return linearRegression;
  } as LinearRegression["y"];
  
  return linearRegression;
}
