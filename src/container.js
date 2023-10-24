import { canvasToPhys, physToCanvas } from "./conversion.js";

const CONTAINER_WIDTH = 450;
const CONTAINER_HEIGHT = 500;
const CONTAINER_MATERIAL_WIDTH = 20;
const CONTAINER_HEIGHT_SHIFT = 50;
const CONTAINER_FRICTION = 0.4;

export default class Container {
    constructor(game){
        this.game = game;

        this.width = CONTAINER_WIDTH;
        this.height = CONTAINER_HEIGHT;

        this.body = null;

        this.materialWidth = CONTAINER_MATERIAL_WIDTH;

        this.leftEdge = (this.game.getWidth() * 0.5) - (this.width * 0.5);
        this.rightEdge = (this.game.getWidth() * 0.5) + (this.width * 0.5);
        this.topEdge = (this.game.getHeight() * 0.5) - (this.height * 0.5) + CONTAINER_HEIGHT_SHIFT;
        this.bottomEdge = (this.game.getHeight() * 0.5) + (this.height * 0.5) + CONTAINER_HEIGHT_SHIFT;

    }

    getLeftEdge(){
        return this.leftEdge;
    }

    getRightEdge(){
        return this.rightEdge;
    }

    getTopEdge(){
        return this.topEdge;
    }

    getBottomEdge(){
        return this.bottomEdge;
    }

    draw(context){

        // left side
        context.fillRect(
            this.leftEdge - this.materialWidth, this.topEdge,
            this.materialWidth, this.height
        )

        //right side
        context.fillRect(
            this.rightEdge, this.topEdge,
            this.materialWidth, this.height
        )

        // bottom
        context.fillRect(
            this.leftEdge - this.materialWidth, this.bottomEdge,
            this.width + (this.materialWidth * 2), this.materialWidth
        )
       
    }

    createBody(){
        let topLeft = {
            x: this.leftEdge,
            y: this.topEdge
        }

        let bottomLeft = {
            x: this.leftEdge,
            y: this.bottomEdge
        }

        let topRight = {
            x: this.rightEdge,
            y: this.topEdge
        }

        let bottomRight = {
            x: this.rightEdge,
            y: this.bottomEdge
        }

        this.body = this.game.world.createBody({
            position: planck.Vec2(0,0),
            userData: { gameObj: this}
        });

        this.body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(topLeft, this.game.width, this.game.height),
                    canvasToPhys(bottomLeft, this.game.width, this.game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
        this.body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(topRight, this.game.width, this.game.height),
                    canvasToPhys(bottomRight, this.game.width, this.game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
        this.body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(bottomLeft, this.game.width, this.game.height),
                    canvasToPhys(bottomRight, this.game.width, this.game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
    }
}