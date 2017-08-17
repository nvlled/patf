
function Grid(canvas, args) {
    this.rows = args.rows || 3;
    this.cols = args.cols || 3;
    this.top = args.top || 0;
    this.left = args.left || 0;
    this.tileSpace = args.tileSpace || 3;
    this.tileSize = args.tileSize   || 
        canvas.width/(this.rows);
    this.renderer = canvas.getContext("2d");
    this.canvas = canvas;
    this.hoveredTile = null;
    this.selectedTiles = [];
    this.tiles = args.tiles || [];
    this.connections = [];

    this.ondrag = args.ondrag || function(start, end) {
        console.log("drag:", start.i, start.j, "|", end.i, end.j);
    }.bind(this);
    this.ondown = args.ondown || function(i, j) {
        console.log("down:", i, j);
    }.bind(this);
    this.onclick = args.onclick || function(i, j) {
        console.log("click:", i, j, i*this.cols + j);
    }.bind(this);
    this.onhover = args.onhover || function(i, j) {
        //console.log("hover:", i, j);
        this.selectedTiles = [{i: i, j: j}];
    }.bind(this);

    this.style = args.style || {
        background: "green",
        selected: "#f00",
    }

    this.handleInput();
}

Grid.prototype = {
    getWidth: function() {
        return this.cols*(this.tileSize+this.tileSpace);
    },
    getHeight: function() {
        return this.rows*(this.tileSize+this.tileSpace);
    },

    draw: function() {
        var renderer = this.renderer;
        var top = this.top;
        var left = this.left;
        var tileSize = this.tileSize;
        var tileSpace = this.tileSpace;

        renderer.clearRect(this.left-1, this.top-1, 
                this.getWidth(), this.getHeight());
        renderer.save();
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                var x = left + j*(tileSize+tileSpace);
                var y = top + i*(tileSize+tileSpace);

                if (this.isSelected(i, j)) {
                    renderer.strokeStyle = "yellow";
                    renderer.strokeRect(x, y, tileSize, tileSize);
                }
                var idx = i*this.cols + j;
                var tile = this.tiles[idx];
                renderer.fillStyle = this.style.background;
                renderer.fillRect(x, y, tileSize, tileSize);
                if (tile) {
                    if (typeof tile.render == "function") {
                        renderer.save();
                        renderer.translate(x, y);
                        renderer.beginPath();
                        renderer.rect(0, 0, tileSize, tileSize);
                        renderer.clip();
                        tile.render(renderer, i, j, tileSize);
                        renderer.restore();
                    } else {
                        renderer.fillStyle = tile.style;
                        renderer.fillRect(x, y, tileSize, tileSize);
                    }
                }
            }
        }
        renderer.restore();
        this.connections.forEach(function(conn) {
            var pos1 = conn.from;
            var pos2 = conn.to;
            var mid = this.tileSize/2;

            var t1 = this.tileAtIJ(pos1.i, pos1.j);
            var t2 = this.tileAtIJ(pos2.i, pos2.j);
            
            var r = this.renderer;
            var size = this.tileSize;

            //console.log(t1.x, t2.y, mid, size);
            r.save();
            function drawCircle(obj) {
                r.fillStyle = "red";
                r.beginPath();
                r.arc(obj.x+mid, obj.y+mid, size/7, 0, 2*Math.PI);
                r.closePath();
                r.fill();
                r.stroke();
            }
            drawCircle(t1);
            drawCircle(t2);
            r.lineWidth = 3;
            r.strokeStyle = "red";
            r.beginPath();
            r.moveTo(t1.x+mid, t1.y+mid);
            r.lineTo(t2.x+mid, t2.y+mid);
            r.stroke();
            r.restore();
        }.bind(this));
    },

    clearTiles: function() {
        this.tiles.splice(0);
    },

    clearConnections: function() {
        this.connections = [];
    },

    connect: function(pos1, pos2) {
        this.connections.push({
            from: pos1,
            to:   pos2,
        });
    },

    connectPath: function(path) {
        for (var idx = 0; idx < path.length-1; idx++) {
            var pos1 = path[idx];
            var pos2 = path[idx+1];
            this.connect(pos1, pos2);
        }
    },

    isHovered: function(i, j) {
        var tile = this.hoveredTile;
        if (!tile)
            return false;
        return tile[0] == i && tile[1] == j;
    },

    isSelected: function(i, j) {
        for (var idx = 0; idx < this.selectedTiles.length; idx++) {
            var tile = this.selectedTiles[idx];
            if (tile.i == i && tile.j == j)
                return true;
        }
        return false;
    },

    setData: function(i, j, data) {
        this.tiles[i*this.cols + j] = data;
    }, 
    getData: function(i, j) {
        return this.tiles[i*this.cols + j];
    },

    tileAtIJ: function(i, j) {
        var size = this.tileSize;
        var space = this.tileSpace;
        var x = j*(size+space)
        var y = i*(size+space)
        return  {
            i: i, j: j,
            x: this.left+x, y: this.top+y,
        }
    },

    tileAtXY: function(x, y) {
        x = (x-this.left);
        y = (y-this.top);
        var size = this.tileSize;
        var space = this.tileSpace;
        var j = Math.floor(x/(size+space));
        var i = Math.floor(y/(size+space));

        if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
            return null;

        var a = j*(size+space)
        var b = i*(size+space)
            //console.log("*", i, j, "|", a, b, "|", a+size, b+size, "|", x, y);
        if (x >= a && x <= a+size &&
            y >= b && y <= b+size) {
            return {i: i, j: j, x: x, y: y};
        }
        return null;
    },

    handleInput: function() {
        var canvas = this.canvas;
        var self = this;

        var start = null;
        var end = null;
        this.canvas.addEventListener("mousedown", function(e) {
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            var tile = self.tileAtXY(x, y);
            if (tile) {
                self.ondown.call(self, tile.i, tile.j);
                start = end = tile;
            }
        });
        this.canvas.addEventListener("mousemove", function(e) {
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            var tile = self.tileAtXY(x, y);
            if (tile) {
                self.onhover.call(self, tile.i, tile.j);
                if (start) {
                    end = tile;
                    self.ondrag.call(self, start, end);
                }
            }
        });
        this.canvas.addEventListener("mouseup", function(e) {
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            var tile = self.tileAtXY(x, y);
            if (tile && start) {
                if (start.i == end.i && start.j == end.j) {
                    self.onclick.call(self, tile.i, tile.j);
                } /*else {
                    self.ondragStart.call(self, start, end);
                }*/
            }
            start = end = null;
        });
    },

    selectTile: function(i, j) {
    },

    start: function() {
        var self = this;
        function loop() {
            self.draw();
            requestAnimationFrame(loop);
        }
        loop();
    },
}

window.onload = function() {
    var canvas = document.querySelector("canvas");
    canvas.width = 700;
    canvas.height = 400;
    patf = new Grid(canvas, {
        rows: 9,
        cols: 10,
        tileSize: 30,
        left: 20,
        top: 20,
        ondown: function(i, j) {
            var tile = currentTile.getData(0, 0);
            if (tile.clear)
                this.setData(i, j, null);
            else
                this.setData(i, j, tile);
            console.log(tile);
        },
        ondrag: function(start, end) {
            var tile = currentTile.getData(0, 0);
            if (tile.clear)
                this.setData(end.i, end.j, null);
            else
                this.setData(end.i, end.j, tile);
        },
    });
    pallete = new Grid(canvas, {
        rows: 1,
        cols: 4,
        tileSize: 50,
        left: patf.left + patf.getWidth() + 10,
        top: patf.top,
        style: {
            background: "teal",
        },
        tiles: [
            {style: "red"},
            {style: "blue"},
            {style: "yellow"},
            { clear: true,
                render: function(ctx, _, _, size) {
                    ctx.textAlign = "center";
                    ctx.font = "15px Serif";
                    ctx.fillStyle = "white";
                    ctx.fillText("clear", size/2, size/2);
            }}
        ],
        onclick: function(i, j) {
            currentTile.tiles = [this.getData(i, j)];
        },
    });
    currentTile = new Grid(canvas, {
        rows: 1,
        cols: 1,
        tileSize: 50,
        left: patf.left + patf.getWidth() + 10,
        top: pallete.top + pallete.getHeight() + 10,
        style: {
            background: "teal",
        },
        onhover: function() { },
        tiles: [
            {style: "blue"},
        ],
    });

    var graph = new GridGraph(
            patf.tiles,
            patf.cols,
            patf.rows,
            null
    );

    var sel = document.querySelector.bind(document);
    var clearButton = sel("#clear");
    var startButton = sel("#start");
    var setButton   = sel("#set");
    var msg   = sel("#msg");


    var render = function(ctx, i, j, tileSize) {
        var mid = tileSize/2;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(mid, mid, tileSize/5, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }
    
    var startPos = {i: 0, j: 0};
    var endPos = {i: 3, j: 5};
    patf.setData(startPos.i, startPos.j, {render: render, traversable: true});
    patf.setData(endPos.i, endPos.j,     {render: render, traversable: true});

    clearButton.onclick = function() {
        patf.clearTiles();
        patf.clearConnections();
    }
    startButton.onclick = function() {
        msg.textContent = "";
        var path = findPath(graph, {
            start: startPos,
            end:   endPos,
            speed: 50,
            fn: function(path, cc) {
                patf.clearConnections();
                patf.connectPath(path);
                cc();
            },
            done: function(path) {
                if (path == null) {
                    msg.textContent = "no path found";
                    patf.clearConnections();
                }
            },
        });
    }

    setButton.onclick = function() {
        //let handler = patf.onclick;
        setButton.textContent = "(select source)";
        setButton.disabled = true;
        var idle = function() { };
        var handlers = {
            ondown: patf.ondown,
            ondrag: patf.ondrag,
            onclick: patf.onclick,
        }
        patf.ondown = idle;
        patf.ondrag = idle;
        patf.onclick = idle;

        if (startPos) 
            patf.setData(startPos.i, startPos.j, null);
        if (endPos)
            patf.setData(endPos.i, endPos.j, null);

        patf.onclick = function(i, j) {
            startPos = {i: i, j: j};
            patf.setData(i, j, {
                traversable: true,
                render: render,
            });

            setButton.textContent = "(select destination)";
            patf.onclick = function(i, j) {
                setButton.textContent = "set";
                setButton.disabled = false;
                patf.ondown = handlers.ondown;
                patf.ondrag = handlers.ondrag;
                patf.onclick = handlers.onclick;

                endPos = {i: i, j: j};
                patf.setData(i, j, {
                    traversable: true,
                    render: render,
                });
            }
        }
    }

    patf.start();
    pallete.start();
    currentTile.start();
}




