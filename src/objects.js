import { canvasToPhys, physToCanvas, radToPhys } from "./conversion.js";

export const OBJ11_SPRITE_WIDTH = 186;
export const OBJ11_SPRITE_HEIGHT = 186;
export const NUM_ANIM_FRAMES = 30;

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
];

const OBJ_DENSITY = 4;
const OBJ_FRICTION = 0.4;
const OBJ_RESTITUTION = 0.1;

class Object{
    constructor(game, radius, pos){
        this.game = game;
        this.radius = radius;
        this.lastPos = pos;
        this.pos = pos;

        this.size = OBJ_SIZES.indexOf(this.radius);

        this.body = null;

        this.followPlayer = false;
        this.markedForDelete = false;
    }

    setupImg(id, fullBubble = false, sprtWidth = null, sprtHeight = null, isAnim = false){
        this.image = document.getElementById(id);

        if(fullBubble){
            this.renderWidth = this.radius * 2;
            this.renderHeight = this.radius * 2;
        }
        else{
            this.renderWidth = (this.radius - 1) * Math.sqrt(2);
            this.renderHeight = (this.radius - 1) * Math.sqrt(2);
        }

        this.spriteWidth = sprtWidth ? sprtWidth : this.image.width;
        this.spriteHeight = sprtHeight ? sprtHeight : this.image.height;

        this.animated = isAnim;
        this.animationFrame = 0;
    }

    // accessors
    getPos(){ return this.pos; }
    getRadius(){ return this.radius; }
    getSize(){ return this.size; }
    isMaxRadius(){ return this.radius == OBJ_SIZES[10]; }
    isMarkedForDelete(){ return this.markedForDelete; }
    isAnimated(){ return this.animated; }

    // mutators
    setFollowPlayer(){ this.followPlayer = true; }
    markForDelete(){ this.markedForDelete = true; }
    updateAnimation(numFrames){ this.animationFrame = (this.animationFrame + numFrames) % NUM_ANIM_FRAMES}

    createBody(){
        this.body = this.game.createBody({
            type: 'dynamic',
            position: canvasToPhys(this.pos, this.game.width, this.game.height),
            allowSleep: false,
            userData: {gameObj: this}
        });

        this.body.createFixture({
            shape: planck.Circle(radToPhys(this.radius)),
            density: OBJ_DENSITY,
            friction: OBJ_FRICTION,
            restitution: OBJ_RESTITUTION
        });
    }

    destroyBody(){
        this.game.destroyBody(this.body);
        this.body = null;
    }

    interpolate(alpha){
        this.pos.x = this.pos.x * alpha + this.lastPos.x * (1 - alpha);
        this.pos.y = this.pos.y * alpha + this.lastPos.y * (1 - alpha);
    }

    // utility 
    getSpriteCoords(){
        return {
            x: Math.floor(this.animationFrame % 5) * this.spriteWidth,
            y: Math.floor(this.animationFrame / 5) * this.spriteHeight
        }
    }

    // render
    draw(context){
        let renderPos = {
            'x': this.pos.x - (this.renderWidth * 0.5),
            'y': this.pos.y - (this.renderHeight * 0.5)
        }

        let renderAngle = this.body ? -this.body.getAngle() : 0;

        // draw bubble
        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius - 1, 0, 2*Math.PI);
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        // draw sprite
        context.save();
        context.translate(renderPos.x + this.renderWidth / 2, renderPos.y + this.renderHeight / 2);
        context.rotate(renderAngle);

        if(this.animated){
            let spriteSheetCoords = this.getSpriteCoords();

            context.drawImage(
                this.image,
                spriteSheetCoords.x, spriteSheetCoords.y,
                this.spriteWidth, this.spriteHeight,
                -this.renderWidth / 2, -this.renderHeight / 2,
                this.renderWidth, this.renderHeight
            );
        }
        else{
            context.drawImage(
                this.image,
                -this.renderWidth / 2, -this.renderHeight / 2,
                this.renderWidth, this.renderHeight
            );
        }

        context.restore();
    }

    // update
    update(){
        this.lastPos = this.pos;

        if (this.body){
            this.pos = physToCanvas(this.body.getPosition(), this.game.getWidth(), this.game.getHeight());
        }
        else if(this.followPlayer){
            this.pos = this.game.getPlayerPos();
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
        this.setupImg('obj11', true, OBJ11_SPRITE_WIDTH, OBJ11_SPRITE_HEIGHT, true);
    }
}