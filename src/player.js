const PLAYER_IMG_ID = "player";
const SPRITE_SCALE = 0.5;
const SPRITE_OFFSET_X = -30;
const SPRITE_OFFSET_Y = -30;

const PLAYER_Y = 90;
const MOVE_CONSTRAINT_BUFFER = 5;

export default class Player {
    // game instance
    #game;                      

    // player sprite
    #spriteImg = document.getElementById(PLAYER_IMG_ID);
    #spriteWidth = this.#spriteImg.width * SPRITE_SCALE;      
    #spriteHeight = this.#spriteImg.height * SPRITE_SCALE;
    #aimTarget;                     // Y value to end aiming line

    // player positioning
    #pos;                           // player position {x: val, y: val} 
    #moveConstraint = {};           // player move constraints {left: val, right: val}


    constructor(game){
        this.#game = game;

        this.#pos = {
            'x': this.#game.width * 0.5,
            'y': PLAYER_Y
        }

        this.#aimTarget = this.#game.containerBottom;
    }

    // accessors
    get pos() { return this.#pos; }

    // mutators
    set pos(newPos) { this.#pos = newPos; }

    setMoveConstraint(objRadius) { 
        this.#moveConstraint = {
            left: this.#game.containerLeft + objRadius + MOVE_CONSTRAINT_BUFFER,
            right: this.#game.containerRight - objRadius - MOVE_CONSTRAINT_BUFFER
        };
    }

    // render
    draw(context) {
        let spritePos = {
            'x': this.#pos.x - (this.#spriteWidth * 0.5) + SPRITE_OFFSET_X,
            'y': this.#pos.y - (this.#spriteHeight * 0.5) + SPRITE_OFFSET_Y
        }

        if(!this.#game.isGameOver){
            context.drawImage(
                this.#spriteImg,
                spritePos.x, spritePos.y,
                this.#spriteWidth, this.#spriteHeight
            );

            context.beginPath();
            context.moveTo(this.#pos.x, this.#pos.y);
            context.lineTo(this.#pos.x, this.#aimTarget);
            context.stroke()
        }
    }

    // update
    update() {
        this.#pos.x = Math.min(
            this.#moveConstraint.right,
            Math.max(this.#game.input.x, this.#moveConstraint.left)
        );
    }

    reset() {
        this.#pos.x = this.#game.width * 0.5;
    }
}