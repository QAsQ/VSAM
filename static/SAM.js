var gWidth = 2080;
var gHeight = 850;
var gFontFamily = 'Consolas, Monaco, monospace';
var gLineWidth = 2;
var unitX = 14;
var unitY = 23;
var nodeList = [];

var app = new PIXI.Application(
    gWidth,
    gHeight,
    { backgroundColor: 0xD6DaD9 }
);

document.body.appendChild(app.view);


function textFactory(rawString, activateCallBack, deactivateCallBack) {
    function activate(){
        this.defaultAlpha = this.alpha;
        this.alpha = 1;
        activateCallBack(rawString.length);
    }
    function deactivate(){
        this.alpha = this.defaultAlpha;
        this.defaultAlpha = undefined;
        deactivateCallBack(rawString.length);
    }
    var text = new PIXI.Text(
        rawString,
        new PIXI.TextStyle({
            fontFamily: gFontFamily
        })
    );
    var tailText = new PIXI.Text(
        rawString[rawString.length - 1],
        new PIXI.TextStyle({
            fontFamily: gFontFamily,
            fill: '#ff2433',
            stroke: '#ff2433',
            strokeThickness: 1
        })
    );
    tailText.x = (rawString.length - 1) * unitX;
    tailText.alpha = 0;
    text.addChild(tailText);
    text.interactive = true;
    text
        .on('pointerover', activate)
        .on('pointerout', deactivate);

    text.highLight = function(state) {
        if (state === "end_one"){
            tailText.alpha = 1;
            this.show();
        }
        if (state === "clean"){
            tailText.alpha = 0;
            this.hide();
        }
    };
    text.show = function () {
        this.defaultAlpha = this.alpha;
        this.alpha = 1;
    };
    text.hide = function () {
        this.alpha = this.defaultAlpha;
        this.defaultAlpha = undefined;
    };
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
    var tempArrow = lineFactory(startPoint, endPoint, 0xffffff);
    tempArrow.activate = function(){
        this.alpha = 1;
    };
    tempArrow.deactivate = function(){
        this.alpha = 0;
    };
    return tempArrow;
}

function backEdgeFactory(startPoint, endPoint) {
    var backEdge = lineFactory(startPoint, endPoint, 0x000000);
    backEdge.activate = function(){
        //this.alpha = 1;
    };
    backEdge.deactivate = function(){
        //this.alpha = 0;
    };
    return backEdge;
}

function nodeFactory(id, minLen, maxLen, nodeText) {
    function onDragStart(event) {
        this.data = event.data;
        this.alpha = 1;
        this.dragging = true;
    }
    function onDragMove() {
        if (this.dragging) {
            var new_position = this.data.getLocalPosition(this.parent);
            this.x = new_position.x;
            this.y = new_position.y;
            if (typeof(this.father) !== "undefined"){
                this._refreshFather();
            }
            this._refreshSon();
            if (typeof(this.currentText) !== "undefined") {
                this._refreshNext(this.currentText);
            }
        }
    }
    function onDragEnd() {
        this.alpha = 0.9;
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

    samNode.next = new Map();
    samNode.addNext = function (key, nextId) {
        var arrow = arrowFactory(
            new PIXI.Point(0, 0),
            new PIXI.Point(0, 0)
        );
        //arrow.deactivate();
        this.next[key] = {
            "nextId": nextId,
            "arrow": arrow
        };
        samNode.addChild(arrow);
    };
    samNode._refreshNext = function (rank) {
        var textLen = rank + minLen;
        for (var aim in samNode.next){
            var next = samNode.next[aim];
            var arrow = next['arrow'];
            var nextId = next['nextId'];
            arrow.setEndPoint(
                samNode.getPosition(rank, false, false),
                nodeList[nextId].getPosition(textLen + 1, true, true, -this.x, -this.y)
            );
        }
    };
    function activateTextCallback(textLen) {
        var rank = textLen - minLen;
        samNode._refreshNext(rank);
        samNode.currentText = rank;
        for (var aim in samNode.next){
            var next = samNode.next[aim];
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            arrow.activate();
            nodeList[nextId].activateText(textLen);
        }
    }
    function deactivateTextCallback(textLen) {
        this.currentText = undefined;
        for (var aim in samNode.next){
            var next = samNode.next[aim];
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            arrow.deactivate();
            nodeList[nextId].deactivateText(textLen);
        }
    }

    samNode.texts = [];
    for (i  = 1; i <= height; i++){
        var text = new textFactory(
            nodeText.slice(height - i),
            activateTextCallback,
            deactivateTextCallback
        );
        text.x = (height - i + 1) * unitX;
        text.y = (i - 1) * unitY;
        text.alpha = (i === 1 || i === height) * 0.8;
        samNode.addChild(text);
        samNode.texts.push(text);
    }

    samNode.interactive = true;
    samNode.alpha = 0.9;
    samNode
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    samNode.activateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        samNode.texts[rank].highLight("end_one");
    };

    samNode.deactivateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        samNode.texts[rank].highLight("clean");
    };

    samNode.backEdge = backEdgeFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0)
    );
    samNode.backEdge.deactivate();
    samNode.addChild(samNode.backEdge);
    samNode.sons = new Set();
    samNode.addSon = function (sonId) {
        this.sons.add(sonId);
    };
    samNode.deleteSon = function (sonId) {
        this.sons.delete(sonId);
    };

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
    samNode.getPosition = function (number, begin, isRelatively, x, y) {
        x = typeof(x) === "undefined" ? 0: x + this.x;
        y = typeof(y) === "undefined" ? 0: y + this.y;

        if (isRelatively){
            number = Math.min(number - minLen, height - 1);
        }
        return new PIXI.Point(
            (begin ? height - number - 0.5 : (maxLen + 1)) * unitX + x,
            (0.5 + number) * unitY + y
        )
    };

    samNode.setFather = function (fatherId) {
        if (typeof(this.father) !== 'undefined'){
            nodeList[this.father].deleteSon(id);
        }
        this.father = fatherId;
        nodeList[fatherId].addSon(id);
        this._refreshFather();
        this.backEdge.activate();
    };
    samNode._refreshFather = function () {
        this.backEdge.setEndPoint(
            this.getNodePosition("top"),
            nodeList[this.father].getNodePosition("down", -this.x, -this.y)
        );
    };
    samNode._refreshSon = function () {
        this.sons.forEach(function (sonId) {
            nodeList[sonId]._refreshFather();
        })
    };
    samNode.resize = function () {
        //todo
    };
    return samNode;
}

function test() {
    function showOne(position) {
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0x000000, 1);
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
    sampleNode = [
        [0, 0, '', 13, 8],
        [1, 1, 'A', 10, 10],
        [2, 2, 'AA', 9, 12],
        [1, 1, 'B', 17, 10],
        [2, 3, 'AAB', 13, 12],
        [2, 4, 'AABB', 18, 13]
    ];

    for (var i = 0; i < sampleNode.length; i++){
        var param = sampleNode[i];
        nodeList[i] = nodeFactory(i, param[0], param[1], param[2]);
        nodeList[i].x = unitX * param[3];
        nodeList[i].y = unitY * param[4];
        app.stage.addChild(nodeList[i]);
    }

    nodeList[1].setFather(0);
    nodeList[2].setFather(1);
    nodeList[3].setFather(0);
    nodeList[4].setFather(3);
    nodeList[5].setFather(3);

    nodeList[0].addNext('A', 1);
    nodeList[0].addNext('B', 3);
    nodeList[1].addNext('A', 2);
    nodeList[1].addNext('A', 4);
    nodeList[2].addNext('B', 4);
    nodeList[3].addNext('B', 5);
    nodeList[4].addNext('B', 5);

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

