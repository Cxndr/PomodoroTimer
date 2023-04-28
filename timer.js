window.onload = function() {
}

// mechanical functions
function padTo2Digits(num) {
    return num.toString().padStart(2,"0");
}


// ******************* //TIMER *******************//

// get elements
const timer_text = document.getElementById('timer-text');
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

// settings variables
let work_time = 10 * 1000; // * 1000 for seconds to ms
let break_time = 10 * 1000;
let work_playlist = "";
work_playlist = "https://www.youtube.com/playlist?list=PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i";
let work_playlist_lastplayed_timestamp = 0;
let work_playlist_lastplayed_index = 0;
let break_playlist = "";
break_playlist = "https://www.youtube.com/playlist?list=PLrQHJyrdiNuaU4E9erO20CFwhzSii7eam";
let break_playlist_lastplayed_timestamp = 0;
let break_playlist_lastplayed_index = 0;
let sfx_volume = 5;
let music_volume = 40;

// mechanical variables
let timer_interval;
let start_time = Date.now();
let current_time = Date.now();
let saved_time = 0;
let total_ms_passed = 0;
let total_seconds_passed;
let seconds;
let minutes;
let output;
let works = 0;
let breaks = 0;
let breaking = false;
let running = false;
let paused = false;
let timer_stats_show = false;
let timer_status = 0; // 0=none, 1=working, 2=breaking, 3=paused
let settings_open = false;
let current_playlist = "https://www.youtube.com/playlist?list=PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i";

// audio - alerts
function audioAlert(type) {
    let random_alert = Math.floor(Math.random() * 3) + 1;
    let random_alert_string = String(random_alert);
    let audio_alert;
    let file_path;
    switch(type) {
        case 0: // break alert
            file_path = "/sound/hi/1/" + random_alert_string + ".wav";
            break;
        case 1: // work alert
            file_path = "/sound/hi/3/" + random_alert_string + ".wav";
            break;
        default:
            break;
    }
    audio_alert = new Audio(file_path);
    audio_alert.volume = sfx_volume / 100;
    audio_alert.play();
}

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
    let seconds_value = Math.floor( (ms/1000) % 60 );
    let minutes_value = Math.floor( (ms / (1000 * 60)) % 60 );
    let hours_value = Math.floor( (ms / (1000 * 60 * 60)) % 60 );
    return String(hours_value) + "h " + String(minutes_value) + "m " + String(seconds_value) + "s";
}
function hmsToMs(hours, mins, secs) {
    let hours_in_ms = hours * 60 * 60 * 1000;
    let mins_in_ms = mins * 60 * 1000;
    let secs_in_ms = secs * 1000;
    let ms = hours_in_ms + mins_in_ms + secs_in_ms;
    return ms;
}

// update stats display
function updateStats() {
    stats_work_sessions.innerHTML = String(works);
    stats_work_time.innerHTML = msToTimeString(works * work_time + (total_ms_passed * Number(!breaking)));
    stats_break_sessions.innerHTML = String(breaks);
    stats_break_time.innerHTML = msToTimeString(breaks * break_time + (total_ms_passed * Number(breaking)));
}

// state options
function setStatus() {
    switch (timer_status) {
        case 1:
            $('#status').css("display", "block");
            status_div.innerHTML = "Working";
            $('#status').css("animation-name", "elipses");
            $('#status').css("animation-duration", "0.5s");
            $('#status').css("animation-delay", "0s");
            $('#status').addClass('elipses');
            break;
        case 2:
            $('#status').css("display", "block");
            status_div.innerHTML = "Breaking";
            $('#status').css("animation-name", "bounce");
            $('#status').css("animation-duration", "0.5s");
            $('#status').css("animation-delay", "0s");
            $('#status').removeClass('elipses');
            break;
        case 3:
            $('#status').css("display", "block");
            status_div.innerHTML = "Paused";
            $('#status').css("animation-name", "flash");
            $('#status').css("animation-duration", "1s");
            $('#status').css("animation-delay", "0.5s");
            $('#status').removeClass('elipses');
            break;
        default:
            $('#status').slideUp();
            //$('#status').css("display", "none");
            $('#status').removeClass('elipses');
            break;
    }
    statusFadeIn();
}

function statusFadeOut() {
    let fadeout_interval = setInterval( () => {
        let op = Number(status_div.style.opacity);
        if (op <= 0) {
            clearInterval(fadeout_interval);
            setStatus();
        }
        status_div.style.opacity = (op - 0.01).toString();
    }, 5);
}

function statusFadeIn() {
    let fadein_interval = setInterval( () => {
        let op = Number(status_div.style.opacity);
        if (op >= 1) {
            clearInterval(fadein_interval);
        }
        status_div.style.opacity = (op + 0.01).toString();
    }, 5);
}

//update status display
function updateStatus() {
    statusFadeOut();
}


// play-pause button function
function pauseTimer() {
    running = false;
    paused = true;
    start_button.innerHTML = "Resume";
    saved_time = total_ms_passed;
    clearInterval(timer_interval);
    timer_status = 3;
    updateStatus()
    youtube_player.pauseVideo();
}
function playTimer() {
    if (paused == false) { $('#status').slideDown(); }
    running = true;
    paused = false;
    start_button.innerHTML = "Pause";
    start_time = Date.now() - saved_time;
    timer_interval = setInterval(timerTick, 100);
    if (breaking == false) {timer_status = 1;} else {timer_status = 2;}
    updateStatus()
    youtube_player.playVideo();
}
start_button.addEventListener('click', function() {
    if (running == true) {
        pauseTimer();
    }
    else {
        playTimer();
    }
});

// reset button
function resetTimer() {
    clearInterval(timer_interval);
    running = false;
    paused = false;
    breaking = false;
    total_ms_passed = 0;
    saved_time = 0;
    timer_status = 0;
    updateStatus()
    printOutput();
    start_button.innerHTML = "Start";
    updatePlaylist();

}
reset_button.addEventListener('click', function() {
    resetTimer();
});

// timer stats button
timer_stats_button.addEventListener('click', function() {
    $("#timer-stats").slideToggle();

    if (timer_stats_show == true) {
        timer_stats_show = false;
        timer_stats_button.innerHTML = "show stats";
    }
    else {
        timer_stats_show = true;
        timer_stats_button.innerHTML = "hide stats";
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
            updatePlaylist();
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
            updateStatus();
            updatePlaylist();
        }
    }
    printOutput()
}

// ******************* //TIMER - END *******************//







// ******************* //YOUTUBE PLAYER *******************//

// get elements
const media_display_button = document.getElementById('media-display-button');
const media_display = document.getElementById('media-display');

let media_hidden = true;
media_display_button.addEventListener('click', function() {
    if (media_hidden == true) {
        media_hidden = false;
        media_display.style.display = "block";
    }
    else {
        media_hidden = true;
        media_display.style.display = "none";
    }
})

function checkPlaylistLink(_link) {

}

function cleanPlaylist(_link) {
    let start_pos = _link.indexOf("list=")+5;
    let end_pos = _link.indexOf("&", start_pos);
    if (end_pos < 0) { end_pos = _link.length};
    const cleaned_link = _link.slice(start_pos, end_pos);
    return cleaned_link;
}

function updatePlaylist() {

    let last_index = 0;
    let last_timestamp = 0;

    if (breaking == false) {
        current_playlist = work_playlist;
        break_playlist_lastplayed_index = youtube_player.getPlaylistIndex();
        break_playlist_lastplayed_timestamp = youtube_player.getCurrentTime();
        last_index = work_playlist_lastplayed_index;
        last_timestamp = work_playlist_lastplayed_timestamp;

    }
    else {
        current_playlist = break_playlist;
        work_playlist_lastplayed_index = youtube_player.getPlaylistIndex();
        work_playlist_lastplayed_timestamp = youtube_player.getCurrentTime();
        last_index = break_playlist_lastplayed_index;
        last_timestamp = break_playlist_lastplayed_timestamp;
    }

    let cleaned_playlist = cleanPlaylist(current_playlist).toString();
    youtube_player.stopVideo(); // yt embed api needs video to stop or loadPlaylist() will just restart old playlist
    if (running == true) {
        load_playlist = youtube_player.loadPlaylist({
            list: cleaned_playlist,
            listType: 'playlist',
            index: last_index,
            startSeconds: last_timestamp
        });
    }
    else {
        cue_playlist = youtube_player.cuePlaylist({
            list: cleaned_playlist,
            listType: 'playlist',
            index: last_index,
            startSeconds: last_timestamp
        });
    }
    
}

function onPlaylistLoaded() {

}

// https://jsfiddle.net/u461nrt8/9/
function testButton() {
    // MAKE SURE TEST PLAYLISTS ARE PUBLIC!
    let cleaned_playlist = cleanPlaylist("https://www.youtube.com/playlist?list=PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i");
    pl_load = youtube_player.loadPlaylist({
        list: cleaned_playlist, //cleanPlaylist(current_playlist).toString(),
        index: 0 // onerror is not being triggered when we have an index for a video thats not playable, the player just doesnt load!
    }, null, onPlaylistLoaded);
}

// load iframe player api asynchronously
player_element = document.createElement('script');
player_element.src = "https://www.youtube.com/iframe_api";
var first_script_element = document.getElementsByTagName('script')[0]; // we insert before any other script tags for async
first_script_element.parentNode.insertBefore(player_element, first_script_element);

// create iframe after api code is done downloading
var youtube_player;
function onYouTubeIframeAPIReady() {
    youtube_player = new YT.Player('youtube-player', {
        height: '390',
        width: '640',
        playerVars: {
            'list': 'PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i',
            'index': 0,
            'loop': 1,
            'autoplay': 0,
            'playsinline': 1,
            'modestbranding:': 1,
            'origin': 'localhost:5501/'
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // youtube_player.playVideo(); // we want to control it on our own via start/pause button
    //youtube_player.pauseVideo();
}

function onPlayerError(event) {
    youtube_player.nextVideo();
    
    // FINAL "Video Unavailable" ERROR EXPLANATION:
    /*
        These errors only occur when using a webpage accessed through ip address. Not sure why but certain videos 
        will only work if using a domain to access the webpage. Errors for if a video is not embeddable (set by creator)
        will skip just fine using the nextVideo() function regardless of if they are the first video.
    */

    // what happens if we are skipping BACKWARDS through the videos and hit error?
    // atm we get stopped from going back any further as player will go to NEXT video
}

function onPlayerStateChange(event) {
}

// ******************* //YOUTUBE PLAYER - END *******************//







// ******************* //SETTINGS *******************//

// get elements
const settings_open_button = document.getElementById('settings-button');
const settings_form = document.getElementById('settings-form');

// settings sidebar
function openSettings() {
    document.getElementById("settings").style.width = "35rem";
    document.getElementsByTagName("main")[0].style.marginLeft = "35rem";
    document.getElementById("sidebar-content").style.transition = "opacity 1.5s";
    document.getElementById("sidebar-content").style.transitionDelay = "0.8s";
    document.getElementById("sidebar-content").style.opacity = "1";
    setTimeout(function() { document.getElementById("settings").style.overflow = "auto"; }, 750);
}

function closeSettings() {
    document.getElementById("settings").style.width = "0";
    document.getElementsByTagName("main")[0].style.marginLeft = "0";
    document.getElementById("sidebar-content").style.transition = "opacity 0.15s";
    document.getElementById("sidebar-content").style.transitionDelay = "0s";
    document.getElementById("sidebar-content").style.opacity = "0";
    document.getElementById("settings").style.overflow = "hidden";
}

settings_open_button.addEventListener('click', function() {
    if (settings_open == true) {
        settings_open = false;
        closeSettings();
    }
    else {
        settings_open = true;
        openSettings();
    }
})

// settings form
settings_save_msg = document.getElementById('settings-save-msg');

function settingsRetrieveInputs() {

    let worktime_hours = document.getElementById('settings-worktime-hours').value;
    let worktime_mins = document.getElementById('settings-worktime-mins').value;
    let worktime_secs = document.getElementById('settings-worktime-secs').value;

    let breaktime_hours = document.getElementById('settings-breaktime-hours').value;
    let breaktime_mins = document.getElementById('settings-breaktime-mins').value;
    let breaktime_secs = document.getElementById('settings-breaktime-secs').value;
    
    work_time = hmsToMs(worktime_hours, worktime_mins, worktime_secs);
    break_time = hmsToMs(breaktime_hours, breaktime_mins, breaktime_secs);

    work_playlist = document.getElementById('settings-work-playlist').value;
    break_playlist = document.getElementById('settings-break-playlist').value;

    sfx_volume = document.getElementById('settings-volume-sfx').value;
    music_volume = document.getElementById('settings-volume-music').value;

}

// on submit
settings_form.addEventListener('submit', function(event) {
    
    event.preventDefault();

    settingsRetrieveInputs();

    settings_save_msg.style.display = "block";
    settings_save_msg.style.animation = "5s linear 0.3s fade-in-hold";

    updatePlaylist();

});

settings_save_msg.addEventListener('animationend', function() {
    settings_save_msg.style.display = "none";
});

// ******************* //SETTINGS - END *******************//




// debugging
const debug = document.getElementById('debug');
const debug_interval = setInterval(function() {
    debug.innerHTML = "current_playlist:" + current_playlist + " | works: " + works + " | breaks: " + breaks + " | breaking: " + breaking + " | running: " + running + " | saved_time: " + saved_time + " | total_ms_passed: " + total_ms_passed + " | settings_open: " + settings_open;
}
, 100)
