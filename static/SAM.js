gWidth = 1920;
gHeight = 2080;
var app = new PIXI.Application(
    gWidth,
    gHeight,
    {
        backgroundColor: 0xD6DaD9
    }
);

document.body.appendChild(app.view);

unitX = 23;
unitY = 28;
function nodeFactory(minLen, maxLen, nodeStr) {

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
        }
    }

    function onDragEnd() {
        this.alpha = 1;
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

    samNode.interactive = true;
    samNode.on('pointerdown', onDragStart)
           .on('pointerup', onDragEnd)
           .on('pointerupoutside', onDragEnd)
           .on('pointermove', onDragMove);


    var endText = new PIXI.Text(nodeStr);
    endText.x = verticalDis * unitX;
    samNode.addChild(endText);

    return samNode;
}

var one_node = nodeFactory(1, 6, "A");
one_node.x = unitX * 4;
one_node.y = unitY * 4;

app.stage.addChild(one_node);