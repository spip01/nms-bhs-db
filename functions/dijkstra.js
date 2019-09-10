"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({
                    __proto__: []
                }
                instanceof Array && function (d, b) {
                    d.__proto__ = b;
                }) ||
            function (d, b) {
                for (var p in b)
                    if (b.hasOwnProperty(p)) d[p] = b[p];
            };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);

        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var tinyqueue_1 = require("tinyqueue");
/**
 * Implementation of Dijkstra's Shortest Path algorithm.
 *
 * Nodes are numbered from 0 to n-1.
 *
 * Adapted from https://medium.com/@adriennetjohnson/a-walkthrough-of-dijkstras-algorithm-in-javascript-e94b74192026
 * This has been made more lightweight by treating nodes as an index rather than a string (name). We use `tinyqueue`
 * as our priority queue. All map-likes have been eliminated, but there are still object references in here, so
 * not as fast as possible, but should be fast enough and not too heavy on memory.
 */
var DijkstraShortestPathSolver = /** @class */ (function () {
    function DijkstraShortestPathSolver(nodes) {
        this.nodes = nodes;
        this.adjacencyList = new Array(nodes).fill(null).map(function (v) {
            return new Array(0);
        });
    }
    DijkstraShortestPathSolver.prototype.addEdge = function (fromNode, toNode, weight) {
        if (weight < 0) {
            throw new RangeError("weight must be >= 0");
        }
        this.adjacencyList[fromNode].push({
            node: toNode,
            weight: weight
        });
    };
    DijkstraShortestPathSolver.prototype.addBidirEdge = function (fromNode, toNode, weight) {
        if (weight < 0) {
            throw new RangeError("weight must be >= 0");
        }
        this.adjacencyList[fromNode].push({
            node: toNode,
            weight: weight
        });
        this.adjacencyList[toNode].push({
            node: fromNode,
            weight: weight
        });
    };
    DijkstraShortestPathSolver.prototype.setEdges = function (node, edges) {
        this.adjacencyList[node] = edges;
    };
    /**
     * Calculate shortest paths for all nodes for the given start node.
     * @param startNode The start node.
     */
    DijkstraShortestPathSolver.prototype.calculateFor = function (startNode) {
        var weights = new Array(this.nodes).fill(Infinity);
        weights[startNode] = 0;
        var pq = new tinyqueue_1([{
            node: startNode,
            weight: 0
        }], function (a, b) {
            return a.weight - b.weight;
        });
        var backtrace = new Array(this.nodes).fill(-1);
        var _loop_1 = function () {
            var shortestStep = pq.pop();
            var currentNode = shortestStep.node;
            this_1.adjacencyList[currentNode].forEach(function (neighbor) {
                var weight = weights[currentNode] + neighbor.weight;
                if (weight < weights[neighbor.node]) {
                    weights[neighbor.node] = weight;
                    backtrace[neighbor.node] = currentNode;
                    pq.push({
                        node: neighbor.node,
                        weight: weight
                    });
                }
            });
        };
        var this_1 = this;
        while (pq.length !== 0) {
            _loop_1();
        }
        return new ShortestPaths(startNode, backtrace, weights);
    };
    return DijkstraShortestPathSolver;
}());
exports.DijkstraShortestPathSolver = DijkstraShortestPathSolver;
var ShortestPaths = /** @class */ (function () {
    function ShortestPaths(startNode, backtrace, weights) {
        this.startNode = startNode;
        this.backtrace = backtrace;
        this.weights = weights;
    }
    /**
     * Find the shortest path to the given end node.
     * @param endNode The end node.
     */
    ShortestPaths.prototype.shortestPathTo = function (endNode) {
        var path = [endNode];
        var lastStep = endNode;
        while (lastStep !== this.startNode) {
            path.unshift(this.backtrace[lastStep]);
            lastStep = this.backtrace[lastStep];
        }
        return path;
    };
    /**
     * Total weight of the path from the start node to the given end node.
     * @param endNode The end node.
     */
    ShortestPaths.prototype.totalWeight = function (endNode) {
        return this.weights[endNode];
    };
    return ShortestPaths;
}());
var Route = /** @class */ (function () {
    function Route(score, route) {
        this.score = score;
        this.route = route;
    }
    Object.defineProperty(Route.prototype, "start", {
        get: function () {
            return this.route[0].coords;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Route.prototype, "destination", {
        get: function () {
            return this.route[this.route.length - 1].coords;
        },
        enumerable: true,
        configurable: true
    });
    return Route;
}());

function isSameRegion(a, b) {
    return a.x === b.x && a.y === b.y && a.z === b.z;
}
exports.isSameRegion = isSameRegion;

function isSameStar(a, b) {
    return isSameRegion(a, b) && a.s === b.s;
}
exports.isSameStar = isSameStar;

function isAdjacentRegion(a, b) {
    return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && Math.abs(a.z - b.z) <= 1;
}
exports.isAdjacentRegion = isAdjacentRegion;
/**
 * Number of jumps to get from point A to point B.
 * @param a First point.
 * @param b Second point.
 * @returns Integral number of jumps, rounded up.
 */
function calcExpectedJumps(maxJumpRange, a, b) {
    var result = Math.ceil((dist2(a, b) * 400) / maxJumpRange);
    if (result === 0) {
        if (isSameStar(a, b)) {
            return 0;
        } else {
            return 1;
        }
    } else {
        return result;
    }
}

function dist2(a, b) {
    return Math.sqrt(dist2Sq(a, b))
}

function dist2Sq(a, b) {
    let x = a.x - b.x
    let y = a.y - b.y
    let z = a.z - b.z
    return x * x + y * y + z * z
}

exports.calcExpectedJumps = calcExpectedJumps;

function dijkstraCalculator(galacticHops, maxJumpRange, optimization) {
    if (optimization === "fuel") {
        return new DijkstraCalculator4Fuel(galacticHops, maxJumpRange);
    } else if (optimization === "time") {
        return new DijkstraCalculator4Time(galacticHops, maxJumpRange);
    } else {
        throw new Error("unknown optimization value: " + optimization);
    }
}
exports.dijkstraCalculator = dijkstraCalculator;
var DijkstraCalculator = /** @class */ (function () {
    function DijkstraCalculator(galacticHops, maxJumpRange) {
        this.galacticHops = galacticHops;
        this.maxJumpRange = maxJumpRange;
    }
    DijkstraCalculator.prototype.routeWeight = function (a, b) {
        if (isSameStar(a, b)) {
            return 0;
        } else if (isSameRegion(a, b)) {
            return this.sameRegionWeight();
        } else if (isAdjacentRegion(a, b)) {
            return Math.max(this.adjacentRegionWeight(), calcExpectedJumps(this.maxJumpRange, a, b));
        } else {
            return this.waypointWeight() + calcExpectedJumps(this.maxJumpRange, a, b);
        }
    };
    DijkstraCalculator.prototype.findRoute = function (starts, destination) {
        var _this = this;
        /* All nodes; this is the indexed array. */
        var nodes = [];
        /* Just the black holes. */
        var bhs = [];
        /* Just the exits. */
        var exits = [];
        /* Starts/bases. */
        var sts = [];
        /* Destination. */
        var dest = {
            index: -1,
            system: destination,
            edges: []
        };
        nodes.push(dest);
        for (var _i = 0, starts_1 = starts; _i < starts_1.length; _i++) {
            var start = starts_1[_i];
            var st = {
                index: -1,
                system: start,
                edges: []
            };
            nodes.push(st);
            sts.push(st);
        }
        for (var _a = 0, _b = this.galacticHops; _a < _b.length; _a++) {
            var hop = _b[_a];
            var bh = {
                index: -1,
                system: hop.blackhole,
                edges: []
            };
            nodes.push(bh);
            bhs.push(bh);
            var bhIndex = nodes.length - 1;
            var ex = {
                index: -1,
                system: hop.exit,
                edges: [{
                    node: bhIndex,
                    weight: this.blackHoleWeight()
                }]
            };
            nodes.push(ex);
            exits.push(ex);
        }

        for (var _c = 0 ; _c < nodes.length; _c++) {
            var i = _c,
                node = nodes[_c];
            node.index = i;
            /*
             * Edges have minimal non-zero weight.
             * This prevents ties between shorter and longer paths when edge weights can be 0.
             */
            node.edges.forEach(function (e) {
                if (e.weight === 0) {
                    e.weight += 0.000001;
                }
            });
        }
        var _loop_2 = function (bh) {
            var exitEdges = this_2.closest(bh.system.coords, exits).map(function (s) {
                return {
                    node: s.index,
                    weight: _this.routeWeight(bh.system.coords, s.system.coords)
                };
            });
            var stEdges = sts
                .map(function (s) {
                    return {
                        node: s.index,
                        weight: _this.routeWeight(bh.system.coords, s.system.coords)
                    };
                });
            bh.edges = exitEdges.concat(stEdges);
        };
        var this_2 = this;
        for (var _f = 0, bhs_1 = bhs; _f < bhs_1.length; _f++) {
            let bh = bhs_1[_f];
            _loop_2(bh);
        }
        /* Intentional. Edges for starts to dest may pass through center. Avoids a no-answer scenario. */
        dest.edges = exits
            .concat(sts)
            .map(function (s) {
                return {
                    node: s.index,
                    weight: _this.routeWeight(dest.system.coords, s.system.coords)
                };
            });
        var g = new DijkstraShortestPathSolver(nodes.length);
        for (var _g = 0, nodes_1 = nodes; _g < nodes_1.length; _g++) {
            let node = nodes_1[_g];
            g.setEdges(node.index, node.edges);
        }
        var shortest = g.calculateFor(dest.index);
        for (var _h = 0, sts_1 = sts; _h < sts_1.length; _h++) {
            let st = sts_1[_h];
            console.log(JSON.stringify(st.system) + " scored " + shortest.totalWeight(st.index) + "; " + shortest.shortestPathTo(st.index));
        }
        return sts.map(function (st) {
            var score = Math.round(shortest.totalWeight(st.index));
            var route = shortest
                .shortestPathTo(st.index)
                .map(function (node) {
                    return nodes[node];
                })
                .map(function (node) {
                    return node.system;
                })
                .reverse();
            return new Route(score, route);
        });
    };
    DijkstraCalculator.prototype.maxTravelRangeLY = function () {
        return 100000;
    };
    DijkstraCalculator.prototype.maxClosest = function () {
        return 50;
    };
    DijkstraCalculator.prototype.closest = function (target, systems) {
        var range = this.maxTravelRangeLY() / 400;
        var syss = systems
            .filter(function (s) {
                return Math.abs(target.x - s.system.coords.x) <= range && Math.abs(target.z - s.system.coords.z) <= range;
            })
            .map(function (s) {
                return {
                    system: s,
                    dist: dist2Sq(target, s.system.coords)
                };
            });
        return syss
            .sort(function (a, b) {
                return a.dist - b.dist;
            })
            .map(function (a) {
                return a.system;
            })
            .slice(0, this.maxClosest());
    };
    return DijkstraCalculator;
}());
exports.DijkstraCalculator = DijkstraCalculator;
var DijkstraCalculator4Time = /** @class */ (function (_super) {
    __extends(DijkstraCalculator4Time, _super);

    function DijkstraCalculator4Time(galacticHops, maxJumpRange) {
        var _this = _super.call(this, galacticHops, maxJumpRange) || this;
        _this.galacticHops = galacticHops;
        _this.maxJumpRange = maxJumpRange;
        return _this;
    }
    DijkstraCalculator4Time.prototype.blackHoleWeight = function () {
        return 1;
    };
    DijkstraCalculator4Time.prototype.sameRegionWeight = function () {
        return 1;
    };
    DijkstraCalculator4Time.prototype.adjacentRegionWeight = function () {
        return 2;
    };
    DijkstraCalculator4Time.prototype.waypointWeight = function () {
        return 4;
    };
    return DijkstraCalculator4Time;
}(DijkstraCalculator));
var DijkstraCalculator4Fuel = /** @class */ (function (_super) {
    __extends(DijkstraCalculator4Fuel, _super);

    function DijkstraCalculator4Fuel(galacticHops, maxJumpRange) {
        var _this = _super.call(this, galacticHops, maxJumpRange) || this;
        _this.galacticHops = galacticHops;
        _this.maxJumpRange = maxJumpRange;
        return _this;
    }
    DijkstraCalculator4Fuel.prototype.blackHoleWeight = function () {
        return 0;
    };
    DijkstraCalculator4Fuel.prototype.sameRegionWeight = function () {
        return 1;
    };
    DijkstraCalculator4Fuel.prototype.adjacentRegionWeight = function () {
        return 1;
    };
    DijkstraCalculator4Fuel.prototype.waypointWeight = function () {
        return 0;
    };
    return DijkstraCalculator4Fuel;
}(DijkstraCalculator));