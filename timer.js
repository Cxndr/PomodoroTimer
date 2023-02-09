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
let break_playlist = "";
let sfx_volume = 60;
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
    //alert("fading out");
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
    //alert("fading in");
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
    total_ms_passed = 0;
    saved_time = 0;
    timer_status = 0;
    updateStatus()
    printOutput();
    start_button.innerHTML = "Start";
    youtube_player.pauseVideo();
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
            updateStatus()
        }
    }
    printOutput()
}

// ******************* //TIMER - END *******************//







// ******************* //YOUTUBE PLAYER *******************//

function checkPlaylistLink(_link) {

}

function cleanPlaylist(_link) {
    let start_pos = _link.indexOf("list=")+5;
    let end_pos = _link.indexOf("&", start_pos);
    if (end_pos < 0) { end_pos = _link.length};
    const cleaned_link = _link.slice(start_pos, end_pos);
    return cleaned_link;
}

// when loading to a video in the playlist that is unavailable 
// (only watchable on youtube, not available in country) the playlist will not be loaded at all
// and therefore no onError will be triggered. - is this true? seems like onerror is triggered but doesnt skip the video
function updatePlaylist() {
    if (breaking == false) {
        current_playlist = work_playlist;
    }
    else {
        current_playlist = break_playlist;
    }
   let cleaned_playlist = cleanPlaylist(current_playlist).toString();
   alert(cleaned_playlist);
   load_playlist = youtube_player.loadPlaylist({
        list: cleaned_playlist,
        index: 1
   });
    console.log(load_playlist);
}

// https://jsfiddle.net/u461nrt8/9/
function testButton() {
    //playlist_link = cleanPlaylist(current_playlist);
    //youtube_player.nextVideo();
    // MAKE SURE TEST PLAYLISTS ARE PUBLIC!
    
    let cleaned_pl = cleanPlaylist("https://www.youtube.com/playlist?list=PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i");
    let cleaned = "PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i";
    //alert("func out: " + cleaned_pl + "\ntext out: " + cleaned);

    pl_load = youtube_player.loadPlaylist({
        list: cleaned_pl, //cleanPlaylist(current_playlist).toString(),
        index: 1 // onerror is not being triggered when we have an index for a video thats not playable, the player just doesnt load!
    });

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
        //videoId: 'yDzPeZkhm7U',
        playerVars: {
            'playlist': 'PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i',
            'list': 'PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i', // we comment out otherwise we need to run loadPlaylist twice to play provided playlist. Assuming this is queueing a playlist up already that must be played on first loadPlaylist();
            'index': 1,
            'loop': 1,
            'autoplay': 0,
            'playsinline': 1,
            'modestbranding:': 1    
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    //event.target.pauseVideo();
    alert("player ready event");
}

// what happens if we are skipping BACKWARDS through the videos and hit error?
// atm we get stopped from going back any further as player will go to NEXT video
//
// error IS being triggered on initial load! (but initial video still doesnt skip).
//https://stackoverflow.com/questions/18508433/automatically-skip-video-in-youtube-when-error-occurs-using-youtube-android-sdk
function onPlayerError(event) {
    // nextvideo() works for natural skipping to unavailable video
    // loading playlist with next index works for initial video being unplayable
    alert("video playback error: " + event.data);
    
        // when this code is included - we fail to skip when we have 2 videos unavailable in a row.
        // when the code is removed they skip just fine using nextVideo() alone.
        // but we need this code to skip when initial video is unavailable as nextVideo() doesnt do anything in that case.
        // this cose also works fine to skip to next in place of nextVideo() except the 2 unavailable videos in a row
        // we need either a way to differentiate initial and non-initial video skips or 
        // a way for this code to not interfere with 2 unavailable videos in a row

        // using this method of assigning to a specific index WILL NOT WORK AT ALL if the chose index is
        // an unavailable video!!!!!!!!!!!! this is causing the problem here and when using load button
        // to go to unavailable video. if we can get it to trigger onerror instead of doing nothing
        // then we are good.
        // when the loadPlaylist fails because unavailable index it also cancels the rest of the block of code


    let player_index = youtube_player.getPlaylistIndex();
    let new_index = player_index + 1;
    let playlist_string = cleanPlaylist(current_playlist).toString();
    alert("player_index: " + player_index + "\nnew_index: " + new_index);

    youtube_player.nextVideo();

    sleep(300);    
    alert("yruioyioqwyoriy");
    load_playlist = youtube_player.loadPlaylist({
        list: playlist_string,
        index: new_index // what if we are at the end?
    });
    alert("fieun"); 
    //playVideo();
    
    
    //youtube_player.loadPlaylist(playlist_string, new_index); // we have to use object version of loadPlaylist to make it skip when initial video is unavailable
    sleep(300);
    youtube_player.nextVideo();


    // do we need to give feedback to user about what happened?
}

function onPlayerStateChange(event) {
    //alert("player state change event triggered");
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
    debug.innerHTML = "works: " + works + " | breaks: " + breaks + " | breaking: " + breaking + " | running: " + running + " | saved_time: " + saved_time + " | total_ms_passed: " + total_ms_passed + " | settings_open: " + settings_open;
}
, 100)
