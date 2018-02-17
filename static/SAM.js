var gWidth = $(document.body).width();
var gHeight = $(document.body).height() - $("#menu").height() - 5;
function parseColor(color){
    return parseInt(color.slice(1), 16);
}

var gBackGroundColor = parseColor("#e8ffed");

var gNodeNormalColor = parseColor("#8c998a");
var gBackedgeNormalColor = gNodeNormalColor;
var gTextNormalColor = parseColor("#c8e2d7");
var gTextNormalEndColor = parseColor("#2e3f31");
var gNextNormalColor = gTextNormalEndColor;
var gNodeMatchColor= parseColor("#695730");
var gTextMatchColor = parseColor("#b69631");
var gNextMatchColor = gTextMatchColor;
var gNodeAppendColor= parseColor("#183918");
var gTextAppendColor = parseColor("#577d47");
var gNextAppendColor = gTextAppendColor;

var app = new PIXI.Application(
    gWidth,
    gHeight,
    { backgroundColor: gBackGroundColor}
);
document.body.appendChild(app.view);

var gLineWidth = 3;
var gNodeDefaultAlpha = 0.7;
var nodeList = [];

var gFontFamily = 'Consolas, Monaco, monospace';
var gFontSize = 33;
function getUnit() {
    var testText = new PIXI.Text(
        'A',
        new PIXI.TextStyle({
            fontFamily: gFontFamily,
            fill: gTextNormalColor,
            fontSize: gFontSize
        })
    );
    unitX = testText.width;
    unitY = testText.height + 3;
}
getUnit();

function initBackGround() {
    function onDragStart(event) {
        this.pos = new PIXI.Point(
           event.data.originalEvent.clientX,
           event.data.originalEvent.clientY
        );
        this.dragging = true;
    }
    function onDragMove(event) {
        if (this.dragging) {
            var newPos = new PIXI.Point(
                event.data.originalEvent.clientX,
                event.data.originalEvent.clientY
            );
            var offset = new PIXI.Point(
                this.pos.x - newPos.x,
                this.pos.y - newPos.y
            );
            app.stage.x -= offset.x;
            app.stage.y -= offset.y;

            this.x += offset.x;
            this.y += offset.y;

            this.pos = newPos;
        }
    }
    function onDragEnd() {
        this.dragging = false;
        this.data = null;
    }
    var graphics = new PIXI.Graphics();
    graphics.beginFill(gBackGroundColor, 1);
    graphics.drawRect(0, 0, gWidth, gHeight);
    var backGround = new PIXI.Sprite(graphics.generateTexture());
    app.stage.addChild(backGround);

    backGround.interactive = true;
    backGround
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
}
initBackGround();

function textFactory(rawString, defaultAlpha, activateCallBack, deactivateCallBack) {
    function subTextFactory(str, color) {
        var text = new PIXI.Text(
            str,
            new PIXI.TextStyle({
                fontFamily: gFontFamily,
                fill: color,
                fontSize: gFontSize
            })
        );
        text.alpha = 0;
        return text;
    }
    var normalText = subTextFactory(
        rawString,
        gTextNormalColor
    );
    normalText.alpha = defaultAlpha;
    var matchText= subTextFactory(
        rawString,
        gTextMatchColor
    );
    var appendText= subTextFactory(
        rawString,
        gTextAppendColor
    );
    var tailText = subTextFactory(
        rawString[rawString.length - 1],
        gTextNormalEndColor
    );
    tailText.x = (rawString.length - 1) * unitX;

    normalText.interactive = true;
    normalText
        .on('pointerover', activate)
        .on('pointerout', deactivate);

    var text = new PIXI.Container();
    text.addChild(normalText);
    text.addChild(tailText);
    text.addChild(matchText);
    text.addChild(appendText);

    text.showTail = function(state) {
        tailText.alpha = 1;
        this.show();
    };
    text.hideTail = function () {
        tailText.alpha = 0;
        this.hide();
    };
    text.showMatch = function () { matchText.alpha = 1};
    text.hideMatch = function () { matchText.alpha = 0};
    text.showAppend = function () { appendText.alpha = 1};
    text.hideAppend = function () { appendText.alpha = 0};
    text.show = function () { normalText.alpha = 1; };
    text.hide = function () { normalText.alpha = defaultAlpha; };
    function activate(){
        text.show();
        activateCallBack(rawString.length);
    }
    function deactivate(){
        text.hide();
        deactivateCallBack(rawString.length);
    }
    return text;
}

function lineFactory(stPoint, edPoint, lineColor, crude) {
    if (typeof(crude) === "undefined")
        crude = 0;

    var graphics = new PIXI.Graphics();
    graphics.beginFill(lineColor, 1);
    graphics.drawRect(0, 0, 1, 1);
    var normalLine = new PIXI.Sprite(graphics.generateTexture());
    normalLine.scale.y = gLineWidth + crude;

    var crudeLine = new PIXI.Sprite(graphics.generateTexture());
    crudeLine.scale.y = gLineWidth + 2;
    crudeLine.alpha = 0;

    var line =  new PIXI.Container();
    line.addChild(normalLine);
    line.addChild(crudeLine);

    line._setEndPoint = function (startPoint, endPoint, oneLine) {
        var angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

        oneLine.x = startPoint.x;
        oneLine.y = startPoint.y;
        function distance(pointA, pointB) {
            return Math.sqrt(
                (pointA.x - pointB.x)
                * (pointA.x - pointB.x)
                + (pointA.y - pointB.y)
                * (pointA.y - pointB.y)
            )
        }
        oneLine.scale.x = distance(startPoint, endPoint);
        oneLine.rotation = angle;
    };
    line.setEndPoint = function(startPoint, endPoint){
        this._setEndPoint(startPoint, endPoint, normalLine);
        this._setEndPoint(startPoint, endPoint, crudeLine);
    };
    line.showCrude = function () {
        crudeLine.alpha = 1;
    };
    line.hideCrude = function () {
        crudeLine.alpha = 0;
    };

    line.setEndPoint(stPoint, edPoint);
    return line;
}

function arrowFactory(arrowColor){
    var tempArrow = lineFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0),
        arrowColor
    );
    tempArrow.show = function(){ this.alpha = 1};
    tempArrow.hide = function(){ this.alpha = 0};
    return tempArrow;
}

function backEdgeFactory(backedgeColor) {
    var backEdge = lineFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0),
        backedgeColor
    );
    backEdge.show = function(){ this.alpha = 1};
    backEdge.hide = function(){ this.alpha = 0};
    return backEdge;
}

function nodeFactory(id, minLen, maxLen, nodeText) {

    function onDragStart(event) {
        this.data = event.data;
        this.dragCenter = this.data.getLocalPosition(this);
        this.alpha = 1;
        this.dragging = true;
    }
    function onDragMove() {
        if (this.dragging) {
            var new_position = this.data.getLocalPosition(this.parent);
            this.x = new_position.x - this.dragCenter.x;
            this.y = new_position.y - this.dragCenter.y;
            this._refreshFather();
            this._refreshSon();
            this._refreshExNext();
            this._refreshExPre();
            if (typeof(this.currentText) !== "undefined") {
                this._refreshNext(this.currentText);
            }
        }
    }
    function onDragEnd() {
        this.alpha = gNodeDefaultAlpha;
        this.dragging = false;
        this.data = null;
    }
    if (nodeText.length > maxLen)
        nodeText = nodeText.slice(nodeText.length - maxLen);

    var height = 0;
    function genSprite(nodeColor) {
        height = maxLen - minLen + 1;
        var trapesoid = new PIXI.Polygon([
            new PIXI.Point(height * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, height * unitY),
            new PIXI.Point(0, height * unitY)
        ]);
        var graphics = new PIXI.Graphics();
        graphics.beginFill(nodeColor, 1);
        graphics.drawPolygon(trapesoid);
        return new PIXI.Sprite(graphics.generateTexture());
    }
    var normalNode, matchNode, appendNode;

    var samNode = new PIXI.Container();
    function initNode() {
        normalNode = genSprite(gNodeNormalColor);
        normalNode.alpha = 1;
        matchNode = genSprite(gNodeMatchColor);
        matchNode.alpha = 0;
        appendNode = genSprite(gNodeAppendColor);
        appendNode.alpha = 0;
        samNode.addChild(normalNode);
        samNode.addChild(matchNode);
        samNode.addChild(appendNode);
    }
    initNode();
    samNode.maxLen = maxLen;
    samNode.minLen = minLen;
    samNode.nodeText = nodeText;
    samNode.interactive = true;
    samNode.alpha = gNodeDefaultAlpha;
    samNode
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
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
    samNode.getPosition = function (rank, begin, isRelatively, x, y) {
        x = typeof(x) === "undefined" ? 0: x + this.x;
        y = typeof(y) === "undefined" ? 0: y + this.y;

        if (isRelatively){
            rank = Math.min(rank - minLen, height - 1);
        }
        if(rank < 0){
            return new PIXI.Point(-1, -1);
        }
        return new PIXI.Point(
            (begin ? height - rank - 0.5 : (maxLen + 1)) * unitX + x,
            (0.5 + rank) * unitY + y
        )
    };
    samNode.inBound = function (textLen) {
        return minLen <= textLen && textLen <= maxLen;
    };
    samNode.getHeight = function () {
        if (minLen == 0)
            return 0;
        return height;
    };

    //next
    samNode.next = new Map();
    samNode.addNext = function (key, nextId) {
        var arrow = arrowFactory(gNextNormalColor);
        arrow.hide();
        this.next.set(
            key,
            {
                "nextId": nextId,
                "arrow": arrow
            }
        );
        samNode.addChild(arrow);
    };
    samNode._refreshOneNext = function (rank, targetId, arrow) {
        var textLen = rank + minLen;
        arrow.setEndPoint(
            samNode.getPosition(rank, false, false),
            nodeList[targetId].getPosition(textLen + 1, true, true, -samNode.x, -samNode.y)
        )
    };
    samNode._refreshNext = function (rank) {
        samNode.next.forEach(function (next, aim) {
            samNode._refreshOneNext(rank, next['nextId'], next['arrow']);
        });
    };
    var matchNext = arrowFactory(gNextMatchColor);
    var appendNext = arrowFactory(gNextAppendColor);
    samNode.currentNext = "";
    samNode.exPre = -1;
    samNode._refreshExPre = function () {
        if (this.exPre != -1){
            nodeList[this.exPre]._refreshExNext();
        }
    };
    samNode._refreshExNext = function () {
        if (this.currentNext != ""){
            if (this.currentNext === "match")
                this._refreshOneNext(matchNext.soruceLen, matchNext.target, matchNext);
            if (this.currentNext === "append")
                this._refreshOneNext(appendNext.soruceLen, appendNext.target, appendNext);
        }
    };
    samNode.showMatchNext = function (targetId, textLen) {
        this._refreshOneNext(textLen - minLen, targetId, matchNext);
        this.currentNext = "match";
        matchNext.soruceLen = textLen - minLen;
        matchNext.target = targetId;
        nodeList[targetId].exPre = id;
        matchNext.alpha = 1;

    };
    samNode.hideMatchNext = function () {
        if (this.currentNext === "match"){
            nodeList[matchNext.target].exPre = -1;
            this.currentNext = "";
        }
        matchNext.alpha = 0;
    };
    samNode.showAppendNext = function (targetId, textLen) {
        this._refreshOneNext(textLen - minLen, targetId, appendNext);
        this.currentNext = "append";
        appendNext.soruceLen = textLen - minLen;
        appendNext.target = targetId;
        nodeList[targetId].exPre = id;
        appendNext.alpha = 1;
    };
    samNode.hideAppendNext = function () {
        if (this.currentNext === "append") {
            this.currentNext = "";
            nodeList[appendNext.target].exPre = -1;
        }
        appendNext.alpha = 0;
    };
    samNode.hideMatchNext();
    samNode.hideAppendNext();
    samNode.addChild(matchNext);
    samNode.addChild(appendNext);

    //text
    function activateTextCallback(textLen) {
        var rank = textLen - minLen;
        samNode._refreshNext(rank);
        samNode.currentText = rank;
        samNode.next.forEach(function (next, aim) {
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            var succ = nodeList[nextId].activateText(textLen);
            if (succ)
                arrow.show();
        });
    }
    function deactivateTextCallback(textLen) {
        this.currentText = undefined;
        samNode.next.forEach(function (next, aim) {
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            var succ = nodeList[nextId].deactivateText(textLen);
            if (succ)
                arrow.hide();
        });
    }
    function initText() {
        samNode.texts = [];
        for (var i  = 1; i <= height; i++){
            var text = textFactory(
                nodeText.slice(height - i),
                (i === 1 || i === height) * 0.9,
                activateTextCallback,
                deactivateTextCallback
            );
            text.x = (height - i + 1) * unitX;
            text.y = (i - 1) * unitY;
            samNode.addChild(text);
            samNode.texts.push(text);
        }
    }
    initText();
    samNode.activateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].showTail();
        return true;
    };
    samNode.deactivateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].hideTail();
        return true;
    };
    samNode.showMatchText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].showMatch();
    };
    samNode.hideMatchText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].hideMatch();
    };
    samNode.showAppendText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].showAppend();
    };
    samNode.hideAppendText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        if (rank < 0)
            return false;
        samNode.texts[rank].hideAppend();
    };

    //backedge
    samNode.backEdge = backEdgeFactory(gBackedgeNormalColor);
    samNode.backEdge.hide();
    samNode.addChild(samNode.backEdge);
    samNode.showCrudeBackedge = function () {
        samNode.backEdge.showCrude();
    };
    samNode.hideCrudeBackedge = function () {
        samNode.backEdge.hideCrude();
    };
    samNode.sons = new Set();
    samNode.addSon = function (sonId) {
        this.sons.add(sonId);
    };
    samNode.deleteSon = function (sonId) {
        this.sons.delete(sonId);
    };
    samNode.father = -1;
    samNode.setFather = function (fatherId) {
        if (this.father != -1){
            nodeList[this.father].deleteSon(id);
        }
        this.father = fatherId;
        nodeList[fatherId].addSon(id);
        this._refreshFather();
        this.backEdge.show();
    };
    samNode._refreshFather = function () {
        if (this.father === -1)
            return;
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
    samNode.showMatchNode = function () {
        normalNode.alpha = 0; matchNode.alpha = 1;
    };
    samNode.hideMatchNode = function () {
        matchNode.alpha = 0; normalNode.alpha = 1;
    };
    samNode.showAppendNode = function () {
        normalNode.alpha = 0; appendNode.alpha = 1;
    };
    samNode.hideAppendNode = function () {
        appendNode.alpha = 0; normalNode.alpha = 1;
    };
    samNode.updateBoundary = function (position){
        if (position == "upper_up"){
            if (minLen <= 0)
                return false;
            minLen = minLen - 1;
            samNode.y -= unitY;
        }
        if (position == "upper_down"){
            if (minLen == maxLen)
                return false;
            minLen = minLen + 1;
            samNode.y += unitY;
        }
        if (position == "under_up"){
            if (maxLen === minLen)
                return false;
            maxLen =  maxLen - 1;
            nodeText = nodeText.slice(1);
            samNode.x += unitX;
        }
        samNode.minLen = minLen;
        samNode.maxLen = maxLen;
        samNode.nodeText = nodeText;

        samNode.removeChild(normalNode);
        samNode.removeChild(matchNode);
        for (var i = 0; i < samNode.texts.length; i++)
            samNode.removeChild(samNode.texts[i]);
        samNode.texts = [];

        initNode();
        initText();
        samNode._refreshSon();
        samNode._refreshFather();
    };
    return samNode;
}

function test() {
    function showPoint(position) {
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
        var node = nodeFactory(i, param[0], param[1], param[2]);
        node.x = unitX * (param[3] - 8);
        node.y = unitY * (param[4] - 8);
        nodeList.push(node);
        app.stage.addChild(node);
    }

    nodeList[1].setFather(0);
    nodeList[2].setFather(1);
    nodeList[3].setFather(0);
    nodeList[4].setFather(3);
    nodeList[5].setFather(3);

    nodeList[0].addNext('A', 1);
    nodeList[0].addNext('B', 3);
    nodeList[1].addNext('A', 2);
    nodeList[1].addNext('B', 4);
    nodeList[2].addNext('B', 4);
    nodeList[3].addNext('B', 5);
    nodeList[4].addNext('B', 5);

}

//test();

function matchProcessFactory(matchText) {
    var matchProcess = {
        activity_element: [],
        activate_node: function(nodeId){
            nodeList[nodeId].showMatchNode();
            this.activity_element.push({
                type: "node",
                id: nodeId
            })
        },
        activate_next: function(nodeId, targetId, textLen){
            nodeList[nodeId].showMatchNext(targetId, textLen);
            this.activity_element.push({
                type: "next",
                id: nodeId
            })
        },
        activate_backedge: function (nodeId) {
            nodeList[nodeId].showCrudeBackedge();
            this.activity_element.push({
                type: "backedge",
                id: nodeId
            })
        },
        activate_text: function (nodeId, textLength) {
            nodeList[nodeId].showMatchText(textLength);
            this.activity_element.push({
                type: "text",
                id: nodeId,
                length: textLength
            })

        },
        deactivate_all: function () {
            this.activity_element.forEach(function (element, id, array) {
                if (element.type === "node")
                    nodeList[element.id].hideMatchNode();
                if (element.type === "next")
                    nodeList[element.id].hideMatchNext();
                if (element.type === "backedge")
                    nodeList[element.id].hideCrudeBackedge();
                if (element.type === "text")
                    nodeList[element.id].hideMatchText(element.length);
            });
            this.activity_element = [];
        },
        full_str: matchText,
        cur: 0,
        current_node: 0,
        current_match:  "",
        next: function () {
            this.deactivate_all();

            if (this.cur >= matchText.length)
                return false;

            var current_char = matchText[this.cur];
            if (nodeList[this.current_node].next.has(current_char)){
                this.activate_node(this.current_node);
                this.activate_text(this.current_node, this.current_match.length);

                var next = nodeList[this.current_node].next.get(current_char);
                this.activate_next(
                    this.current_node,
                    next['nextId'],
                    this.current_match.length
                );
                this.current_match += current_char;
                this.current_node = next['nextId'];
                this.cur += 1;

                this.activate_node(this.current_node);
                this.activate_text(this.current_node, this.current_match.length);
            }
            else{
                if (nodeList[this.current_node].father == -1){
                    this.current_match = "";
                    this.current_node = 0;
                    this.cur += 1;

                    this.activate_node(this.current_node);
                }
                else{
                    this.activate_node(this.current_node);
                    this.activate_text(this.current_node, this.current_match.length);
                    this.activate_backedge(this.current_node);

                    this.current_node = nodeList[this.current_node].father;
                    this.current_match = this.current_match.slice(
                        this.current_match.length - nodeList[this.current_node].maxLen
                    );

                    this.activate_node(this.current_node);
                    this.activate_text(this.current_node, this.current_match.length);
                }
            }
            console.log(this.current_match);
            return true;
        }
    };
    return matchProcess;
}

function genMatchProcess() {
    forward();
    matchText = $("#match_input").val();
    $("#match_input").val("");
    process = matchProcessFactory(matchText);
    $("[name='controller']").removeClass('disabled');
    process.next();
}

var Sam = {
    fullText : "",
    last: 0
};

function appendProcessFactory(appendText) {
    var appendProcess = {
        activity_element: [],
        activate_node: function(nodeId){
            nodeList[nodeId].showAppendNode();
            this.activity_element.push({
                type: "node",
                id: nodeId
            })
        },
        activate_next: function(nodeId, targetId, textLen){
            nodeList[nodeId].showAppendNext(targetId, textLen);
            this.activity_element.push({
                type: "next",
                id: nodeId
            })
        },
        activate_backedge: function (nodeId) {
            nodeList[nodeId].showCrudeBackedge();
            this.activity_element.push({
                type: "backedge",
                id: nodeId
            })
        },
        activate_text: function (nodeId, textLength) {
            nodeList[nodeId].showAppendText(textLength);
            this.activity_element.push({
                type: "text",
                id: nodeId,
                length: textLength
            })

        },
        deactivate_all: function () {
            this.activity_element.forEach(function (element, id, array) {
                if (element.type === "node")
                    nodeList[element.id].hideAppendNode();
                if (element.type === "next")
                    nodeList[element.id].hideAppendNext();
                if (element.type === "backedge")
                    nodeList[element.id].hideCrudeBackedge();
                if (element.type === "text")
                    nodeList[element.id].hideAppendText(element.length);
            });
            this.activity_element = [];
        },

        appendText: appendText,
        omg: -1,
        textLen: -1,
        ox: -1,
        omgx: -1,
        mgx: -1,
        finish: function () {
            Sam.last = this.ox;
            Sam.fullText += this.appendText[0];
            this.ox = -1;
            this.omg = -1;
            this.textLen = -1;
            this.omgx = -1;
            this.mgx = -1;
            this.appendText = this.appendText.slice(1);
        },
        next: function () {
            this.deactivate_all();

            if (this.appendText == "") //all done
                return false;

            var x = this.appendText[0];
            if (this.ox === -1) { //start init
                this.ox = nodeList.length;
                this.omg = Sam.last;
                this.textLen = Sam.fullText.length;

                var node = nodeFactory(
                    this.ox,
                    this.textLen + 1,
                    this.textLen + 1,
                    Sam.fullText + x
                );
                nodeList.push(node);
                node.x = gWidth / 2 - (this.textLen + 1) * unitX / 2;
                node.y = 2 * unitY + (this.textLen + 1) * unitY;
                app.stage.addChild(node);

                this.activate_node(this.ox);
                return true;
            }
            if (this.omg === -1) { //growing done
                if (this.mgx === -1)
                    nodeList[this.ox].setFather(0);

                this.activate_node(0);
                this.activate_node(this.ox);
                this.activate_backedge(this.ox);

                this.finish();

                return true;
            }
            //growing
            if ((nodeList[this.omg].next.has(x) && this.textLen != nodeList[this.omg].maxLen)
                || !nodeList[this.omg].next.has(x) ) {

                if (!nodeList[this.omg].next.has(x))
                    nodeList[this.omg].addNext(x, this.ox);
                if (this.textLen != Sam.fullText.length)
                    nodeList[this.ox].updateBoundary("upper_up");

                this.activate_node(this.omg);
                this.activate_text(this.omg, this.textLen);
                this.activate_node(this.ox);
                this.activate_text(this.ox, this.textLen + 1);
                this.activate_next(this.omg, this.ox, this.textLen);

                this.textLen--;
                if (!nodeList[this.omg].inBound(this.textLen))
                    this.omg = nodeList[this.omg].father;

                return true;
            }
            if (this.mgx !== -1){ //update
                if (nodeList[this.omg].next.get(x)['nextId'] != this.omgx
                     &&  nodeList[this.omg].next.get(x)['nextId'] != this.mgx){
                    this.finish();
                    return true;
                }
                nodeList[this.omg].addNext(x, this.mgx);

                this.activate_next(this.omg, this.mgx, this.textLen);
                this.activate_text(this.omg, this.textLen);
                this.activate_text(this.mgx, this.textLen + 1);

                this.textLen -= 1;
                if (!nodeList[this.omg].inBound(this.textLen))
                    this.omg = nodeList[this.omg].father;

                return true;
            }
            if (nodeList[this.omg].next.has(x) && this.omgx === -1) {
                this.omgx = nodeList[this.omg].next.get(x)['nextId'];
                if(nodeList[this.omgx].maxLen == nodeList[this.omg].maxLen + 1){
                    nodeList[this.ox].setFather(this.omgx);

                    this.activate_node(this.omg);
                    this.activate_next(this.omg, this.omgx, this.textLen);
                    this.activate_node(this.omgx);
                    this.activate_node(this.ox);
                    this.activate_backedge(this.ox);

                    this.finish();

                    return true;
                }
                else{ //split
                    var mgxMaxLen = nodeList[this.omg].maxLen + 1;
                    var omgxNode = nodeList[this.omgx];
                    this.mgx = nodeList.length;
                    var mgxNode = nodeFactory(
                        this.mgx,
                        omgxNode.minLen,
                        mgxMaxLen,
                        omgxNode.nodeText
                    );
                    mgxNode.x = nodeList[this.omgx].x + (omgxNode.maxLen - mgxMaxLen) * unitX;
                    mgxNode.y = nodeList[this.omgx].y - 5;
                    nodeList.push(mgxNode);
                    app.stage.addChild(mgxNode);

                    for (var i = 0; i < mgxNode.getHeight(); i++)
                        omgxNode.updateBoundary("upper_down")
                    omgxNode.y += 5;

                    mgxNode.setFather(omgxNode.father);
                    omgxNode.setFather(this.mgx);

                    nodeList[this.ox].setFather(this.mgx);
                    omgxNode.next.forEach(function (next, key){
                        mgxNode.addNext(key, next['nextId']);
                    });
                    nodeList[this.mgx].addNext(x, this.ox);

                    this.activate_node(this.omg);
                    this.activate_text(this.omg, this.textLen);
                    this.activate_node(this.omgx);
                    this.activate_node(this.mgx);
                    this.activate_text(this.mgx, this.textLen + 1);
                    this.activate_backedge(this.ox);
                    this.activate_backedge(this.omgx);

                    return true;
                }
            }
        }
    };
    return appendProcess;
}

function genAppendProcess() {
    forward();
    var appendText = $("#append_input").val();
    $("#append_input").val("");
    process = appendProcessFactory(appendText);
    $("[name='controller']").removeClass('disabled');
    process.next();
}

function next() {
    if (typeof(process) !== "undefined"){
        var succ = process.next();
        if (!succ)
            $("[name='controller']").addClass('disabled');
        return succ;
    }
    return false;
}

function forward() {
    while(next());
}

function reset(){
    forward();
    for (var i = 0; i < nodeList.length; i++){
        app.stage.removeChild(nodeList[i]);
        nodeList[i] = undefined;
    }
    init();
}

function init() {
    nodeList = [];
    nodeList.push(nodeFactory(0, 0, 0, ""));
    nodeList[0].x = gWidth / 2 - unitX / 2;
    app.stage.addChild(nodeList[0]);
    Sam = {
        fullText : "",
        last: 0
    };
    $("[name='controller']").addClass('disabled');
}

init();

function sort() {
    var widthList = [];
    
    function dfs(st) {
        var sums = 0;
        nodeList[st].sons.forEach(function (sonId) {
            sums += dfs(sonId);
        });
        widthList[st] = Math.max(sums, nodeList[st].maxLen + 2);
        return widthList[st];
    }
    dfs(0);

    function placed(st, x, y) {
        nodeList[st].x = (widthList[st] - nodeList[st].maxLen) * unitX + x;
        nodeList[st].y = y;
        nodeList[st]._refreshFather();
        nodeList[st]._refreshExNext();
        nodeList[st]._refreshExPre();

        y += (nodeList[st].getHeight() + 1) * unitY;
        if (st === 0)
            y += unitY;
        nodeList[st].sons.forEach(function (sonId) {
            placed(sonId, x, y);
            x += widthList[sonId] * unitX;
        });
    }
    placed(0, 0, 0);
}
