import { determination } from "./utils/determination";
import { interpose } from "./utils/interpose";
import { ols } from "./utils/ols";
import { visitPoints } from "./utils/points";
import { PredictFunction, DataPoint, Accessor, Domain } from "./types";

type PowerOutputRoot = [DataPoint, DataPoint];

interface PowerOutput extends PowerOutputRoot {
  a: number;
  b: number;
  predict: PredictFunction;
  rSquared: number;
}

type PowerRegressionRoot = (data: DataPoint[]) => PowerOutput;
interface PowerRegression extends PowerRegressionRoot{
  (data: DataPoint[]): PowerOutput;
  domain(): Domain;
  domain(domain?: Domain): PowerRegression;
  
  x(): Accessor;
  x(x: Accessor): PowerRegression;
  
  y(): Accessor;
  y(y: Accessor): PowerRegression;
}

export default function power(): PowerRegression {
  let x: Accessor = d => d[0],
      y: Accessor = d => d[1],
      domain: Domain;
  
  const powerRegression =function powerRegression(data: DataPoint[]): PowerOutput {
    let n = 0,
        X = 0,
        Y = 0,
        XY = 0,
        X2 = 0,
        YS = 0,
        xmin = domain ? +domain[0] : Infinity,
        xmax = domain ? +domain[1] : -Infinity;

    visitPoints(data, x, y, (dx, dy) => {
      const lx = Math.log(dx),
            ly = Math.log(dy);
      ++n;
      X += (lx - X) / n;
      Y += (ly - Y) / n;
      XY += (lx * ly - XY) / n;
      X2 += (lx * lx - X2) / n;
      YS += (dy - YS) / n;

      if (!domain) {
        if (dx < xmin) xmin = dx;
        if (dx > xmax) xmax = dx;
      }
    });

    let [a, b] = ols(X, Y, XY, X2);
    a = Math.exp(a);

    const fn = (xx: number) => a * Math.pow(xx, b);
    const out = interpose(xmin, xmax, fn) as PowerOutput;

    out.a = a;
    out.b = b;
    out.predict = fn;
    out.rSquared = determination(data, x, y, YS, fn);

    return out;
  } as PowerRegression;

  powerRegression.domain = function(arr?: Domain) {
    if (!arguments.length) return domain;
    domain = arr;
    return powerRegression;
  } as PowerRegression["domain"];

  powerRegression.x = function(fn?: Accessor) {
    if (!arguments.length) return x;
    x = fn!;
    return powerRegression;
  } as PowerRegression["x"];

  powerRegression.y = function(fn?: Accessor) {
    if (!arguments.length) return y;
    y = fn!;
    return powerRegression;
  } as PowerRegression["y"];

  return powerRegression;
}
