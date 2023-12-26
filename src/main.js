import Game from './game.js'

window.addEventListener('load', function(){
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');

    canvas.width = 1280;
    canvas.height = 720;

    ctx.fillStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.font = "bold 32px/1 'Fira Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaselign = "bottom";

    const game = new Game(canvas);
    game.init()

    const resetBtn = this.document.getElementById('reset-btn');
    resetBtn.onclick = function(){
        game.reset();
    }

    const fsContainer = this.document.getElementById('fullscreen-container');

    const fsBtn = this.document.getElementById('fullscreen-btn');
    fsBtn.onclick = function(){
        fsContainer.requestFullscreen();
    }

    const tgBtn = this.document.getElementById('touch-guard-btn');
    tgBtn.onclick = function(){
        if(fsContainer.style.touchAction === 'auto'){
            fsContainer.style.touchAction = 'none';
            tgBtn.innerHTML = '<i class="fa fa-gamepad"></i> Browser Control: OFF';
        }
        else{
            fsContainer.style.touchAction = 'auto';
            tgBtn.innerHTML = '<i class="fa fa-gamepad"></i> Browser Control: ON';
        }
    }
    
    let lastTime = 0;
    function animate(timeStamp){
        let frameTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        game.update(frameTime);

        game.render(ctx, frameTime);
        
        requestAnimationFrame(animate);
    }

    animate();
})