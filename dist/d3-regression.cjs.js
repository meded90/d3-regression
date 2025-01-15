// https://github.com/HarryStevens/d3-regression#readme Version 1.3.10. Copyright 2025 Harry Stevens.
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Adapted from vega-statistics by Jeffrey Heer
 * License: https://github.com/vega/vega/blob/f058b099decad9db78301405dd0d2e9d8ba3d51a/LICENSE
 * Source: https://github.com/vega/vega/blob/f058b099decad9db78301405dd0d2e9d8ba3d51a/packages/vega-statistics/src/regression/points.js
 */
function points(data, x, y, sort) {
    data = data.filter(function (d, i) {
        var u = x(d, i), v = y(d, i);
        return u != null && isFinite(u) && v != null && isFinite(v);
    });
    if (sort) {
        data.sort(function (a, b) { return x(a) - x(b); });
    }
    var n = data.length, X = new Float64Array(n), Y = new Float64Array(n);
    // extract values, calculate means
    var ux = 0, uy = 0, xv, yv, d;
    for (var i = 0; i < n;) {
        d = data[i];
        X[i] = xv = +x(d, i, data);
        Y[i] = yv = +y(d, i, data);
        ++i;
        ux += (xv - ux) / i;
        uy += (yv - uy) / i;
    }
    // mean center the data
    for (var i = 0; i < n; ++i) {
        X[i] -= ux;
        Y[i] -= uy;
    }
    return [X, Y, ux, uy];
}
/**
 * Iterates over valid data points, invoking a callback for each.
 */
function visitPoints(data, x, y, cb) {
    var iterations = 0;
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var dx = +x(d, i, data);
        var dy = +y(d, i, data);
        if (dx != null && isFinite(dx) && dy != null && isFinite(dy)) {
            cb(dx, dy, iterations++);
        }
    }
}

/**
 * Given a dataset, x- and y-accessors, the mean center of the y-values (uY),
 * and a prediction function, return the coefficient of determination, R^2.
 */
function determination(data, x, y, uY, predict) {
    var SSE = 0, // Sum of Squared Errors
    SST = 0; // Total Sum of Squares
    visitPoints(data, x, y, function (dx, dy) {
        var sse = dy - predict(dx);
        var sst = dy - uY;
        SSE += sse * sse;
        SST += sst * sst;
    });
    return 1 - SSE / SST;
}

/**
 * Returns the angle of a line in degrees.
 */
function angle(line) {
    return (Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0]) *
        (180 / Math.PI));
}
/**
 * Returns the midpoint of a line.
 */
function midpoint(line) {
    return [
        (line[0][0] + line[1][0]) / 2,
        (line[0][1] + line[1][1]) / 2
    ];
}

/**
 * Given a start point (xmin), an end point (xmax),
 * and a prediction function, returns a smooth line.
 */
function interpose(xmin, xmax, predict) {
    var l = (Math.log(xmax - xmin) * Math.LOG10E + 1) | 0;
    var precision = Math.pow(10, -l / 2 - 1);
    var maxIter = 1e4;
    var points = [px(xmin), px(xmax)];
    var iter = 0;
    while (find(points) && iter < maxIter)
        ;
    return points;
    function px(x) {
        return [x, predict(x)];
    }
    function find(points) {
        iter++;
        var n = points.length;
        var found = false;
        for (var i = 0; i < n - 1; i++) {
            var p0 = points[i];
            var p1 = points[i + 1];
            var m = midpoint([p0, p1]);
            var mp = px(m[0]);
            var a0 = angle([p0, m]);
            var a1 = angle([p0, mp]);
            var a = Math.abs(a0 - a1);
            if (a > precision) {
                points.splice(i + 1, 0, mp);
                found = true;
            }
        }
        return found;
    }
}

/**
 * Ordinary Least Squares from vega-statistics by Jeffrey Heer
 * License: https://github.com/vega/vega/blob/f058b099decad9db78301405dd0d2e9d8ba3d51a/LICENSE
 * Source: https://github.com/vega/vega/blob/f058b099decad9db78301405dd0d2e9d8ba3d51a/packages/vega-statistics/src/regression/ols.js
 */
function ols(uX, uY, uXY, uX2) {
    var delta = uX2 - uX * uX, slope = Math.abs(delta) < 1e-24 ? 0 : (uXY - uX * uY) / delta, intercept = uY - slope * uX;
    return [intercept, slope];
}

function exponential() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, domain;
    var exponentialRegression = function (data) {
        var n = 0, Y = 0, YL = 0, XY = 0, XYL = 0, X2Y = 0, xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity;
        visitPoints(data, x, y, function (dx, dy) {
            var ly = Math.log(dy), xy = dx * dy;
            ++n;
            Y += (dy - Y) / n;
            XY += (xy - XY) / n;
            X2Y += (dx * xy - X2Y) / n;
            YL += (dy * ly - YL) / n;
            XYL += (xy * ly - XYL) / n;
            if (!domain) {
                if (dx < xmin)
                    xmin = dx;
                if (dx > xmax)
                    xmax = dx;
            }
        });
        var _a = ols(XY / Y, YL / Y, XYL / Y, X2Y / Y), a = _a[0], b = _a[1];
        a = Math.exp(a);
        var fn = function (xx) { return a * Math.exp(b * xx); };
        var out = interpose(xmin, xmax, fn);
        out.a = a;
        out.b = b;
        out.predict = fn;
        out.rSquared = determination(data, x, y, Y, fn);
        return out;
    };
    exponentialRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return exponentialRegression;
    };
    exponentialRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return exponentialRegression;
    };
    exponentialRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return exponentialRegression;
    };
    return exponentialRegression;
}

function linear() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, domain;
    var linearRegression = function (data) {
        var n = 0, X = 0, // sum of x
        Y = 0, // sum of y
        XY = 0, // sum of x*y
        X2 = 0, // sum of x*x
        xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity;
        visitPoints(data, x, y, function (dx, dy) {
            ++n;
            X += (dx - X) / n;
            Y += (dy - Y) / n;
            XY += (dx * dy - XY) / n;
            X2 += (dx * dx - X2) / n;
            if (!domain) {
                if (dx < xmin)
                    xmin = dx;
                if (dx > xmax)
                    xmax = dx;
            }
        });
        var _a = ols(X, Y, XY, X2), intercept = _a[0], slope = _a[1];
        var fn = function (xx) { return slope * xx + intercept; };
        var out = [[xmin, fn(xmin)], [xmax, fn(xmax)]];
        out.a = slope;
        out.b = intercept;
        out.predict = fn;
        out.rSquared = determination(data, x, y, Y, fn);
        return out;
    };
    linearRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return linearRegression;
    };
    linearRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return linearRegression;
    };
    linearRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return linearRegression;
    };
    return linearRegression;
}

/**
 * Returns the median value of an array of numbers.
 */
function median(arr) {
    arr.sort(function (a, b) { return a - b; });
    var i = arr.length / 2;
    return i % 1 === 0 ? (arr[i - 1] + arr[i]) / 2 : arr[Math.floor(i)];
}

// Adapted from science.js by Jason Davies
var maxiters = 2, epsilon = 1e-12;
function loess() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, bandwidth = .3;
    var loessRegression = function loessRegression(data) {
        var _a = points(data, x, y, true), xv = _a[0], yv = _a[1], ux = _a[2], uy = _a[3];
        var n = xv.length;
        var bw = Math.max(2, ~~(bandwidth * n)); // # of nearest neighbors
        var yhat = new Float64Array(n);
        var residuals = new Float64Array(n);
        var robustWeights = new Float64Array(n).fill(1);
        for (var iter = -1; ++iter <= maxiters;) {
            var interval = [0, bw - 1];
            for (var i = 0; i < n; ++i) {
                var dx = xv[i];
                var i0 = interval[0];
                var i1 = interval[1];
                var edge = (dx - xv[i0]) > (xv[i1] - dx) ? i0 : i1;
                var W = 0, X = 0, Y = 0, XY = 0, X2 = 0;
                var denom = 1 / Math.abs(xv[edge] - dx || 1);
                for (var k = i0; k <= i1; ++k) {
                    var xk = xv[k];
                    var yk = yv[k];
                    var w = tricube(Math.abs(dx - xk) * denom) * robustWeights[k];
                    var xkw = xk * w;
                    W += w;
                    X += xkw;
                    Y += yk * w;
                    XY += yk * xkw;
                    X2 += xk * xkw;
                }
                // Linear regression fit
                var _b = ols(X / W, Y / W, XY / W, X2 / W), a = _b[0], b = _b[1];
                yhat[i] = a + b * dx;
                residuals[i] = Math.abs(yv[i] - yhat[i]);
                updateInterval(xv, i + 1, interval);
            }
            if (iter === maxiters) {
                break;
            }
            var medianResidual = median(residuals);
            if (Math.abs(medianResidual) < epsilon)
                break;
            for (var i = 0, arg = void 0, w = void 0; i < n; ++i) {
                arg = residuals[i] / (6 * medianResidual);
                // Default to epsilon (rather than zero) for large deviations
                // Keeping weights tiny but non-zero prevents singularites
                robustWeights[i] = (arg >= 1) ? epsilon : ((w = 1 - arg * arg) * w);
            }
        }
        return output(xv, yhat, ux, uy);
    };
    loessRegression.bandwidth = function (bw) {
        if (!arguments.length)
            return bandwidth;
        bandwidth = bw;
        return loessRegression;
    };
    loessRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return loessRegression;
    };
    loessRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return loessRegression;
    };
    return loessRegression;
}
// Weighting kernel for local regression
function tricube(x) {
    return (x = 1 - x * x * x) * x * x;
}
// Advance sliding window interval of nearest neighbors
function updateInterval(xv, i, interval) {
    var val = xv[i], left = interval[0], right = interval[1] + 1;
    if (right >= xv.length)
        return;
    // Step right if distance to new right edge is <= distance to old left edge
    // Step when distance is equal to ensure movement over duplicate x values
    while (i > left && (xv[right] - val) <= (val - xv[left])) {
        interval[0] = ++left;
        interval[1] = right;
        ++right;
    }
}
// Generate smoothed output points
// Average points with repeated x values
function output(xv, yhat, ux, uy) {
    var n = xv.length, out = [];
    var i = 0, cnt = 0, prev = [], v;
    for (; i < n; ++i) {
        v = xv[i] + ux;
        if (prev[0] === v) {
            // Average output values via online update
            prev[1] += (yhat[i] - prev[1]) / (++cnt);
        }
        else {
            // Add new output point
            cnt = 0;
            prev[1] += uy;
            prev = [v, yhat[i]];
            out.push(prev);
        }
    }
    prev[1] += uy;
    return out;
}

function logarithmic() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, base = Math.E, domain;
    var logarithmicRegression = function logarithmicRegression(data) {
        var n = 0, X = 0, Y = 0, XY = 0, X2 = 0, xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity, lb = Math.log(base);
        visitPoints(data, x, y, function (dx, dy) {
            var lx = Math.log(dx) / lb;
            ++n;
            X += (lx - X) / n;
            Y += (dy - Y) / n;
            XY += (lx * dy - XY) / n;
            X2 += (lx * lx - X2) / n;
            if (!domain) {
                if (dx < xmin)
                    xmin = dx;
                if (dx > xmax)
                    xmax = dx;
            }
        });
        var _a = ols(X, Y, XY, X2), intercept = _a[0], slope = _a[1];
        var fn = function (xx) { return slope * Math.log(xx) / lb + intercept; };
        var out = interpose(xmin, xmax, fn);
        out.a = slope;
        out.b = intercept;
        out.predict = fn;
        out.rSquared = determination(data, x, y, Y, fn);
        return out;
    };
    logarithmicRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return logarithmicRegression;
    };
    logarithmicRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return logarithmicRegression;
    };
    logarithmicRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return logarithmicRegression;
    };
    logarithmicRegression.base = function (b) {
        if (!arguments.length)
            return base;
        base = b;
        return logarithmicRegression;
    };
    return logarithmicRegression;
}

function quadratic() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, domain;
    var quadraticRegression = function quadraticRegression(data) {
        var _a = points(data, x, y), xv = _a[0], yv = _a[1], ux = _a[2], uy = _a[3];
        var n = xv.length;
        var X2 = 0, X3 = 0, X4 = 0, XY = 0, X2Y = 0, i, dx, dy, x2;
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
        var Y = 0, n0 = 0, xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity;
        visitPoints(data, x, y, function (dx2, dy2) {
            n0++;
            Y += (dy2 - Y) / n0;
            if (!domain) {
                if (dx2 < xmin)
                    xmin = dx2;
                if (dx2 > xmax)
                    xmax = dx2;
            }
        });
        var X2X2 = X4 - (X2 * X2);
        var d = (X2 * X2X2 - X3 * X3);
        var a = (X2Y * X2 - XY * X3) / d;
        var b = (XY * X2X2 - X2Y * X3) / d;
        var c = -a * X2;
        var fn = function (xx) {
            var shifted = xx - ux;
            return a * shifted * shifted + b * shifted + c + uy;
        };
        var out = interpose(xmin, xmax, fn);
        out.a = a;
        out.b = b - 2 * a * ux;
        out.c = c - b * ux + a * ux * ux + uy;
        out.predict = fn;
        out.rSquared = determination(data, x, y, Y, fn);
        return out;
    };
    quadraticRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return quadraticRegression;
    };
    quadraticRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return quadraticRegression;
    };
    quadraticRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return quadraticRegression;
    };
    return quadraticRegression;
}

// Adapted from regression-js by Tom Alexander
function polynomial() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, order = 3, domain;
    var polynomialRegression = function polynomialRegression(data) {
        // Shortcut for lower-order polynomials:
        if (order === 1) {
            var o = linear().x(x).y(y).domain(domain)(data);
            var result = [
                o[0],
                o[1],
            ];
            result.coefficients = [o.b, o.a];
            result.predict = o.predict;
            result.rSquared = o.rSquared;
            return result;
        }
        if (order === 2) {
            var o = quadratic().x(x).y(y).domain(domain)(data);
            var result = [
                o[0],
                o[1],
            ];
            result.coefficients = [o.c, o.b, o.a];
            result.predict = o.predict;
            result.rSquared = o.rSquared;
            return result;
        }
        var _a = points(data, x, y), xv = _a[0], yv = _a[1], ux = _a[2], uy = _a[3];
        var n = xv.length;
        var k = order + 1;
        var lhs = [];
        var rhs = [];
        var Y = 0, n0 = 0, xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity;
        visitPoints(data, x, y, function (dx, dy) {
            n0++;
            Y += (dy - Y) / n0;
            if (!domain) {
                if (dx < xmin)
                    xmin = dx;
                if (dx > xmax)
                    xmax = dx;
            }
        });
        // Build normal equations
        for (var i = 0; i < k; i++) {
            // LHS
            var v = 0;
            for (var l = 0; l < n; l++) {
                v += Math.pow(xv[l], i) * yv[l];
            }
            lhs.push(v);
            // RHS
            var c = new Float64Array(k);
            for (var j = 0; j < k; j++) {
                var v2 = 0;
                for (var l = 0; l < n; l++) {
                    v2 += Math.pow(xv[l], i + j);
                }
                c[j] = v2;
            }
            rhs.push(c);
        }
        rhs.push(new Float64Array(lhs));
        var coef = gaussianElimination(rhs);
        var fn = function (xx) {
            var shifted = xx - ux;
            var val = uy + coef[0];
            for (var i = 1; i < k; i++) {
                val += coef[i] * Math.pow(shifted, i);
            }
            return val;
        };
        var out = interpose(xmin, xmax, fn);
        out.coefficients = uncenter(k, coef, -ux, uy);
        out.predict = fn;
        out.rSquared = determination(data, x, y, Y, fn);
        return out;
    };
    polynomialRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return polynomialRegression;
    };
    polynomialRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return polynomialRegression;
    };
    polynomialRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return polynomialRegression;
    };
    polynomialRegression.order = function (n) {
        if (!arguments.length)
            return order;
        order = n;
        return polynomialRegression;
    };
    return polynomialRegression;
}
function uncenter(k, a, x, y) {
    var z = new Array(k).fill(0);
    for (var i = k - 1; i >= 0; --i) {
        var v = a[i];
        z[i] += v;
        var c = 1;
        for (var j = 1; j <= i; ++j) {
            c *= (i + 1 - j) / j; // binomial coefficient
            z[i - j] += v * Math.pow(x, j) * c;
        }
    }
    // bias term
    z[0] += y;
    return z;
}
// Solve A * x = b using Gaussian elimination
function gaussianElimination(matrix) {
    var n = matrix.length - 1;
    var coef = new Array(n);
    for (var i = 0; i < n; i++) {
        var r = i;
        // find pivot row
        for (var j = i + 1; j < n; j++) {
            if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][r])) {
                r = j;
            }
        }
        // swap columns
        for (var k = i; k < n + 1; k++) {
            var t = matrix[k][i];
            matrix[k][i] = matrix[k][r];
            matrix[k][r] = t;
        }
        // reduce
        for (var j = i + 1; j < n; j++) {
            for (var k = n; k >= i; k--) {
                matrix[k][j] -= (matrix[k][i] * matrix[i][j]) / matrix[i][i];
            }
        }
    }
    for (var j = n - 1; j >= 0; j--) {
        var t = 0;
        for (var k = j + 1; k < n; k++) {
            t += matrix[k][j] * coef[k];
        }
        coef[j] = (matrix[n][j] - t) / matrix[j][j];
    }
    return coef;
}

function power() {
    var x = function (d) { return d[0]; }, y = function (d) { return d[1]; }, domain;
    var powerRegression = function powerRegression(data) {
        var n = 0, X = 0, Y = 0, XY = 0, X2 = 0, YS = 0, xmin = domain ? +domain[0] : Infinity, xmax = domain ? +domain[1] : -Infinity;
        visitPoints(data, x, y, function (dx, dy) {
            var lx = Math.log(dx), ly = Math.log(dy);
            ++n;
            X += (lx - X) / n;
            Y += (ly - Y) / n;
            XY += (lx * ly - XY) / n;
            X2 += (lx * lx - X2) / n;
            YS += (dy - YS) / n;
            if (!domain) {
                if (dx < xmin)
                    xmin = dx;
                if (dx > xmax)
                    xmax = dx;
            }
        });
        var _a = ols(X, Y, XY, X2), a = _a[0], b = _a[1];
        a = Math.exp(a);
        var fn = function (xx) { return a * Math.pow(xx, b); };
        var out = interpose(xmin, xmax, fn);
        out.a = a;
        out.b = b;
        out.predict = fn;
        out.rSquared = determination(data, x, y, YS, fn);
        return out;
    };
    powerRegression.domain = function (arr) {
        if (!arguments.length)
            return domain;
        domain = arr;
        return powerRegression;
    };
    powerRegression.x = function (fn) {
        if (!arguments.length)
            return x;
        x = fn;
        return powerRegression;
    };
    powerRegression.y = function (fn) {
        if (!arguments.length)
            return y;
        y = fn;
        return powerRegression;
    };
    return powerRegression;
}

exports.regressionExp = exponential;
exports.regressionLinear = linear;
exports.regressionLoess = loess;
exports.regressionLog = logarithmic;
exports.regressionPoly = polynomial;
exports.regressionPow = power;
exports.regressionQuad = quadratic;
