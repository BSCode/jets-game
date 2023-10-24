import UI from './ui.js'
import Container from './container.js'
import Player from './player.js'
import * as obj from './objects.js'
import { canvasToPhys, physToCanvas } from './conversion.js';

const GRAVITY = planck.Vec2(0, -10);
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

        this.score = 0;

        this.activeObjects = [];
        this.objsToCreate = [];
        this.largestObject = 4;

        this.gameOverY = this.container.getTopEdge();
        this.gameOverX = [this.container.getLeftEdge(), this.container.getRightEdge()]
        this.objOOB = false;
        this.gameOverTimer = null;
        this.gameOver = false;

        this.currentObject;
        this.nextObject;

        this.mouse = {
            x: this.width * 0.5,
            y: this.height * 0.5
        }

        this.dropObject = false;
        this.dropTimer = 0;
    }

    // accessors
    getWidth(){ return this.width; }
    getHeight(){ return this.height; }
    getMouse(){ return this.mouse; }
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

    init(){
        // setup eventListeners
        this.canvas.addEventListener('mousedown', (e) => {
            this.dropObject = true;
        })

        this.canvas.addEventListener('mousemove', (e) => {
           this.mouse.x = e.offsetX;
           this.mouse.y = e.offsetY;
        })

        document.addEventListener('keydown', (e) => {
            if(e.key === 'r' || e.key === 'R'){
                this.reset();
            }
        })

        // collision event listener
        this.world.on('begin-contact', (contact) => {
            const objA = contact.getFixtureA().getBody().getUserData().gameObj;
            const objB = contact.getFixtureB().getBody().getUserData().gameObj;
            const contactPoint = contact.getWorldManifold().points[0];
            
            // check if objects are the same and not max size
            if(objA.radius == objB.radius && !objA.isMaxRadius()){
                // do nothing if either object is used for another contact
                if(objA.isMarkedForDelete() || objB.isMarkedForDelete()){
                    return;
                }

                // mark both for deletion
                objA.markForDelete();
                objB.markForDelete();

                // queue up a new object
                this.objsToCreate.push({
                    size: objA.getNextSize(),
                    pos: physToCanvas(contactPoint, this.width, this.height)
                })
                
            }
        })

        this.container.createBody();
        this.player.setAimTarget(this.container.getBottomEdge());

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

    update(dt){
        if(!this.gameOver){
            this.world.step(dt / 1000);

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
                this.score += (Math.pow(o.size, 2) + o.size) / 2;
            })

            this.objsToCreate.length = 0;

            this.player.update();

            if(this.dropTimer > 0){
                this.dropTimer -= dt;
                this.dropObject = false;
            }
            else if(this.dropObject){
                this.drop();
                this.dropObject = false;
                this.dropTimer = DROP_DELAY;
            }

            this.currentObject.update()
            this.nextObject.update()

            this.objOOB = false;
            this.activeObjects.forEach( (o) => {
                o.update();

                let objPos = o.getPos();

                if (objPos.y <= this.gameOverY ||
                     objPos.x <= this.gameOverX[0] ||
                      objPos.x >= this.gameOverX[1]){
                    
                    this.objOOB = true;
                }
            })
            
            if(this.objOOB){
                if(!this.gameOverTimer){
                    this.gameOverTimer = 1000 * GAMEOVER_SECONDS;
                }
                else {
                    this.gameOverTimer -= dt;
                }
    
                if(this.gameOverTimer <= 0){
                    this.gameOver = true;
                }
            }
            else{
                this.gameOverTimer = null;
            }
        }
    }
}