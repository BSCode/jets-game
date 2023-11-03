import UI from './ui.js'
import Container from './container.js'
import Player from './player.js'
import * as obj from './objects.js'
import { canvasToPhys, physToCanvas } from './conversion.js';

const GRAVITY = planck.Vec2(0, -10);
const PHYSICS_DT = 1000 / 240;
const ANIMATION_DT = 1000 / 30;
const MOVE_CONSTRAINT_BUFFER = 5;
const DROP_DELAY = 400;
const GAMEOVER_SECONDS = 5;
const OBJECT_TYPES = [
    obj.ObjectSize1,
    obj.ObjectSize2,
    obj.ObjectSize3,
    obj.ObjectSize4,    
    obj.ObjectSize5,
    obj.ObjectSize6,
    obj.ObjectSize7,
    obj.ObjectSize8,
    obj.ObjectSize9,
    obj.ObjectSize10,
    obj.ObjectSize11
]

export default class Game {
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.ui = new UI(this);
        this.container = new Container(this);
        this.player = new Player(this);
        
        this.world = planck.World(GRAVITY);
        this.physAccumulator = 0;
        this.animAccumulator = 0;

        this.score = 0;

        this.activeObjects = [];
        this.objsToCreate = [];
        this.largestObject = 4;

        this.gameOverY = this.container.getTopEdge();
        this.gameOverX = [this.container.getLeftEdge(), this.container.getRightEdge()]

        this.gameOverTimer = null;
        this.gameOver = false;

        this.currentObject;
        this.nextObject;

        this.inputPos = {
            x: this.canvas.width * 0.5,
            y: this.canvas.height * 0.5
        }
        this.inputWidthScale = 1;
        this.inputHeightScale = 1;

        this.touch = null;

        this.dropObject = false;
        this.dropTimer = 0;

        this.hidden = false;
        this.skip = false;
    }

    // accessors
    getWidth(){ return this.width; }
    getHeight(){ return this.height; }
    getInputPos(){ return this.inputPos; }
    getPlayerPos(){ return this.player.getPos(); }
    getContainerRightEdge(){ return this.container.getRightEdge(); }
    getLargestObject(){ return this.largestObject; }
    getScore(){ return this.score; }
    getGameOverY(){ return this.gameOverY; }
    getGameOverTimer(){ return this.gameOverTimer; }
    isGameOver() { return this.gameOver; }
    
    // physics bodies
    createBody(bodyDef){
        return this.world.createBody(bodyDef);
    }
    destroyBody(body){
        this.world.destroyBody(body);
    }

    // utility
    init(){
        this.container.createBody();
        this.player.setAimTarget(this.container.getBottomEdge());

        const rect = this.canvas.getBoundingClientRect();

        this.inputWidthScale = rect.width / this.width;
        this.inputHeightScale = rect.height / this.height;

        // setup eventListeners
        this.canvas.addEventListener('pointermove', (e) => {
            if(this.touch == null || e.pointerId == this.touch){
                this.inputPos.x = e.offsetX / this.inputWidthScale;
                this.inputPos.y = e.offsetY / this.inputHeightScale;
            }
        })

        this.canvas.addEventListener('pointerdown', (e) => {
            if(this.touch == null){
                if(e.pointerType == 'touch'){
                    this.touch = e.pointerId;
                    this.inputPos.x = e.offsetX / this.inputWidthScale;
                    this.inputPos.y = e.offsetY / this.inputHeightScale;
                }
                else{
                    this.dropObject = true;
                }
            }
        })

        this.canvas.addEventListener('pointerup', (e) => {
            if(this.touch != null && e.pointerId == this.touch){
                this.dropObject = true;
                this.touch = null;
            }
        })

        this.canvas.addEventListener('pointercancel', (e) => {
            if(this.touch){
                this.touch = null;
            }
        })

        // reset button
        document.addEventListener('keydown', (e) => {
            if(e.key === 'r' || e.key === 'R'){
                this.reset();
            }
        })

        this.canvasObserver = new ResizeObserver(() => {
            const rect = this.canvas.getBoundingClientRect();

            this.inputWidthScale = rect.width / this.width;
            this.inputHeightScale = rect.height / this.height;
        })

        this.canvasObserver.observe(this.canvas);

        document.addEventListener('visibilitychange', () => {
            console.log('visibility change', document.visibilityState);
            if(document.visibilityState === 'hidden'){
                this.hidden = true;
                this.skip = true;
            }
            else{
                this.hidden = false;
            }
        })

        // collision event listener
        this.world.on('begin-contact', (contact) => {
            const objA = contact.getFixtureA().getBody().getUserData().gameObj;
            const objB = contact.getFixtureB().getBody().getUserData().gameObj;
            const contactPoint = contact.getWorldManifold().points[0];
            
            // check if objects are the same
            if(objA.radius == objB.radius){
                // do nothing if either object is used for another contact
                if(objA.isMarkedForDelete() || objB.isMarkedForDelete()){
                    return;
                }

                // mark both for deletion
                objA.markForDelete();
                objB.markForDelete();

                // add score
                let nextSize = objA.getSize() + 1;

                this.score += (Math.pow(nextSize, 2) + nextSize) / 2;

                // queue up a new object if they were not max size
                if(!objA.isMaxRadius()){
                    this.objsToCreate.push({
                        size: nextSize,
                        pos: physToCanvas(contactPoint, this.width, this.height)
                    })
                }
            }
        })

        this.reset();
    }

    reset(){
        this.largestObject = 4;
        this.score = 0;
        this.gameOver = false;
        this.gameOverTimer = null;
        this.dropObject = false;

        // remove all objects
        this.activeObjects.forEach((obj) => {
            obj.destroyBody();
        })
        this.activeObjects = [];

        this.player.reset();

        //make first objects
        this.currentObject = this.generateObject(this.player.getPos());
        this.currentObject.setFollowPlayer(true);

        this.player.setMoveConstraint(
            this.container.getLeftEdge() + this.currentObject.getRadius() + MOVE_CONSTRAINT_BUFFER,
            this.container.getRightEdge() - this.currentObject.getRadius() - MOVE_CONSTRAINT_BUFFER
        )

        this.nextObject = this.generateObject(this.ui.getNextObjPos());
    }

    generateObject(pos){
        let idx = Math.floor(Math.random() * 5);

        return new OBJECT_TYPES[idx](this, pos);
    }

    drop(){
        this.activeObjects.push(this.currentObject);
        this.currentObject.createBody();
        this.currentObject.setFollowPlayer(false);

        this.currentObject = this.nextObject;
        this.currentObject.setFollowPlayer(true);

        this.player.setMoveConstraint(
            this.container.getLeftEdge() + this.currentObject.getRadius() + MOVE_CONSTRAINT_BUFFER,
            this.container.getRightEdge() - this.currentObject.getRadius() - MOVE_CONSTRAINT_BUFFER
        )

        this.nextObject = this.generateObject(this.ui.getNextObjPos());
    }

    checkOutOfBounds(obj){
        let objPos = obj.getPos();

        return objPos.y <= this.gameOverY || objPos.x <= this.gameOverX[0] || objPos.x >= this.gameOverX[1];
    }

    checkGameOver(frameTime){
        let outOfBounds = false;
        this.activeObjects.forEach((obj) => {
            if(this.checkOutOfBounds(obj)){
                outOfBounds = true;
            }
        })

        if(outOfBounds){
            if(!this.gameOverTimer){
                this.gameOverTimer = 1000 * GAMEOVER_SECONDS;
            }
            else {
                this.gameOverTimer -= frameTime;
            }

            if(this.gameOverTimer <= 0){
                this.gameOver = true;
            }
        }
        else{
            this.gameOverTimer = null;
        }
    }

    // render
    render(context){
        // draw UI
        this.ui.draw(context);

        // draw player
        this.player.draw(context);

        // draw container
        this.container.draw(context);

        // draw active objects
        this.activeObjects.forEach(obj => {
            obj.draw(context);
        })

        // draw inactive objects
        if(!this.gameOver){
            this.currentObject.draw(context);
            this.nextObject.draw(context);
        }
    }

    // update
    update(frameTime){
        if(!this.gameOver && !this.skip && !isNaN(frameTime)){
            this.physAccumulator += frameTime;
            this.animAccumulator += frameTime;
            // drop object
            if(this.dropTimer > 0){
                this.dropTimer -= frameTime;
                this.dropObject = false;
            }
            else if(this.dropObject){
                this.drop();
                this.dropObject = false;
                this.dropTimer = DROP_DELAY;
            }

            while(this.physAccumulator >= PHYSICS_DT){
                // simulate
                this.world.step(PHYSICS_DT / 1000);
                this.physAccumulator -= PHYSICS_DT;

                // update objs
                // remove colliided objects
                this.activeObjects = this.activeObjects.filter((obj) => {
                    if(obj.isMarkedForDelete()){
                        obj.destroyBody();
                    }

                    return !obj.isMarkedForDelete();
                })

                // create new objects
                this.objsToCreate.forEach( (o) => {
                    let newObj = new OBJECT_TYPES[o.size](this, o.pos);
                    newObj.createBody();
                    this.activeObjects.push(newObj);

                    if(o.size > this.largestObject){
                        this.largestObject = o.size;
                    }
                })

                // reset list
                this.objsToCreate.length = 0;

                // update active objects
                this.activeObjects.forEach( (o) => {
                    o.update();
                })
            }

            // interpolate
            this.activeObjects.forEach((o) => {
                o.interpolate(this.physAccumulator / PHYSICS_DT);
            })

            // update animations
            let numAnimFrames = Math.floor(this.animAccumulator / ANIMATION_DT);
            this.animAccumulator -= ANIMATION_DT * numAnimFrames;

            this.activeObjects.forEach((obj) => {
                if(obj.isAnimated()){
                    obj.updateAnimation(numAnimFrames);
                }
            })
            if(this.currentObject.isAnimated()){
                this.currentObject.updateAnimation(numAnimFrames);
            }
            if(this.nextObject.isAnimated()){
                this.nextObject.updateAnimation(numAnimFrames);
            }

            // update player
            this.player.update();
   
            // update inactive objects
            this.currentObject.update();
            this.nextObject.update();

            // check game over
            this.checkGameOver(frameTime);
        }
        else if(!this.hidden){
            this.skip = false;
            console.log('skipped first');
        }
    }
}