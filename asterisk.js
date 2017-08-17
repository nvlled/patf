function equalsPos(pos1, pos2) {
    return pos1.i == pos2.i && pos1.j == pos2.j;
}
function strPos(pos) {
    return "("+pos.i+", "+pos.j+")";
}

function heuristic(pos1, pos2) {
    return Math.abs(pos1.i-pos2.i) + Math.abs(pos1.j-pos2.j);
}

function GridGraph(array, cols, rows, nil) {
    this.array = array || [];
    this.rows = rows;
    this.cols = cols;
    this.nil = nil;
}
GridGraph.prototype = {
    getNeighbours: function(pos) {
        var self = this;
        var dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]];
        var neighbours = [];
        dirs.forEach(function(dir) {
            var i = pos.i + dir[0];
            var j = pos.j + dir[1];
            if (self.contains({i: i, j: j}))
                neighbours.push({i: i, j: j});
        });
        return neighbours;
    },
    indexOf: function(pos) {
        return pos.i*this.cols + pos.j;
    },
    //isVisited: function(history, pos) {
    //    return this.indexOf(pos);
    //},
    isTraversable: function(pos) {
        let idx = pos.i*this.cols + pos.j;
        var result = this.array[idx];
        if (result == this.nil)
            return true;
        return result.traversable;
    },
    contains: function(pos) {
        return pos.i >= 0 && pos.i < this.rows &&
            pos.j >= 0 && pos.j < this.cols; 
    },
}

// TODO: use pos.equals
//function isVisited(history, pos) {
//    for (var idx = 0; idx < path.length; idx++) {
//        var p = path[idx];
//        if (equalsPos(p, pos))
//            return true;
//    }
//    return false;
//}

function findPath(graph, args) {
    var current = args.current;
    var start = args.start;
    var end = args.end;
    var fn = args.fn || function() { };
    var done = args.done || function(result) {};
    var speed = args.speed || 500;
    var trace = {};
    var visited = {};
    var frontier = [start];

    // prev[graph.indexOf(pos]
    // tracePath(prev, pos);
    function tracePath(pos) {
        var path = [pos];
        while(true) {
            var k = graph.indexOf(pos);
            var prev = trace[k];
            if (!prev)
                break;
            path.unshift(prev);
            pos = prev;
        }
        return path;
    }

    function isVisisted(pos) {
        var k = graph.indexOf(pos);
        return visited[k] != null;
    }
    function visit(pos) {
        var k = graph.indexOf(pos);
        visited[k] = true;
    }

    //while (frontier.length > 0) {
    //    // FIX: trace[pos] = ...
    //    var pos = frontier.shift();
    //    fn(tracePath(pos));
    //    if (equalsPos(pos, end)) {
    //        return tracePath(pos);
    //    }
    //    // TODO: add priorities
    //    var neighbours = graph
    //        .getNeighbours(pos)
    //        .filter(function(pos) { return !isVisisted(pos)});
    //    frontier = frontier.concat(neighbours);
    //}

    visit(start);
    function loop() {
        if (frontier.length <= 0) {
            done(null);
            return;
        }
        // FIX: trace[pos] = ...
        var pos = frontier.shift();
        fn(tracePath(pos), function() {
            if (equalsPos(pos, end)) {
                done(tracePath(pos));
                return;
            }
            // TODO: add priorities
            var neighbours = graph
                .getNeighbours(pos)
                .filter(function(pos) { 
                    return !isVisisted(pos) && graph.isTraversable(pos);
                });

            neighbours.forEach(function(pos_) {
                var idx = graph.indexOf(pos_);
                trace[idx] = pos;
                visit(pos_);
            });
            frontier = frontier.concat(neighbours);
            setTimeout(loop, speed);
        });
    }
    loop();
}

function findPath__(graph, current, end, path) {
    if (!path) {
        path = [];
    }

    if (equalsPos(current, end)) {
        return path.concat([end]);
    }
    console.log("path", path.map(strPos));

    var pos = current;
    var neighbours = graph
        .getNeighbours(pos)
        .filter(function(pos_) {
            return !isVisited(path, pos_) && graph.isTraversable(pos_);
        });

    neighbours.sort(function(p1, p2) {
        return heuristic(p1, end) - heuristic(p2, end);
    });
    for (var idx = 0; idx < neighbours.length; idx++) {
        var nextPos = neighbours[idx];
        var path_ = findPath(graph, nextPos, end, path.concat([current]));
        if (path_)
            return path_;
    }
    return null;
}

//var graph = new GridGraph(
//    [0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0,
//     0, 1, 1, 1, 0, 1,
//     0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0],
//     7, 6, 0
//);
//console.log("path");
//path.forEach(p => console.log(p));




