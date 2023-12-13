import { canvasToPhys, physToCanvas } from "./conversion.js";

const CONTAINER_WIDTH = 450;
const CONTAINER_HEIGHT = 500;
const CONTAINER_EDGE_WIDTH = 20;
const CONTAINER_HEIGHT_SHIFT = 50;
const CONTAINER_FRICTION = 0.4;

export default class Container {
    // game instance
    #game;

    // container dimenions
    #width = CONTAINER_WIDTH;
    #height = CONTAINER_HEIGHT;
    #edgeWidth = CONTAINER_EDGE_WIDTH;
    #leftEdge;                      // left edge pixel x coord
    #rightEdge;                     // right edge pixel x coord
    #topEdge;                       // top edge pixel y coord
    #bottomEdge;                    // bottom edge pixel y coord

    // physics
    #body = null;

    constructor(game) {
        this.#game = game;

        this.#leftEdge = (this.#game.width * 0.5) - (this.#width * 0.5);
        this.#rightEdge = (this.#game.width * 0.5) + (this.#width * 0.5);
        this.#topEdge = (this.#game.height * 0.5) - (this.#height * 0.5) + CONTAINER_HEIGHT_SHIFT;
        this.#bottomEdge = (this.#game.height * 0.5) + (this.#height * 0.5) + CONTAINER_HEIGHT_SHIFT;
    }

    // accessors
    get leftEdge() { return this.#leftEdge; }
    get rightEdge() { return this.#rightEdge; }
    get topEdge() { return this.#topEdge; }
    get bottomEdge() { return this.#bottomEdge; }

    // mutators
    createBody() {
        let topLeft = {
            x: this.#leftEdge,
            y: this.#topEdge
        }

        let bottomLeft = {
            x: this.#leftEdge,
            y: this.#bottomEdge
        }

        let topRight = {
            x: this.#rightEdge,
            y: this.#topEdge
        }

        let bottomRight = {
            x: this.#rightEdge,
            y: this.#bottomEdge
        }

        this.#body = this.#game.world.createBody({
            position: planck.Vec2(0,0),
            userData: { gameObj: this}
        });

        this.#body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(topLeft, this.#game.width, this.#game.height),
                    canvasToPhys(bottomLeft, this.#game.width, this.#game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
        this.#body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(topRight, this.#game.width, this.#game.height),
                    canvasToPhys(bottomRight, this.#game.width, this.#game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
        this.#body.createFixture({
            shape: planck.Edge(
                    canvasToPhys(bottomLeft, this.#game.width, this.#game.height),
                    canvasToPhys(bottomRight, this.#game.width, this.#game.height)
                   ),
            friction: CONTAINER_FRICTION
        })
    }

    // render
    draw(context) {

        // left side
        context.fillRect(
            this.#leftEdge - this.#edgeWidth, this.#topEdge,
            this.#edgeWidth, this.#height
        )

        //right side
        context.fillRect(
            this.#rightEdge, this.#topEdge,
            this.#edgeWidth, this.#height
        )

        // bottom
        context.fillRect(
            this.#leftEdge - this.#edgeWidth, this.#bottomEdge,
            this.#width + (this.#edgeWidth * 2), this.#edgeWidth
        )
    }
}