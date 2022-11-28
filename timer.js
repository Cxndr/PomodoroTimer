window.onload = function() {
}

function padTo2Digits(num) {
    return num.toString().padStart(2,"0");
}

// get elements
const timer_text = document.getElementById('timer-text');
const debug = document.getElementById('debug');
const start_button = document.getElementById('start-button');
const reset_button = document.getElementById('reset-button');
const timer_buttons = document.getElementsByClassName('timer-button');

// hide button focus styling on mouse up 
// - (stops clicking button from creating focus styling but keeps accessibility)
$('.timer-button').mouseup(function() {
    this.blur();
});

// audio - alerts
let audio_break_alert = new Audio('/sound/hi/1/1.wav');
let audio_work_alert = new Audio('/sound/hi/3/1.wav');

function audioAlert(type) {
    let random_alert = Math.floor(Math.random() * 3) + 1;
    let random_alert_string = String(random_alert);
    let audio_alert;
    let file_path;
    switch(type) {
        case 0: // break alert
            file_path = "/sound/hi/1/" + random_alert_string + ".wav";
            audio_alert = new Audio(file_path);
            audio_alert.play();
            break;
        
        case 1: // work alert
            file_path = "/sound/hi/3/" + random_alert_string + ".wav";
            audio_alert = new Audio(file_path);
            audio_alert.play();
            break;
        
        default:
            break;
        
    }

}


// object variables
let timer_interval;

// mechanical variables
let start_time = Date.now();
let current_time = Date.now();
let saved_time = 0;
let total_ms_passed = 0;
let total_seconds_passed;
let seconds;
let minutes;
let output;
const work_time = 3 * 1000; // * 1000 for ms to seconds
const break_time = 3 * 1000;
let works = 0;
let breaks = 0;
let breaking = false;
let running = false;
let paused = false;


// need to run after updating "works" or "breaks"
function updateTimeVariables() {
    work_time_current = work_time * works;
    break_time_current = break_time * breaks;
    work_time_rollover = work_time * (works + 1);
    break_time_rollover = break_time * (breaks + 1);
}

function printOutput() {
    total_seconds_passed = Math.floor(total_ms_passed / 1000);
    minutes = Math.floor(total_seconds_passed / 60);
    seconds = Math.floor(total_seconds_passed % 60);
    output = minutes + ":" + padTo2Digits(seconds);
    timer_text.innerHTML = output;
}


// play-pause button function
start_button.addEventListener('click', function() {
    if (running == true) {
        running = false;
        paused = true;
        start_button.innerHTML = "Resume";
        saved_time = total_ms_passed;
        clearInterval(timer_interval);
    }
    else { 
        running = true;
        paused = false;
        start_button.innerHTML = "Pause";
        start_time = Date.now() - saved_time;
        // triggers every 1000 milliseconds
        timer_interval = setInterval(timerTick, 100);
    }
});


// reset button
reset_button.addEventListener('click', function() {
    clearInterval(timer_interval);
    running = false;
    paused = false;
    total_ms_passed = 0;
    saved_time = 0;
    printOutput();
    start_button.innerHTML = "Start";

});


// timer interval
function timerTick() {

    current_time = Date.now();
    total_ms_passed = current_time - start_time;

    updateTimeVariables();

    // switch to break
    if (breaking == false) {
        if ( total_ms_passed >= ( work_time ) ) {
            works += 1;
            updateTimeVariables();
            breaking = true;
            total_ms_passed = 0;
            saved_time = 0;
            start_time = Date.now();
            audioAlert(0);
        }
    }

    // switch to work
    if (breaking == true) {
        if ( total_ms_passed >= ( break_time ) ) {
            breaks += 1;
            updateTimeVariables();
            breaking = false;
            total_ms_passed = 0;
            saved_time = 0;
            start_time = Date.now();
            audioAlert(1);
        }
    }

    printOutput()

}



// debugging
const debug_interval = setInterval(function() {
    debug.innerHTML = "works: " + works + " | breaks: " + breaks + " | breaking: " + breaking + " | running: " + running + " | saved_time: " + saved_time + " | total_ms_passed: " + total_ms_passed;
}
, 100)
