import { canvasToPhys, physToCanvas, radToPhys } from "./conversion.js";

export const OBJ11_SPRITE_WIDTH = 186;
export const OBJ11_SPRITE_HEIGHT = 186;
export const OBJ11_NUM_ANIM_FRAMES = 30;

const OBJ_SIZES = [
    14,
    20,
    27,
    33,
    42,
    50,
    61,
    72,
    84,
    96,
    124
]

class Object{
    constructor(game, radius, pos){
        this.game = game;
        this.radius = radius;
        this.pos = pos;

        this.nextSize = OBJ_SIZES.indexOf(this.radius) + 1;

        this.body = null;

        this.followPlayer = false;
        this.markedForDelete = false;
    }

    setupImg(id){
        this.image = document.getElementById(id);

        this.spriteWidth = this.radius * Math.sqrt(2);
        this.spriteHeight = this.radius * Math.sqrt(2);
        this.spritePos = {
            'x': this.pos.x - (this.spriteWidth * 0.5),
            'y': this.pos.y - (this.spriteHeight * 0.5)
        }
        this.spriteAngle = 0;
    }

    getPosY(){ return this.pos.y; }
    getRadius(){ return this.radius; }
    getNextSize(){ return this.nextSize; }
    isMaxRadius(){ return this.radius == OBJ_SIZES[10]; }
    isMarkedForDelete(){ return this.markedForDelete; }

    setFollowPlayer(){ this.followPlayer = true; }
    markForDelete(){ this.markedForDelete = true; }

    draw(context){
        // draw bubble
        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        // draw sprite
        context.save();
        context.translate(this.spritePos.x + this.spriteWidth / 2, this.spritePos.y + this.spriteHeight / 2);
        context.rotate(this.spriteAngle);
        context.drawImage(
            this.image,
            -this.spriteWidth / 2, -this.spriteHeight / 2,
            this.spriteWidth, this.spriteHeight
        );
        context.restore();
    }

    createBody(){
        this.body = this.game.createBody({
            type: 'dynamic',
            position: canvasToPhys(this.pos, this.game.width, this.game.height),
            userData: {gameObj: this}
        });

        this.body.createFixture({
            shape: planck.Circle(radToPhys(this.radius)),
            density: 0.1,
            friction: 1
        });
    }

    destroyBody(){
        this.game.destroyBody(this.body);
        this.body = null;
    }

    update(){
        if (this.body){
            this.pos = physToCanvas(this.body.getPosition(), this.game.getWidth(), this.game.getHeight());
            this.spriteAngle = -this.body.getAngle();
        }
        else if(this.followPlayer){
            this.pos = this.game.getPlayerPos();
        }

        this.spritePos = {
            'x': this.pos.x - (this.spriteWidth * 0.5),
            'y': this.pos.y - (this.spriteHeight * 0.5)
        }
        
    }
}

export class ObjectSize1 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[0], pos);
        this.setupImg('obj1');
    }
}

export class ObjectSize2 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[1], pos);
        this.setupImg('obj2');
    }
}

export class ObjectSize3 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[2], pos);
        this.setupImg('obj3');
    }
}

export class ObjectSize4 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[3], pos);
        this.setupImg('obj4');
    }
}

export class ObjectSize5 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[4], pos);
        this.setupImg('obj5');
    }
}

export class ObjectSize6 extends Object{
    constructor(game, pos){
        super(game, OBJ_SIZES[5], pos);
        this.setupImg('obj6');
    }
}

export class ObjectSize7 extends Object{
    constructor(game, pos){
        super(game,OBJ_SIZES[6], pos);
        this.setupImg('obj7');
    }
}

export class ObjectSize8 extends Object{
    constructor(game, pos){
        super(game,OBJ_SIZES[7], pos);
        this.setupImg('obj8');
    }
}

export class ObjectSize9 extends Object{
    constructor(game, pos){
        super(game,OBJ_SIZES[8], pos);
        this.setupImg('obj9');
    }
}

export class ObjectSize10 extends Object{
    constructor(game, pos){
        super(game,OBJ_SIZES[9], pos);
        this.setupImg('obj10');
    }
}

export class ObjectSize11 extends Object{
    constructor(game, pos){
        super(game,OBJ_SIZES[10], pos);
        this.setupImg('obj11');
        this.nextSize = null;

        this.animationFrame = 0;
    }

    getSpriteCoords(){
        return {
            x: Math.floor(this.animationFrame % 5) * this.imgWidth,
            y: Math.floor(this.animationFrame / 5) * this.imgHeight
        }
    }

    draw(context){
        // draw bubble
        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        // draw sprite
        let spriteSheetCoords = this.getSpriteCoords()

        context.save();
        context.translate(this.spritePos.x + this.spriteWidth / 2, this.spritePos.y + this.spriteHeight / 2);
        context.rotate(this.spriteAngle);
        context.drawImage(
            this.image,
            spriteSheetCoords.x, spriteSheetCoords.y,
            this.imgWidth, this.imgHeight,
            -this.spriteWidth / 2, -this.spriteHeight / 2,
            this.spriteWidth, this.spriteHeight
        );
        context.restore();

        this.animationFrame = (this.animationFrame + 0.5) % OBJ11_NUM_ANIM_FRAMES;
    }

}