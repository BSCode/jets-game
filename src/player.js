const PLAYER_IMG_ID = "player";
const SPRITE_OFFSET_X = -30;
const SPRITE_OFFSET_Y = -30;

const PLAYER_Y = 90;
const MOVE_CONSTRAINT_BUFFER = 5;

export default class Player {
    // game instance
    #game;                      

    // player sprite
    static #spriteImg = document.getElementById(PLAYER_IMG_ID);
    static #spriteWidth = this.#spriteImg.width * 0.5;      
    static #spriteHeight = this.#spriteImg.height * 0.5;
    #spritePos;                 // current pos of sprite offset from player:
                                //  {x: val, y: val}
    #aimTarget;                 // Y value to end aiming line

    // player positioning
    #pos;                       // player position {x: val, y: val} 
    #moveConstraint = {};       // player move constraints {left: val, right: val}


    constructor(game){
        this.#game = game;

        this.#pos = {
            'x': this.#game.width * 0.5,
            'y': PLAYER_Y
        }

        this.#spritePos = {
            'x': this.#pos.x - (Player.#spriteWidth * 0.5) + SPRITE_OFFSET_X,
            'y': this.#pos.y - (Player.#spriteHeight * 0.5) + SPRITE_OFFSET_Y
        }

        this.aimTarget = this.#game.containerBottom;
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
        if(!this.#game.isGameOver()){
            context.drawImage(
                Player.#spriteImg,
                this.#spritePos.x, this.#spritePos.y,
                Player.#spriteWidth, Player.spriteHeight
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

        this.#spritePos.x = this.#pos.x - Player.#spriteWidth * 0.5 + SPRITE_OFFSET_X;
    }

    reset() {
        this.#pos.x = this.game.width * 0.5;
        this.#spritePos.x = this.pos.x - Player.#spriteWidth * 0.5 + SPRITE_OFFSET_X;
    }
}