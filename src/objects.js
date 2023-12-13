import { canvasToPhys, physToCanvas, radToPhys } from "./conversion.js";

const SPRITE_SHEET_COLS = 5;

const OBJECT_IMGs = [
    { img: document.getElementById('obj1'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj2'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj3'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj4'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj5'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj6'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj7'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj8'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj9'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj10'), fullBubble: false, anim: false, animFrames: 0 },
    { img: document.getElementById('obj11'), fullBubble: true, anim: true, animFrames: 30 },
]

const OBJ_RADII = [
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

const NUM_COMBINATION_FRAMES = 8;
const COMBINATION_FPS = 60;

const OBJ_DENSITY = 4;
const OBJ_FRICTION = 0.4;
const OBJ_RESTITUTION = 0.1;

export default class Object {
    // game instance
    #game;

    // object values
    #pos;                           // current render center point of object: {x: val, y: val}
    #lastPos;                       // pos from last frame (for interpolation)
    #size;                          // size index of the object: 0-10
    #radius;                        // radius value of object
    #followPlayer = false;          // whether or not object is attached to player

    // sprite values
    #spriteImg;                     // image element for the object
    #spriteImgWidth;                // width of sprite in image (full size if not sprite sheet)
    #spriteImgHeight;               // height of sprite in image
    #spriteWidth;                   // render width of sprite
    #spriteHeight;                  // render height of sprite
    #animated;                      // boolean whether object is animated
    #numAnimationFrames;            // number of frames of animation in sprite sheet
    #curAnimationFrame = 0;         // current animation frame to draw
    #animationDT;                   // delta time between animation frames
    #animationAccumulator = 0;      // accumulated time for animation

    // combination animation
    #combining = false;             // boolean whether the object is colliding
    #combinationDelta = null;       // distance to combination point: {dx: val, dy: val}
    #curCombinationFrame = 0;       // current combination frame to draw
    #combinationDT = 1000 / COMBINATION_FPS;    // delta time between combination frames
    #combinationAccumulator = 0;    // accumulated time for combination

    // physics
    #body = null;

    constructor(game, size, pos) {
        this.#game = game;
        
        let imgData = OBJECT_IMGs[size];
        this.#spriteImg = imgData.img;

        this.#pos = pos;
        this.#lastPos = pos;
        this.#size = size;
        this.#radius = OBJ_RADII[size];

        if(imgData.fullBubble){
            this.#spriteWidth = this.radius * 2;
            this.#spriteHeight = this.radius * 2;
        }
        else{
            this.#spriteWidth = (this.radius - 1) * Math.sqrt(2);
            this.#spriteHeight = (this.radius - 1) * Math.sqrt(2);
        }

        this.#animated = imgData.anim;
        this.#numAnimationFrames = imgData.animFrames;

        if(this.#animated){
            let dims = this.#getSpriteDimensions();
            this.#spriteImgWidth = dims.width;
            this.#spriteImgHeight = dims.height;

            this.#animationDT = 1000 / this.#numAnimationFrames;
        }
        else{
            this.#spriteImgWidth = this.#spriteImg.width;
            this.#spriteImgHeight = this.#spriteImg.height;
        }
    }

    // accessors
    get pos() { return this.#pos; }
    get size(){ return this.#size; }
    get radius() { return this.#radius; }
    get isMaxSize() { return this.#size == (OBJ_RADII.length - 1); }
    get isAnimated() { return this.#animated; }
    get isCombining() { return this.#combining; }

    // mutators
    set followPlayer(newVal) { this.#followPlayer = newVal; }

    startCombination(targetPos){
        this.#combining = true;

        this.#combinationDelta = {
            dx: targetPos.x - this.#pos.x,
            dy: targetPos.y - this.#pos.y
        }
    }

    createBody() {
        this.#body = this.#game.createBody({
            type: 'dynamic',
            position: canvasToPhys(this.#pos, this.#game.width, this.#game.height),
            allowSleep: false,
            userData: {gameObj: this}
        });

        this.#body.createFixture({
            shape: planck.Circle(radToPhys(this.#radius)),
            density: OBJ_DENSITY,
            friction: OBJ_FRICTION,
            restitution: OBJ_RESTITUTION
        });
    }

    destroyBody() {
        this.#game.destroyBody(this.#body);
        this.#body = null;
    }

    interpolate(alpha) {
        this.#pos.x = this.#pos.x * alpha + this.#lastPos.x * (1 - alpha);
        this.#pos.y = this.#pos.y * alpha + this.#lastPos.y * (1 - alpha);
    }

    // utility
    #getSpriteDimensions() {
        return {
            width: Math.round(this.#spriteImg.width / SPRITE_SHEET_COLS),
            height: Math.round(this.#spriteImg.height / Math.ceil( this.#numAnimationFrames / SPRITE_SHEET_COLS ))
        };
    }

    #getSpriteSheetCoords() {
        return {
            x: Math.floor(this.#curAnimationFrame % SPRITE_SHEET_COLS) * this.#spriteImgWidth,
            y: Math.floor(this.#curAnimationFrame / SPRITE_SHEET_COLS) * this.#spriteImgHeight
        };
    }

    #updateAnimation(numFrames) {
        this.#curAnimationFrame = (this.#curAnimationFrame + numFrames) % this.#numAnimationFrames;
    }

    #updateCombination(numFrames) {
        let updateFrames = Math.min(numFrames, NUM_COMBINATION_FRAMES - this.#curCombinationFrame);

        this.#pos.x += this.#combinationDelta.dx * (1 / NUM_COMBINATION_FRAMES) * updateFrames;
        this.#pos.y += this.#combinationDelta.dy * (1 / NUM_COMBINATION_FRAMES) * updateFrames;

        this.#curCombinationFrame += numFrames;

        if(this.#curCombinationFrame >= NUM_COMBINATION_FRAMES){
            this.#combining = false;
        }
    }

    // render
    draw(context) {
        let spritePos = {
            'x': this.#pos.x - (this.#spriteWidth * 0.5),
            'y': this.#pos.y - (this.#spriteHeight * 0.5)
        }

        let renderAngle = this.#body ? -this.#body.getAngle() : 0;

        // draw bubble
        context.beginPath();
        context.arc(this.#pos.x, this.#pos.y, this.#radius - 1, 0, 2 * Math.PI);
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        // draw sprite
        context.save();
        context.translate(spritePos.x + this.#spriteWidth * 0.5, spritePos.y + this.#spriteHeight * 0.5);
        context.rotate(renderAngle);

        if(this.#animated){
            let spriteSheetCoords = this.#getSpriteSheetCoords();

            context.drawImage(
                this.#spriteImg,
                spriteSheetCoords.x, spriteSheetCoords.y,
                this.#spriteImgWidth, this.#spriteImgHeight,
                -this.#spriteWidth * 0.5, -this.#spriteHeight * 0.5,
                this.#spriteWidth, this.#spriteHeight
            );
        }
        else{
            context.drawImage(
                this.#spriteImg,
                -this.#spriteWidth * 0.5, -this.#spriteHeight * 0.5,
                this.#spriteWidth, this.#spriteHeight
            );
        }

        context.restore();
    }

    // render just image for object circle in UI
    drawSimple(context, width, height) {
        let spritePos = {
            'x': this.#pos.x - width * 0.5,
            'y': this.#pos.y - height * 0.5
        }

        if(this.#animated){
            let spriteSheetCoords = this.#getSpriteSheetCoords();

            context.drawImage(
                this.#spriteImg,
                spriteSheetCoords.x, spriteSheetCoords.y,
                this.#spriteImgWidth, this.#spriteImgHeight,
                spritePos.x, spritePos.y,
                width, height
            );
        }
        else{
            context.drawImage(
                this.#spriteImg,
                spritePos.x, spritePos.y,
                width, height
            );
        }
    }

    // update
    update(frameTime) {
        this.#lastPos = this.#pos;

        if (this.#body){
            this.#pos = physToCanvas(this.#body.getPosition(), this.#game.width, this.#game.height);
        }
        else if(this.#followPlayer){
            this.#pos = {...this.#game.playerPos};
        }
        else if(this.#combining){
            this.#combinationAccumulator += frameTime;

            let numFrames = Math.floor(this.#combinationAccumulator / this.#combinationDT);

            this.#updateCombination(numFrames);
            this.#combinationAccumulator -= numFrames * this.#combinationDT;
        }

        if(this.#animated) {
            this.#animationAccumulator += frameTime;

            let numFrames = Math.floor(this.#animationAccumulator / this.#animationDT);

            this.#updateAnimation(numFrames);
            this.#animationAccumulator -= numFrames * this.#animationDT;
        }
    }
}