import Object from "./objects.js";

const UI_IMG_ID = "ui";
const QM_IMG_ID = "qm";
const GAMEOVER_IMG_ID = "gameover";
const NEXT_OBJ_POS = {x: 1065, y: 196};
const SCORE_POS = {x: 198, y: 345};
const OBJ_CIRCLE_CENTER = {x: 1064 , y: 492};
const OBJ_CIRCLE_RADIUS = 106;
const OBJ_CIRCLE_IMG_WIDTH = 48;
const OBJ_CIRCLE_IMG_HEIGHT = 48;
const GAMEOVER_TIMER_OFFSET_X = 50;
const GAMEOVER_OFFSET_Y = 10;

export default class UI{
    // game instance
    #game;

    // images
    #uiImg = document.getElementById(UI_IMG_ID);
    #questionMarkImg = document.getElementById(QM_IMG_ID);
    #gameOverImg = document.getElementById(GAMEOVER_IMG_ID);

    // object circle
    #objectCircle = [];             // list of objects for object circle
    #largestObject = 4;             // largest object made this game

    constructor(game){
        this.#game = game;

        this.#makeObjCircle();
    }

    // accessors
    get nextObjectPos() { return NEXT_OBJ_POS; }
    get largestObject() { return this.#largestObject; }

    // mutators
    set largestObject(size) { this.#largestObject = size; }

    // utility
    #makeObjCircle(){
        for(let i = 0; i < 11; ++i){
            let angle = 2 * Math.PI * ((i + 1) / 12) - (Math.PI / 2);

            let pos = {
                x: Math.cos(angle) * OBJ_CIRCLE_RADIUS + OBJ_CIRCLE_CENTER.x,
                y: Math.sin(angle) * OBJ_CIRCLE_RADIUS + OBJ_CIRCLE_CENTER.y
            }
            
            this.#objectCircle.push(new Object(this.#game, i, pos));
        }
    }

    // render
    draw(context) {
        // draw main UI
        context.drawImage(
            this.#uiImg,
            0,0,
            this.#uiImg.width, this.#uiImg.height
        );

        // draw object circle
        this.#objectCircle.forEach((obj, idx) => {
            if(idx > this.#largestObject){
                context.drawImage(
                    this.#questionMarkImg,
                    obj.pos.x - (OBJ_CIRCLE_IMG_WIDTH * 0.5), obj.pos.y - (OBJ_CIRCLE_IMG_HEIGHT * 0.5),
                    OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT
                )
            }
            else{
                obj.drawSimple(context, OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT);
            }

        })

        context.fillText(
            this.#game.score,
            SCORE_POS.x, SCORE_POS.y
        );

        if(this.#game.gameOverTimer > 0){
            context.fillText(
                (this.#game.gameOverTimer / 1000).toFixed(2),
                this.#game.containerRight + GAMEOVER_TIMER_OFFSET_X, this.#game.containerTop
            );
        }

        if(this.#game.isGameOver){
            context.drawImage(
                this.#gameOverImg,
                this.#game.width * 0.5 - this.#gameOverImg.width * 0.5, GAMEOVER_OFFSET_Y,
                this.#gameOverImg.width, this.#gameOverImg.height
            )
        }
    }

    // update
    update(frameTime) {
        this.#objectCircle.forEach((obj) => {
            obj.update(frameTime);
        })
    }

    reset() {
        this.#largestObject = 4;
    }
}