const BGM_SONGS = [
    '/jets-game/sound/bgm/virtual-pilot.mp3',
    '/jets-game/sound/bgm/jets-xmas.mp3',
    '/jets-game/sound/bgm/since-2am.mp3'
];

const POPS = [
    '/jets-game/sound/pops/pop1.wav',
    '/jets-game/sound/pops/pop2.wav',
    '/jets-game/sound/pops/pop3.wav',
    '/jets-game/sound/pops/pop4.wav',
    '/jets-game/sound/pops/pop5.wav',
    '/jets-game/sound/pops/pop6.wav',
    '/jets-game/sound/pops/pop7.wav',
    '/jets-game/sound/pops/pop8.wav',
    '/jets-game/sound/pops/pop9.wav',
    '/jets-game/sound/pops/pop10.wav',
    '/jets-game/sound/pops/pop11.wav',
    '/jets-game/sound/pops/pop12.wav'
];

export default class SoundSystem {
    #game;

    #audioContext = new AudioContext();

    #bgmList = [];
    #bgmVolumeNode = this.#audioContext.createGain();
    #currentBgmIdx = 1;
    #bgm;
    #bgmVolume = 0.25;
    #bgmMute = false;

    #popList = [];
    #popVolume = 1;
    #popMute = false;

    
    constructor(game) {
        this.#game = game;

        this.#bgmVolumeNode.gain.value = this.#bgmVolume;
    }

    // accessors
    get isBgmMute() { return this.#bgmMute; }
    get isPopMute() { return this.#popMute; }

    // mutators
    set bgmVolume(newVal) { 
        this.#bgmVolume = newVal / 100;

        if(!this.#bgmMute){
            this.#bgmVolumeNode.gain.value = this.#bgmVolume;
        }
    }
    set popVolume(newVal) { this.#popVolume = newVal / 100};

    // initialize
    init(){
        // load songs
        BGM_SONGS.forEach((song) => {
            let track = new Audio(song);
            let audioNode = this.#audioContext.createMediaElementSource(track);

            this.#bgmList.push({
                track: track,
                node: audioNode
            })
        });

        // load pop sounds
        POPS.forEach((pop) => {
            this.#loadAudio(pop);
        });

        // start BGM
        this.#bgm = this.#bgmList[this.#currentBgmIdx];
        this.#bgm.track.loop = true;
        this.#bgm.node.connect(this.#bgmVolumeNode).connect(this.#audioContext.destination);
        
        let playAttempt = setInterval(() => {
            if(this.#audioContext.state === 'suspended'){
                this.#audioContext.resume();
            }

            this.#bgm.track.play()
                .then(() => {
                    clearInterval(playAttempt);
                    console.log("BGM play");
                })
                .catch((err) => {
                    // console.log(err, ": Unable to play BGM.");
                });
        }, 500)
    }

    // utility
    async #loadAudio(file) {
        const response = await fetch(file);
        this.#audioContext.decodeAudioData(await response.arrayBuffer())
            .then((value) => {
                this.#popList.push(value);
            });
    }

    toggleBgmMute() {
        this.#bgmMute = !this.#bgmMute;

        if(this.#bgmMute){
            this.#bgmVolumeNode.gain.value = 0;
        }
        else{
            this.#bgmVolumeNode.gain.value = this.#bgmVolume;
        }
    }

    togglePopMute() {
        this.#popMute = !this.#popMute;
    }

    changeBgm(song) {
        // reset previous bgm
        this.#bgm.track.pause();
        this.#bgm.currentTime = 0;

        // get index of new bgm
        this.#currentBgmIdx = song;

        this.#bgm = this.#bgmList[this.#currentBgmIdx];

        this.#bgm.track.loop = true;
        this.#bgm.node.connect(this.#bgmVolumeNode).connect(this.#audioContext.destination);

        this.#bgm.track.play();
    }
    
    playPop(){
        let idx = Math.floor(Math.random() * POPS.length);

        console.log("play pop: ", idx)

        console.log(this.#popList[idx])

        let popNode = this.#audioContext.createBufferSource();
        popNode.buffer =  this.#popList[idx];

        let volNode = this.#audioContext.createGain();
        if(!this.#popMute){
            volNode.gain.value = this.#popVolume;
        }
        else{
            volNode.gain.value = 0;
        }

        popNode.connect(volNode).connect(this.#audioContext.destination);
        popNode.start();
    }
}