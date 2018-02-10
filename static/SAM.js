var gWidth = 2080;
var gHeight = 850;
var gFontFamily = 'Consolas, Monaco, monospace';
var gLineWidth = 2;
var unitX = 15;
var unitY = 23;
var nodeList = [];

var app = new PIXI.Application(
    gWidth,
    gHeight,
    { backgroundColor: 0xD6DaD9 }
);

document.body.appendChild(app.view);


function textFactory(rawString, defaultAlpha) {
    function activate(){
        this.alpha = 1;
        //show arrow
    }
    function deactivate(){
        this.alpha = this.defaultAlpha;
        //hide arrow
    }
    function highLight(start, end) {
        //show self
        //
    }

    var text = new PIXI.Text(
        rawString,
        new PIXI.TextStyle({
            fontFamily: gFontFamily
        })
    );

    text.interactive = true;
    text.alpha = text.defaultAlpha = defaultAlpha;
    text
        .on('pointerover', activate)
        .on('pointerout', deactivate);
    return text;
}

function lineFactory(stPoint, edPoint, lineColor) {
    var graphics = new PIXI.Graphics();
    graphics.beginFill(lineColor, 1);
    graphics.drawRect(0, 0, 1, 1);
    var line = new PIXI.Sprite(graphics.generateTexture());

    line.setEndPoint = function (startPoint, endPoint) {
        var angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

        line.x = startPoint.x;
        line.y = startPoint.y;
        function distance(pointA, pointB) {
            return Math.sqrt(
                (pointA.x - pointB.x)
                * (pointA.x - pointB.x)
                + (pointA.y - pointB.y)
                * (pointA.y - pointB.y)
            )
        }
        line.scale.x = distance(startPoint, endPoint);
        line.scale.y = gLineWidth;
        line.rotation = angle;
    };
    line.setEndPoint(stPoint, edPoint);

    return line;
}


function arrowFactory(startPoint, endPoint){

    function update(startPoint, endPoint){
        //update start position
        //update end position
    }
    function activate(){
        //show self
    }
    function deactivate(){
        //hide self
    }
}

function backLinkFactory(startPoint, endPoint) {
    var line = lineFactory(startPoint, endPoint, 0x000000);
    line.activate = function(){
        this.alpha = 1;
    };
    line.deactivate = function(){
        this.alpha = 0;
    };
    return line;
}

function nodeFactory(minLen, maxLen, nodeStr) {
    function onDragStart(event) {
        this.data = event.data;
        this.alpha = 0.8;
        this.dragging = true;
    }
    function onDragMove() {
        if (this.dragging) {
            var new_position = this.data.getLocalPosition(this.parent);
            this.x = new_position.x;
            this.y = new_position.y;
            if (this.father){
                this._refreshFather();
            }
        }
    }
    function onDragEnd() {
        this.alpha = 0.5;
        this.dragging = false;
        this.data = null;
    }

    var height = maxLen - minLen + 1;
    function genGraphics() {
        var trapesoid = new PIXI.Polygon([
            new PIXI.Point(height * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, height * unitY),
            new PIXI.Point(0, height * unitY)
        ]);

        var graphics = new PIXI.Graphics();
        graphics.beginFill(0X00B5AD, 1);
        graphics.drawPolygon(trapesoid);
        return graphics;
    }

    var samNode = new PIXI.Sprite(genGraphics().generateTexture());
    samNode.texts = [];
    for (i  = 1; i <= height; i++){
        var text = new textFactory(
            nodeStr.slice(height - i),
            (i === 1 || i === height) * 0.5
        );
        text.x = (height - i + 1) * unitX;
        text.y = (i - 1) * unitY;
        samNode.addChild(text);
        samNode.texts.push(text);
    }

    samNode.interactive = true;
    samNode.alpha = 0.5;
    samNode
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    samNode.backLink = backLinkFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0)
    );
    samNode.backLink.deactivate();
    samNode.addChild(samNode.backLink);

    samNode.getNodePosition = function (type, x, y) {
        x = typeof(x) === "undefined" ? 0: x + this.x;
        y = typeof(y) === "undefined" ? 0: y + this.y;
        if (type === "top"){
            return new PIXI.Point(
                (height  * 2 + minLen) * unitX / 2 + x,
                0 + y
            );
        }
        if (type === "down"){
            return new PIXI.Point(
                (maxLen + 1) * unitX / 2 + x,
                height * unitY + y
            );
        }
        return null;
    };
    samNode.getPosition = function (number, start) {
        return new PIXI.Point(
            this.x + (start ? height - number - 0.5: (maxLen + 1)) * unitX,
            this.y + (0.5 + number) * unitY
        )
    };
    samNode.setFather = function (fatherId) {
        this.father = fatherId;
        this._refreshFather();
        this.backLink.activate();
    };
    samNode._refreshFather = function () {
        this.backLink.setEndPoint(
            this.getNodePosition("top"),
            nodeList[this.father].getNodePosition("down", -this.x, -this.y)
        );
    };
    samNode.resize = function () {
        //todo
    };
    return samNode;
}

function test() {

    nodeList[0] = nodeFactory(3, 6, "AQWDRA");
    nodeList[0].x = unitX * 4;
    nodeList[0].y = unitY * 4;

    nodeList[1] = nodeFactory(5, 6, "QWDRAB");
    nodeList[1].x = unitX * 10;
    nodeList[1].y = unitY * 10;

    for (var i = 0; i < 2; i++)
        app.stage.addChild(nodeList[i]);

    function showOne(position) {
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0X000000, 1);
        var edgeLen = 2;
        graphics.drawPolygon(
            new PIXI.Polygon([
                new PIXI.Point(-edgeLen, -edgeLen),
                new PIXI.Point( edgeLen, -edgeLen),
                new PIXI.Point( edgeLen,  edgeLen),
                new PIXI.Point(-edgeLen,  edgeLen)
            ])
        );
        graphics.x = position.x - edgeLen / 2;
        graphics.y = position.y - edgeLen / 2;
        app.stage.addChild(graphics);
    }

    nodeList[0].setFather(1);

    /*
    showOne(nodeList[0].getNodePosition("top"));
    showOne(nodeList[0].getNodePosition("down"));

    for (var i = 0; i <= 3 ; i ++){
        showOne(nodeList[0].getPosition(i, 0));
        showOne(nodeList[0].getPosition(i, 1));
    }
    */
}

test();

