import { OBJ11_SPRITE_WIDTH, OBJ11_SPRITE_HEIGHT, NUM_ANIM_FRAMES} from "./objects.js";

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
    #objectImgs = [];
    #gameOverImg = document.getElementById(GAMEOVER_IMG_ID);
    #largestObject = 4;

    // animation
    #animationFrame = 0;


    constructor(game){
        this.#game = game;

        this.#makeObjCircle();
    }

    // accessors
    get nextObjectPos() { return NEXT_OBJ_POS; }

    // mutators
    set largestObject(size) { this.#largestObject = size; }

    updateAnimation(numFrames) {
        this.#animationFrame = (this.#animationFrame + numFrames) % NUM_ANIM_FRAMES;
    }

    // utility
    #makeObjCircle(){
        for(let i = 0; i < 11; ++i){
            let angle = 2 * Math.PI * ((i + 1) / 12) - (Math.PI / 2);

            let imgCenter = {
                x: Math.cos(angle) * OBJ_CIRCLE_RADIUS + OBJ_CIRCLE_CENTER.x,
                y: Math.sin(angle) * OBJ_CIRCLE_RADIUS + OBJ_CIRCLE_CENTER.y
            }
            
            this.objectImgs.push({
                img: document.getElementById('obj' + (i + 1)),
                x: imgCenter.x - OBJ_CIRCLE_IMG_WIDTH / 2,
                y: imgCenter.y - OBJ_CIRCLE_IMG_HEIGHT / 2
            });
        }

    }

    #getSpriteSheetCoords() {
        return {
            x: Math.floor(this.animationFrame % 5) * OBJ11_SPRITE_WIDTH,
            y: Math.floor(this.animationFrame / 5) * OBJ11_SPRITE_HEIGHT
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
        this.#objectImgs.forEach((obj, idx) => {
            if(idx > this.#largestObject){
                context.drawImage(
                    this.#questionMarkImg,
                    obj.x, obj.y,
                    OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT
                )
            }
            else if(idx < 10){
                context.drawImage(
                    obj.img,
                    obj.x, obj.y,
                    OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT
                )
            }
            else{
                let spriteSheetCoords = this.#getSpriteSheetCoords();

                context.drawImage(
                    obj.img,
                    spriteSheetCoords.x, spriteSheetCoords.y,
                    OBJ11_SPRITE_WIDTH, OBJ11_SPRITE_HEIGHT,
                    obj.x, obj.y,
                    OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT
                )
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
}