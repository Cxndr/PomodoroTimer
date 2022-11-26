window.onload = function() {
}

function padTo2Digits(num) {
    return num.toString().padStart(2,"0");
}

// get elements
const timer_text = document.getElementById('timer-text');
const debug = document.getElementById('debug');

// mechanical variables
const start_time = Date.now();
let current_time = Date.now();
let total_seconds_passed;
let seconds;
let minutes;
let output;
const work_time = (10);
const break_time = 5;
let works = 0;
let breaks = 0;
let breaking = false;

// need to run after updating "works" or "breaks"
function updateTimeVariables() {
    work_time_current = work_time * works;
    break_time_current = break_time * breaks;
    work_time_rollover = work_time * (works + 1);
    break_time_rollover = break_time * (breaks + 1);
}

// triggers every 1000 milliseconds
const timer_interval = setInterval(function() {

    current_time = Date.now();
    total_seconds_passed = Math.floor( (current_time - start_time) / 1000 );

    updateTimeVariables();

    // switch to break
    if (breaking == false) {
        if ( total_seconds_passed >= ( work_time_rollover + break_time_current ) ) {
            works += 1;
            updateTimeVariables();
            breaking = true;
        }
    }

    // switch to work
    if (breaking == true) {
        if ( total_seconds_passed >= ( break_time_rollover + work_time_current ) ) {
            breaks += 1;
            updateTimeVariables();
            breaking = false;
        }
    }

    minutes = Math.floor(total_seconds_passed / 60);
    seconds = Math.floor(total_seconds_passed % 60);

    output = minutes + ":" + padTo2Digits(seconds);
    timer_text.innerHTML = output;
    

    // debugging
    debug.innerHTML = "works: " + works + " | breaks: " + breaks + " | breaking: " + breaking;


}
, 1000)


