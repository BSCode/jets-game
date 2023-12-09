import UI from './ui.js';
import Container from './container.js';
import Player from './player.js';
import { OBJECT_TYPES } from './objects.js';
import { canvasToPhys, physToCanvas } from './conversion.js';

const GRAVITY = planck.Vec2(0, -10);
const PHYSICS_DT = 1000 / 240;          // 240 hz
const THIRTY_FPS_DT = 1000 / 30;
const SIXTY_FPS_DT = 1000 / 60;

const DROP_DELAY_SECONDS = 0.5;
const GAMEOVER_SECONDS = 5;


export default class Game {
    // singleton tracker
    static #instance;

    // canvas
    #canvas;
    #canvasObserver = new ResizeObserver(this.#setInputScaling);

    // class instances
    #ui = new UI(this);
    #container = new Container(this);
    #player = new Player(this);

    // input values
    #inputPos;                      // current input location: {x: val, y: val}
    #inputWidthScale = 1;           // scaling input values to scaled canvas
    #inputHeightScale = 1;
    #touchID = null;                // touch ID to track first touch

    // physics and update loop
    #world = planck.World(GRAVITY);
    #physicsAccumulator = 0;        // accumulator for physics sim
    #thirtyFPSAccumulator = 0;      // accumulator for 30 fps animations
    #sixtyFPSAccumulator = 0;       // accumulator for 60 fps animations

    // object tracking
    #currentObject = null;          // current object that will be dropped
    #nextObject = null;             // next object that will be queued after drop
    #activeObjects = [];            // list of active objects that have physics
    #combiningObjects = [];         // list of objects in combining animation
    #objectsToCreate = [];          // list of objects to be created after physics step           // largest object created for UI

    // pause on hide and skip first frame
    #hidden = false;                // track when tab is hidden and pause                
    #skip = false;                  // skip frame after un-hide b/c large frame time

    // game values
    #score = 0;                     // current score

    #tryDropObject = false;         // player tried to drop object this frame
    #dropDelayTimer = 0;            // delay timer between dropping objects

    #gameOver = false;              // track if gameover
    #gameOverTimer = null;          // track if object is out of bounds too long

    constructor(canvas) {
        if(Game.#instance){
            return Game.#instance;
        }
        Game.#instance = this;

        this.#canvas = canvas;

        this.#inputPos = {
            x: this.#canvas.width * 0.5,
            y: this.#canvas.height * 0.5
        }
    }

    // accessors
    get width() { return this.#canvas.width; }
    get height() { return this.#canvas.height; }
    get playerPos() { return this.#player.pos; }
    get containerLeft() { return this.#container.leftEdge; }
    get containerRight() { return this.#container.rightEdge; }
    get containerTop() { return this.#container.topEdge; }
    get containerBottom() { return this.#container.bottomEdge; }
    get input() { return this.#inputPos; }
    get world() { return this.#world; }
    get score() { return this.#score; }
    get gameOverTimer() { return this.#gameOverTimer; }
    get isGameOver() { return this.#gameOver; }
    
    // initialization
    init() {
        // create container phyics
        this.#container.createBody();

        // input scaling
        this.#setInputScaling();
        this.#canvasObserver.observe(this.#canvas);

        // setup input eventListeners
        this.#canvas.addEventListener('pointermove', (e) => {
            if(this.#touchID == null || e.pointerId == this.#touchID){
                this.#inputPos.x = e.offsetX / this.#inputWidthScale;
                this.#inputPos.y = e.offsetY / this.#inputHeightScale;
            }
        })

        this.#canvas.addEventListener('pointerdown', (e) => {
            if(this.#touchID == null){
                if(e.pointerType == 'touch'){
                    this.#touchID = e.pointerId;
                    this.#inputPos.x = e.offsetX / this.#inputWidthScale;
                    this.#inputPos.y = e.offsetY / this.#inputHeightScale;
                }
                else{
                    this.#tryDropObject = true;
                }
            }
        })

        this.#canvas.addEventListener('pointerup', (e) => {
            if(this.#touchID != null && e.pointerId == this.#touchID){
                this.#tryDropObject = true;
                this.#touchID = null;
            }
        })

        this.#canvas.addEventListener('pointercancel', (e) => {
            this.#touchID = null;
        })

        // reset button
        document.addEventListener('keydown', (e) => {
            if(e.key === 'r' || e.key === 'R'){
                this.reset();
            }
        })

        document.addEventListener('visibilitychange', () => {
            console.log('visibility change', document.visibilityState);
            if(document.visibilityState === 'hidden'){
                this.#hidden = true;
                this.#skip = true;
            }
            else{
                this.#hidden = false;
            }
        })

        // collision event listener
        this.#world.on('begin-contact', (contact) => {
            const objA = contact.getFixtureA().getBody().getUserData().gameObj;
            const objB = contact.getFixtureB().getBody().getUserData().gameObj;
            const contactPoint = contact.getWorldManifold().points[0];
            
            // check if objects are the same
            if(objA.radius == objB.radius){
                // do nothing if either object is used for another contact
                if(objA.isCombining() || objB.isCombining()){
                    return;
                }

                let canvasPoint = physToCanvas(contactPoint, this.width, this.height);

                // mark both for deletion
                objA.startCombination(canvasPoint);
                objB.startCombination(canvasPoint);

                // add score
                let nextSize = objA.getSize() + 1;

                this.#score += (Math.pow(nextSize, 2) + nextSize) / 2;

                // queue up a new object if they were not max size
                if(!objA.isMaxRadius()){
                    this.#objectsToCreate.push({
                        size: nextSize,
                        pos: canvasPoint
                    });
                }
            }
        })

        this.reset();
    }

    // reset game
    reset() {
        // reset accumulators
        this.#physicsAccumulator = 0;
        this.#thirtyFPSAccumulator = 0;
        this.#sixtyFPSAccumulator = 0;

        // remove all existing objects
        this.#activeObjects.forEach((obj) => {
            obj.destroyBody();
        })
        this.#activeObjects = [];
        this.#combiningObjects = [];
        this.#objectsToCreate = [];

        // reset player
        this.#player.reset();

        // reset game values
        this.#score = 0;

        this.#tryDropObject = false;
        this.#dropDelayTimer = 0;

        this.#gameOver = false;
        this.#gameOverTimer = null;

        // make first objects
        this.#currentObject = this.#generateObject(this.#player.pos);
        this.#currentObject.followPlayer = true;
        this.#player.setMoveConstraint(this.#currentObject.radius);

        this.#nextObject = this.#generateObject(this.#ui.nextObjectPos);
    }

    // physics bodies
    createBody(bodyDef) {
        return this.#world.createBody(bodyDef);
    }
    destroyBody(body) {
        this.#world.destroyBody(body);
    }

    // utility
    #setInputScaling() {
        // set input scaling based on canvas size
        const rect = this.#canvas.getBoundingClientRect();

        this.#inputWidthScale = rect.width / this.#canvas.width;
        this.#inputHeightScale = rect.height / this.#canvas.height;
    }

    #generateObject(pos) {
        let idx = Math.floor(Math.random() * 5);
        // idx = 9
        return new OBJECT_TYPES[idx](this, pos);
    }

    #dropObject() {
        this.#activeObjects.push(this.#currentObject);
        this.#currentObject.createBody();
        this.#currentObject.followPlayer = false;

        this.#currentObject = this.#nextObject;
        this.#currentObject.followPlayer = true;

        this.player.setMoveConstraint(this.#currentObject.radius)

        this.nextObject = this.#generateObject(this.#ui.nextObjectPos);
    }

    #checkOutOfBounds(obj) {
        return ( 
            obj.pos.y <= this.containerTop ||
            obj.pos.x <= this.containerLeft ||
            obj.pos.x >= this.containerRight
        );
    }

    #checkGameOver(frameTime) {
        let outOfBounds = false;

        this.#activeObjects.forEach((obj) => {
            if(this.#checkOutOfBounds(obj)){
                outOfBounds = true;
            }
        })

        if(outOfBounds){
            if(this.#gameOverTimer == null){
                this.#gameOverTimer = 1000 * GAMEOVER_SECONDS;
            }
            else {
                this.#gameOverTimer -= frameTime;
            }

            if(this.#gameOverTimer <= 0){
                this.#gameOver = true;
            }
        }
        else{
            this.#gameOverTimer = null;
        }
    }    


    // render
    render(context) {
        // draw UI
        this.#ui.draw(context);

        // draw player
        this.#player.draw(context);

        // draw container
        this.#container.draw(context);

        // draw active objects
        this.#activeObjects.forEach(obj => {
            obj.draw(context);
        })

        this.#combiningObjects.forEach(obj => {
            obj.draw(context);
        })

        // draw inactive objects
        if(!this.#gameOver){
            this.#currentObject.draw(context);
            this.#nextObject.draw(context);
        }
    }

    // update
    update(frameTime) {
        if(!this.#skip && !isNaN(frameTime)){
            // update accumulators
            this.#physicsAccumulator += frameTime;
            this.#thirtyFPSAccumulator += frameTime;
            this.#sixtyFPSAccumulator += frameTime;

            // 30fps animation frames
            let numAnimFrames = Math.floor(this.#thirtyFPSAccumulator / THIRTY_FPS_DT);
            this.#thirtyFPSAccumulator -= THIRTY_FPS_DT * numAnimFrames;

            // 60fps animation frames
            let numCombFrames = Math.floor(this.#sixtyFPSAccumulator / SIXTY_FPS_DT);
            this.#sixtyFPSAccumulator -= SIXTY_FPS_DT * numCombFrames;

            // remove objects that are done combining
            this.#combiningObjects = this.#combiningObjects.filter((obj) => {
                return obj.isCombining();
            })

            // game logic
            if(!this.#gameOver){
                // drop object
                if(this.#dropDelayTimer > 0){
                    // cancel drop
                    this.#dropDelayTimer -= frameTime;
                    this.#tryDropObject = false;
                }
                else if(this.dropObject){
                    this.#tryDropObject();
                    this.#tryDropObject = false;
                    this.#dropDelayTimer = DROP_DELAY_SECONDS * 1000;
                }

                // physics loop
                while(this.physAccumulator >= PHYSICS_DT){
                    // simulate
                    this.world.step(PHYSICS_DT / 1000);
                    this.physAccumulator -= PHYSICS_DT;

                    // update objs
                    // remove colliided objects
                    this.#activeObjects = this.#activeObjects.filter((obj) => {
                        if(obj.isCombining()){
                            obj.destroyBody();
                            this.#combiningObjects.push(obj);
                        }

                        return !obj.isCombining();
                    })

                    // create new objects
                    this.#objectsToCreate.forEach( (o) => {
                        let newObj = new OBJECT_TYPES[o.size](this, o.pos);
                        newObj.createBody();
                        this.#activeObjects.push(newObj);

                        if(o.size > this.largestObject){
                            this.#ui.largestObject = o.size;
                        }
                    })

                    // reset list
                    this.#objectsToCreate = [];

                    // update active objects
                    this.#activeObjects.forEach( (obj) => {
                        obj.update();
                    })
                } // end physics loop

                // interpolate
                this.#activeObjects.forEach((obj) => {
                    obj.interpolate(this.#physicsAccumulator / PHYSICS_DT);
                })

                // update animations
                this.#ui.updateAnimation(numAnimFrames);

                if(numAnimFrames > 0){
                    this.#activeObjects.forEach((obj) => {
                        if(obj.isAnimated()){
                            obj.updateAnimation(numAnimFrames);
                        }
                    })
                }

                if(this.#currentObject.isAnimated()){
                    this.#currentObject.updateAnimation(numAnimFrames);
                }

                if(this.#nextObject.isAnimated()){
                    this.#nextObject.updateAnimation(numAnimFrames);
                }

                // update player
                this.#player.update();
    
                // update inactive objects
                this.#currentObject.update();
                this.#nextObject.update();

                // check game over
                this.#checkGameOver(frameTime);
            } // end game logic

            // update combining objects regardless of gameover
            if(numCombFrames > 0){
                this.#combiningObjects.forEach((obj) => {
                    obj.updateCombination(numCombFrames);
                })
            }
        }
        else if(!this.#hidden){
            this.#skip = false;
            console.log('skipped first frame');
        }
    }
}