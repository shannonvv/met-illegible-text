let randomDigits = [];
let synth;
let merger;
let audioStarted = false;


function playSynth(confidenceLevel) {
    audioStarted = true;
    if (drawing) {

    //let frequencyValue = confidenceLevel * 50;
    synth = new Tone.Synth({
        frequency: 100,
        
    }).toDestination();
    synth.triggerAttack(100, .1);
    //synth.triggerAttackRelease(100, 2.);
    Tone.Master.volume.value = 12;
}
    //Tone.Master.volume.rampTo(12, 0.0001);
}

function quitSynth() {
    synth.stop;
    audioStarted = false;
    Tone.Master.volume.value = -Infinity;
}

function updateButtonText() {
    const toggleButton = document.getElementById('toggle_button');
    toggleButton.textContent = audioStarted ? 'Audio on' : 'Audio off';
}

function toggleLoop() {
    console.log('toggling')
    if (audioStarted === true) {
        quitSynth();
        console.log('Audio has been turned off.');
   } else if (audioStarted === false) {
        playSynth();
        console.log('Audio has been turned on.');
    }
    updateButtonText();
}

document.getElementById("toggle_button").addEventListener("click", () => toggleLoop());