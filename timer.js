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
const timer_stats_button = document.getElementById('timer-stats-button');
const stats_work_sessions = document.getElementById('work-sessions');
const stats_work_time = document.getElementById('work-time');
const stats_break_sessions = document.getElementById('break-sessions');
const stats_break_time = document.getElementById('break-time');
const status_div = document.getElementById('status');

// hide button focus styling on mouse up 
// - (stops clicking button from creating focus styling but keeps accessibility)
$('.timer-button').mouseup(function() {
    this.blur();
});

// audio - alerts
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
let timer_stats_show = false;
let timer_status = 0; // 0=none, 1=working, 2=breaking, 3=paused


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

// ms time to x hours x mins x seconds
function msToTimeString(ms) {
    let seconds_value = Math.floor(ms/1000);
    let minutes_value = Math.floor((seconds_value / 60) % 60);
    let hours_value = Math.floor((minutes_value / 60) % 60);
    return String(hours_value) + "h " + String(minutes_value) + "m " + String(seconds_value) + "s";
}

// update stats display
function updateStats() {
    stats_work_sessions.innerHTML = String(works);
    stats_work_time.innerHTML = msToTimeString(works * work_time + (total_ms_passed * Number(!breaking)));
    stats_break_sessions.innerHTML = String(breaks);
    stats_break_time.innerHTML = msToTimeString(breaks * break_time + (total_ms_passed * Number(breaking)));
}

//update status display
function updateStatus() {
    switch (timer_status) {
        case 1:
            $("#status").css("display", "block");
            status_div.innerHTML = "Working...";
            break;
        case 2:
            $("#status").css("display", "block");
            status_div.innerHTML = "Breaking";
            break;
        case 3:
            $("#status").css("display", "block");
            status_div.innerHTML = "Paused";
            break;
        default: 
            $("#status").css("display", "none");
            break;
    }
}

// play-pause button function
start_button.addEventListener('click', function() {
    if (running == true) {
        running = false;
        paused = true;
        start_button.innerHTML = "Resume";
        saved_time = total_ms_passed;
        clearInterval(timer_interval);
        timer_status = 3;
        updateStatus()
    }
    else { 
        running = true;
        paused = false;
        start_button.innerHTML = "Pause";
        start_time = Date.now() - saved_time;
        // triggers every 1000 milliseconds
        timer_interval = setInterval(timerTick, 100);
        if (breaking == false) {timer_status = 1;} else {timer_status = 2;}
        updateStatus()
    }
});

// reset button
reset_button.addEventListener('click', function() {
    clearInterval(timer_interval);
    running = false;
    paused = false;
    total_ms_passed = 0;
    saved_time = 0;
    timer_status = 0;
    updateStatus()
    printOutput();
    start_button.innerHTML = "Start";

});


// timer stats button
timer_stats_button.addEventListener('click', function() {
    if (timer_stats_show == true) {
        timer_stats_show = false;
        timer_stats_button.innerHTML = "show stats";
        $("#timer-stats").css("display", "none");
    }
    else {
        timer_stats_show = true;
        timer_stats_button.innerHTML = "hide stats";
        $("#timer-stats").css("display", "block");
    }
});


// timer interval
function timerTick() {

    current_time = Date.now();
    total_ms_passed = current_time - start_time;

    updateTimeVariables();
    updateStats();

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
            timer_status = 2;
            updateStatus()
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
            timer_status = 1;
            updateStatus()
        }
    }

    printOutput()

}



// debugging
const debug_interval = setInterval(function() {
    debug.innerHTML = "works: " + works + " | breaks: " + breaks + " | breaking: " + breaking + " | running: " + running + " | saved_time: " + saved_time + " | total_ms_passed: " + total_ms_passed;
}
, 100)
