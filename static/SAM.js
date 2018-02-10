gWidth = 2080;
gHeight = 850;
gFontFamily = 'Consolas, Monaco, monospace';

var app = new PIXI.Application(
    gWidth,
    gHeight,
    {
        backgroundColor: 0xD6DaD9
    }
);

document.body.appendChild(app.view);

unitX = 15;
unitY = 23;

function textFactory(rawString) {
    function activate(){

    }
    function deactivate(){

    }
    function highLight(start, end) {
        
    }
    var text = new PIXI.Text(
        rawString,
        new PIXI.TextStyle({
            fontFamily: gFontFamily
        })
    );
    return text;
}

function arrowFactory(startPoint, endPoint){
    //todo:
    function update(){

    }
    function activate(){

    }
    function deactivate(){

    }


}

function backLinkFactory() {
    //todo:
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
        }
    }
    function onDragEnd() {
        this.alpha = 0.5;
        this.dragging = false;
        this.data = null;
    }

    var verticalDis = maxLen - minLen + 1;
    function genGraphics() {
        var trapesoid = new PIXI.Polygon([
            new PIXI.Point(verticalDis * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, 0),
            new PIXI.Point((maxLen + 1) * unitX, verticalDis * unitY),
            new PIXI.Point(0, verticalDis * unitY)
        ]);

        var graphics = new PIXI.Graphics();
        graphics.beginFill(0X00B5AD, 1);
        graphics.drawPolygon(trapesoid);
        return graphics;
    }
    var samNode = new PIXI.Sprite(genGraphics().generateTexture());

    for (i  = 1; i <= verticalDis; i++)
    {
        function onTextOver() {
            this.alpha = 1
        }
        function onTextOut() {
            this.alpha = this.defaultAlpha;
        }
        var oneText = new PIXI.Text(nodeStr.slice(verticalDis - i),
            new PIXI.TextStyle(
                {
                    fontFamily: 'Consolas, Monaco, monospace'
                }));
        oneText.x = (verticalDis - i + 1) * unitX;
        oneText.y = (i - 1) * unitY;
        if (i === 1 || i === verticalDis){
            oneText.defaultAlpha = 0.5;
        }
        else{
            oneText.defaultAlpha = 0;
        }
        oneText.alpha = oneText.defaultAlpha;
        oneText.interactive = true;
        oneText
            .on('pointerover',onTextOver)
            .on('pointerout', onTextOut);
        samNode.addChild(oneText);
    }

    samNode.interactive = true;
    samNode
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    samNode.alpha = 0.5;

    return samNode;
}

var one_node = nodeFactory(3, 6, "AQWDRA");
one_node.x = unitX * 4;
one_node.y = unitY * 4;

var two_node = nodeFactory(5, 6, "QWDRAB");
two_node.x = unitX * 10;
two_node.y = unitY * 10;

app.stage.addChild(one_node);
app.stage.addChild(two_node);
