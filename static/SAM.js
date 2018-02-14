var gWidth = 2080;
var gHeight = 850;
var gLineWidth = 3;
var nodeList = [];

var gBackGroundColor = 0Xffffff;
"#00B5AD"
var gNodeColor = 0x00B5AD ;
var gBackEdgeColor = 0x006f67;
var gTextColor = 0xffffff;
var gTextHighlightEndColor = 0x004545;
var gArrowColor = gTextHighlightEndColor;

"#32CD32"
var gTextHighlightFullColor = 0x32CD32;
var gMatchHighlightNextColor = gTextHighlightFullColor;

"#004545"
var gMatchHighlightColor= 0x004545;

var gFontFamily = 'Consolas, Monaco, monospace';
var gFontSize = 45;

var testText = new PIXI.Text(
    'A',
    new PIXI.TextStyle({
        fontFamily: gFontFamily,
        fill: gTextColor,
        fontSize: gFontSize
    })
);

var unitX = testText.width;
var unitY = testText.height + 3;

var app = new PIXI.Application(
    gWidth,
    gHeight,
    { backgroundColor: gBackGroundColor}
);

document.body.appendChild(app.view);

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
        gTextColor
    );
    normalText.alpha = defaultAlpha;
    var fullText= subTextFactory(
        rawString,
        gTextHighlightFullColor
    );
    var tailText = subTextFactory(
        rawString[rawString.length - 1],
        gTextHighlightEndColor
    );
    tailText.x = (rawString.length - 1) * unitX;

    normalText.interactive = true;
    normalText
        .on('pointerover', activate)
        .on('pointerout', deactivate);

    var text = new PIXI.Container();
    text.addChild(normalText);
    text.addChild(tailText);
    text.addChild(fullText);

    text.highlight = function(state) {
        if (state === "show_tail"){
            tailText.alpha = 1;
            this.show();
        }
        if (state === "hide_tail"){
            tailText.alpha = 0;
            this.hide();
        }
        if (state === "show_full"){
            fullText.alpha = 1;
        }
        if (state === "hide_full"){
            fullText.alpha = 0;
        }
    };
    text.show = function () {
        normalText.alpha = 1;
    };
    text.hide = function () {
        normalText.alpha = defaultAlpha;
    };
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
    var graphics = new PIXI.Graphics();
    graphics.beginFill(lineColor, 1);
    graphics.drawRect(0, 0, 1, 1);
    var normalLine = new PIXI.Sprite(graphics.generateTexture());
    normalLine.scale.y = gLineWidth + crude;

    var highlightLine = new PIXI.Sprite(graphics.generateTexture());
    highlightLine.alpha = 0;
    highlightLine.scale.y = gLineWidth + 2;

    var line =  new PIXI.Container();
    line.addChild(normalLine);
    line.addChild(highlightLine);

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
        this._setEndPoint(startPoint, endPoint, highlightLine);
    };
    line.highlight = function () {
        highlightLine.alpha = 1;
    };
    line.undoHighlight = function () {
        highlightLine.alpha = 0;
    };
    line.setEndPoint(stPoint, edPoint);

    return line;
}

function arrowFactory(startPoint, endPoint){
    var tempArrow = lineFactory(startPoint, endPoint, gArrowColor, 0);
    tempArrow.activate = function(){
        this.alpha = 1;
    };
    tempArrow.deactivate = function(){
        this.alpha = 0;
    };
    return tempArrow;
}

function backEdgeFactory(startPoint, endPoint) {
    var backEdge = lineFactory(startPoint, endPoint, gBackEdgeColor, 0);
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
            if (this.father != -1){
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
    function genGraphics(nodeColor) {
        var trapesoid = new PIXI.Polygon([
            new PIXI.Point(height * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, height * unitY),
            new PIXI.Point(0, height * unitY)
        ]);

        var graphics = new PIXI.Graphics();
        graphics.beginFill(nodeColor, 1);
        graphics.drawPolygon(trapesoid);
        return graphics;
    }

    var samNode = new PIXI.Container();

    var normalNode = new PIXI.Sprite(genGraphics(gNodeColor).generateTexture());
    var highlightNode = new PIXI.Sprite(genGraphics(gMatchHighlightColor).generateTexture());

    normalNode.alpha = 1;
    highlightNode.alpha = 0;

    samNode.addChild(normalNode);
    samNode.addChild(highlightNode);

    samNode.next = new Map();
    samNode.addNext = function (key, nextId) {
        var arrow = arrowFactory(
            new PIXI.Point(0, 0),
            new PIXI.Point(0, 0)
        );
        arrow.deactivate();
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
            var arrow = next['arrow'];
            var nextId = next['nextId'];
            samNode._refreshOneNext(rank, nextId, arrow);
        });
    };
    var highlightNext = lineFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0),
        gMatchHighlightNextColor,
        2
    );
    samNode.activateNext = function (targetId, textLen) {
        this._refreshOneNext(textLen - minLen, targetId, highlightNext);
        highlightNext.alpha = 1;
    };
    samNode.deactivateNext = function () {
        highlightNext.alpha = 0;
    };
    samNode.deactivateNext();

    samNode.addChild(highlightNext);

    function activateTextCallback(textLen) {
        var rank = textLen - minLen;
        samNode._refreshNext(rank);
        samNode.currentText = rank;
        samNode.next.forEach(function (next, aim) {
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            arrow.activate();
            nodeList[nextId].activateText(textLen);
        });
    }
    function deactivateTextCallback(textLen) {
        this.currentText = undefined;
        samNode.next.forEach(function (next, aim) {
            var nextId = next['nextId'];
            var arrow = next['arrow'];
            arrow.deactivate();
            nodeList[nextId].deactivateText(textLen);
        });
    }

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

    samNode.interactive = true;
    samNode
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    samNode.activateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        samNode.texts[rank].highlight("show_tail");
    };

    samNode.deactivateText = function (textLen) {
        var rank = Math.min(textLen - minLen + 1, height - 1);
        samNode.texts[rank].highlight("hide_tail");
    };
    samNode.highlightText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        samNode.texts[rank].highlight("show_full");
    };
    samNode.undoHighlightText = function (textLen) {
        var rank = Math.min(textLen - minLen, height - 1);
        samNode.texts[rank].highlight("hide_full");
    };

    samNode.backEdge = backEdgeFactory(
        new PIXI.Point(0, 0),
        new PIXI.Point(0, 0)
    );
    samNode.backEdge.deactivate();
    samNode.addChild(samNode.backEdge);
    samNode.activateBackedge = function () {
        samNode.backEdge.highlight();
    };
    samNode.deactivateBackedge = function () {
        samNode.backEdge.undoHighlight();
    };
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

    samNode.father = -1;
    samNode.setFather = function (fatherId) {
        if (this.father != -1){
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
    samNode.activate = function () {
        normalNode.alpha = 0;
        highlightNode.alpha = 1;
    };
    samNode.deactivate = function () {
        highlightNode.alpha = 0;
        normalNode.alpha = 1;
    };
    samNode.resize = function () {
        //todo
    };
    samNode.maxLen = maxLen;
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
        nodeList[i].x = unitX * (param[3] - 8);
        nodeList[i].y = unitY * (param[4] - 8);
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
    nodeList[1].addNext('B', 4);
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

function matchProcessFactory(matchText) {
    var matchProcess = {
        full_str: matchText,

        cur: 0,
        current_node: 0,
        current_match:  "",
        activity_element: [],
        activate_node: function(nodeId){
            nodeList[nodeId].activate();
            this.activity_element.push({
                type: "node",
                id: nodeId
            })
        },
        activate_next: function(nodeId, targetId, textLen){
            nodeList[nodeId].activateNext(targetId, textLen);
            this.activity_element.push({
                type: "next",
                id: nodeId
            })
        },
        activate_backedge: function (nodeId) {
            nodeList[nodeId].activateBackedge();
            this.activity_element.push({
                type: "backedge",
                id: nodeId
            })
        },
        activate_text: function (nodeId, textLength) {
            nodeList[nodeId].highlightText(textLength);
            this.activity_element.push({
                type: "text",
                id: nodeId,
                length: textLength
            })

        },
        deactivate_all: function () {
            this.activity_element.forEach(function (element, id, array) {
                if (element.type === "node")
                    nodeList[element.id].deactivate();
                if (element.type === "next")
                    nodeList[element.id].deactivateNext();
                if (element.type === "backedge")
                    nodeList[element.id].deactivateBackedge();
                if (element.type === "text")
                    nodeList[element.id].undoHighlightText(element.length);
            });
            this.activity_element = [];
        },
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
                this.activate_node(this.current_node);
                this.activate_text(this.current_node, this.current_match.length);

                this.cur += 1;
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
                    this.activate_node(this.current_node);

                    this.current_match = this.current_match.slice(
                        this.current_match.length - nodeList[this.current_node].maxLen
                    );
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
    process.next();
}

function appendProcessFactory(appendText) {
    var appendProcess = {
        next: function () {
        }
    };
    return appendProcess;
}
function genAppendProcess(appendText) {
    forward();
    process = appendProcessFactory(appendText);
}

function next() {
    if (typeof(process) !== "undefined")
        process.next();
}

function forward() {
    if (typeof(process) !== "undefined")
        while(process.next())
            process.next();
}

function reset(){
    for (var i = 0; i < nodeList.length; i++){
        app.stage.removeChild(nodeList[i]);
        nodeList[i] = undefined;
    }
    init();
}

function init() {
    nodeList = [];
    nodeList.push(nodeFactory(0, 0, 0, ""));
    nodeList[0].x = unitX * 5;
    app.stage.addChild(nodeList[0]);
}

/*
struct Sam{
    void run(char *arr){
        int st = root,lens = 0;
        for(int i = 0;arr[i];i++){
            int x = arr[i] - 'a';
            if(nex[st][x] != -1){
                st = nex[st][x];
                lens++;
            }
            else{
                while(st != -1 && nex[st][x] == -1)
                    st = fa[st];
                if(st == -1)
                    st = root, lens = 0;
                else
                    lens = len[st]+1, st = nex[st][x];
            }
            //update maxlen
        }
    }
    int len[maxn*2],fa[maxn*2],nex[maxn*2][mlen];
    int _cnt,root,omg;
    int newNode(int L = 0){
        len[_cnt] = L;
        memset(nex[_cnt],fa[_cnt] = -1,sizeof(nex[_cnt]));
        return _cnt++;
    }
    void init(){
        _cnt = 0;
        root = omg = newNode();
    }
    void extend(int x){
        int ox = newNode(len[omg]+1);
        while(omg != -1 && nex[omg][x] == -1){
            nex[omg][x] = ox;
            omg = fa[omg];
        }
        if(omg == -1) fa[ox] = root;
        else{
            int omgx = nex[omg][x];
            if(len[omgx] == len[omg]+1) fa[ox] = omgx;
            else{
                int mgx = newNode(len[omg]+1);
                for(int i=0;i<mlen;i++)
                nex[mgx][i] = nex[omgx][i];
                fa[mgx] = fa[omgx];
                fa[omgx] = fa[ox] = mgx;
                while(omg != -1 && nex[omg][x] == omgx)
                    nex[omg][x] = mgx,omg = fa[omg];
            }
        }
        omg = ox;
    }
    void build(char *arr){
        init();
        for(int i=0;arr[i];i++){
            extend(arr[i] - 'a');
        }
    }
};
 */
