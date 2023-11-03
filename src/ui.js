import { OBJ11_SPRITE_WIDTH, OBJ11_SPRITE_HEIGHT, NUM_ANIM_FRAMES} from "./objects.js";

const NEXT_OBJ_POS = {x: 1065, y: 196};
const SCORE_POS = {x: 198, y: 345};
const OBJ_CIRCLE_CENTER = {x: 1064 , y: 492};
const OBJ_CIRCLE_RADIUS = 106;
const OBJ_CIRCLE_IMG_WIDTH = 48;
const OBJ_CIRCLE_IMG_HEIGHT = 48;
const GAMEOVER_OFFSET_Y = 10;

export default class UI{
    constructor(game){
        this.game = game;

        this.uiImg = this.uiImg = document.getElementById('ui');

        this.questionMarkImg = document.getElementById("qm");
        this.objectImgs = []
        this.makeObjCircle();
        this.animationFrame = 0;

        this.gameOverImg = document.getElementById("gameover");
    }

    // accessors
    getNextObjPos(){ return NEXT_OBJ_POS; }

    // utility
    makeObjCircle(){
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

    // render
    draw(context){
        context.drawImage(
            this.uiImg,
            0,0,
            this.uiImg.width, this.uiImg.height
        );

        this.objectImgs.forEach((obj, idx) => {
            if(idx > this.game.getLargestObject()){
                context.drawImage(
                    this.questionMarkImg,
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
                context.drawImage(
                    obj.img,
                    Math.floor(this.animationFrame % 5) * OBJ11_SPRITE_WIDTH, Math.floor(this.animationFrame / 5) * OBJ11_SPRITE_HEIGHT,
                    OBJ11_SPRITE_WIDTH, OBJ11_SPRITE_HEIGHT,
                    obj.x, obj.y,
                    OBJ_CIRCLE_IMG_WIDTH, OBJ_CIRCLE_IMG_HEIGHT
                )
                this.animationFrame = (this.animationFrame + 0.5) % NUM_ANIM_FRAMES;
            }

        })

        context.fillText(
            this.game.getScore(),
            SCORE_POS.x, SCORE_POS.y
        );

        if(this.game.getGameOverTimer() > 0){
            context.fillText(
                (this.game.getGameOverTimer() / 1000).toFixed(2),
                this.game.getContainerRightEdge() + 50, this.game.getGameOverY()
            );
        }

        if(this.game.isGameOver()){
            context.drawImage(
                this.gameOverImg,
                this.game.getWidth() * 0.5 - this.gameOverImg.width * 0.5, GAMEOVER_OFFSET_Y,
                this.gameOverImg.width, this.gameOverImg.height
            )
        }

    }
}