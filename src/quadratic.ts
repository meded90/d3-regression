import { determination } from "./utils/determination";
import { interpose } from "./utils/interpose";
import { points, visitPoints } from "./utils/points";
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


export default function quadratic(): QuadraticRegression {
  let x: Accessor = d => d[0],
    y: Accessor = d => d[1],
    domain: Domain;
  
  const quadraticRegression = function quadraticRegression(data: DataPoint[]): QuadraticOutput {
    const [xv, yv, ux, uy] = points(data, x, y);
    const n = xv.length;
    
    let X2 = 0,
      X3 = 0,
      X4 = 0,
      XY = 0,
      X2Y = 0,
      i, dx, dy, x2;
    
    for (i = 0; i < n;) {
      dx = xv[i];
      dy = yv[i++];
      x2 = dx * dx;
      X2 += (x2 - X2) / i;
      X3 += ((x2 * dx) - X3) / i;
      X4 += ((x2 * x2) - X4) / i;
      XY += ((dx * dy) - XY) / i;
      X2Y += ((x2 * dy) - X2Y) / i;
    }
    
    let Y = 0,
      n0 = 0,
      xmin = domain ? +domain[0] : Infinity,
      xmax = domain ? +domain[1] : -Infinity;
    
    visitPoints(data, x, y, (dx2, dy2) => {
      n0++;
      Y += (dy2 - Y) / n0;
      if (!domain) {
        if (dx2 < xmin) xmin = dx2;
        if (dx2 > xmax) xmax = dx2;
      }
    });
    
    const X2X2 = X4 - (X2 * X2);
    const d = (X2 * X2X2 - X3 * X3);
    const a = (X2Y * X2 - XY * X3) / d;
    const b = (XY * X2X2 - X2Y * X3) / d;
    const c = -a * X2;
    const fn = (xx: number) => {
      const shifted = xx - ux;
      return a * shifted * shifted + b * shifted + c + uy;
    };
    
    const out = interpose(xmin, xmax, fn) as QuadraticOutput;
    out.a = a;
    out.b = b - 2 * a * ux;
    out.c = c - b * ux + a * ux * ux + uy;
    out.predict = fn;
    out.rSquared = determination(data, x, y, Y, fn);
    
    return out;
  } as QuadraticRegression;
  
  quadraticRegression.domain = function (arr?: Domain) {
    if (!arguments.length) return domain;
    domain = arr;
    return quadraticRegression;
  } as QuadraticRegression["domain"];
  
  quadraticRegression.x = function (fn?: Accessor) {
    if (!arguments.length) return x;
    x = fn!;
    return quadraticRegression;
  } as QuadraticRegression["x"];
  
  quadraticRegression.y = function (fn?: Accessor) {
    if (!arguments.length) return y;
    y = fn!;
    return quadraticRegression;
  } as QuadraticRegression["y"];
  
  return quadraticRegression;
}
