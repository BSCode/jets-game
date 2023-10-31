const PLAYER_Y = 90;
const SPRITE_OFFSET_X = -30;
const SPRITE_OFFSET_Y = -30;

export default class Player {
    constructor(game){
        this.game = game;

        this.pos = {
            'x': this.game.getWidth() * 0.5,
            'y': PLAYER_Y
        }

        this.moveConstraint = []

        this.image = document.getElementById("player");

        this.spriteWidth = this.image.width * 0.5;
        this.spriteHeight = this.image.height * 0.5;
        this.spritePos = {
            'x': this.pos.x - (this.spriteWidth * 0.5) + SPRITE_OFFSET_X,
            'y': this.pos.y - (this.spriteHeight * 0.5) + SPRITE_OFFSET_Y
        }

        this.aimTarget = this.game.getHeight();
    }

    // accessors
    getPos(){ return this.pos; }

    // mutators
    setPos(newPos){ this.pos = newPos; }
    setMoveConstraint(left, right){ this.moveConstraint=[left, right]; }
    setAimTarget(val){ this.aimTarget = val; }

    // render
    draw(context){
        if(!this.game.isGameOver()){

            context.drawImage(
                this.image,
                this.spritePos.x, this.spritePos.y,
                this.spriteWidth, this.spriteHeight
            );

            context.beginPath();
            context.moveTo(this.pos.x, this.pos.y);
            context.lineTo(this.pos.x, this.aimTarget);
            context.stroke()

            // debug draw circle at center
            // context.beginPath();
            // context.arc(this.pos.x, this.pos.y, 10, 0, 2*Math.PI);
            // context.save();
            // context.globalAlpha = 0.5;
            // context.fill();
            // context.restore();
            // context.stroke();
        }
    }

    // update
    update(){
        this.pos.x = Math.min(
            this.moveConstraint[1],
            Math.max(this.game.getInputPos().x, this.moveConstraint[0])
        );

        this.spritePos.x = this.pos.x - this.spriteWidth * 0.5 + SPRITE_OFFSET_X;
    }

    reset(){
        this.pos.x = this.game.getWidth() * 0.5;
        this.spritePos.x = this.pos.x - this.spriteWidth * 0.5 + SPRITE_OFFSET_X;
    }
}