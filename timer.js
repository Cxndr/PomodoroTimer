
window.onload = function() {
};

// mechanical functions
function padTo2Digits(num) {
    return num.toString().padStart(2,"0");
};


// ******************* //TIMER *******************//

// get elements
const timer_text = document.getElementById('timer-text');
const start_button = document.getElementById('start-button');
const reset_button = document.getElementById('reset-button');
const skip_button = document.getElementById('skip-button');
const timer_buttons = document.getElementById('timer-buttons');
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
let work_time_default = work_time;
let break_time = 10 * 1000;
let break_time_default = break_time;
let work_playlist = "";
work_playlist = "https://www.youtube.com/playlist?list=PLrQHJyrdiNuYLF-LJ87QnmVw3tNtTbe0i";
let work_playlist_default = work_playlist;
let work_playlist_lastplayed_timestamp = 0;
let work_playlist_lastplayed_index = 0;
let break_playlist = "";
break_playlist = "https://www.youtube.com/playlist?list=PLrQHJyrdiNuaU4E9erO20CFwhzSii7eam";
let break_playlist_default = break_playlist;
let break_playlist_lastplayed_timestamp = 0;
let break_playlist_lastplayed_index = 0;
let sfx_volume = 5;
let sfx_volume_default = sfx_volume;
let sfx_muted = false;
let music_volume = 40;
let music_volume_default = music_volume;
let music_muted = false;
let debug_mode = false;

// mechanical variables
let timer_interval;
let start_time = Date.now();
let current_time = Date.now();
let saved_time = 0;
let time_passed_ms = 0;
let time_passed_secs;
let total_work_time = 0;
let total_break_time = 0;
let work_time_stored = 0;
let break_time_stored = 0;
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

// audio - settings
let settings_volume_sfx = document.getElementById('settings-volume-sfx');
settings_volume_sfx.addEventListener("input", function(e) {
    sfx_volume = e.currentTarget.value;
    audio_alert.volume = sfx_volume;
});

let settings_volume_music = document.getElementById('settings-volume-music');
settings_volume_music.addEventListener("input", function(e) {
    music_volume = e.currentTarget.value;
    youtube_player.setVolume(music_volume);
});


// audio - alerts
function audioAlert(type) {
    if (sfx_muted == true) {
        return;
    }  
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

// keep track of total time passed
function updateTimeVariables() {
    total_work_time = work_time_stored + (time_passed_ms * Number(!breaking));
    total_break_time = break_time_stored + (time_passed_ms * Number(breaking));
}

function printOutput() {
    time_passed_secs = Math.floor(time_passed_ms / 1000);
    minutes = Math.floor(time_passed_secs / 60);
    seconds = Math.floor(time_passed_secs % 60);
    output = minutes + ":" + padTo2Digits(seconds);
    timer_text.innerHTML = output;
}


// ms time to x hours x mins x seconds
function msToHms(ms) {
    let seconds_value = Math.floor( (ms/1000) % 60 );
    let minutes_value = Math.floor( (ms / (1000 * 60)) % 60 );
    let hours_value = Math.floor( (ms / (1000 * 60 * 60)) % 60 );
    return [hours_value, minutes_value, seconds_value];
}
function msToTimeString(ms) {
    let hours_value = msToHms(ms)[0];
    let minutes_value = msToHms(ms)[1];
    let seconds_value = msToHms(ms)[2];
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
    stats_work_time.innerHTML = msToTimeString(total_work_time);
    stats_break_sessions.innerHTML = String(breaks);
    stats_break_time.innerHTML = msToTimeString(total_break_time);
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
    fadeIn(status_div);
}

function displaySwitch(element, bool) {
    if (bool == true) {
        element.style.display = "block";
        media_hidden = false;
    }
    else {
        element.style.display = "none";
        media_hidden = true;
    }
}

function fadeOut(element, callback) {

    // can we just use fade toggle?
    // https://stackoverflow.com/questions/16278147/javascript-fade-div-in-on-button-click-then-on-2nd-button-click-fade-out
    
    //if (element.dataset.fading_in == "true") { return; }

    element.dataset.fading_out = true;

    let fadeout_interval = setInterval( () => {
        let op = Number(element.style.opacity);
        if (op <= 0 || element.dataset.fading_in == "true") {
            element.dataset.fading_out = false;
            clearInterval(fadeout_interval);
            callback();
            return;
        }
        element.style.opacity = (op - 0.01).toString();
    }, 5);
}

function fadeIn(element, callback) {

    //if (element.dataset.fading_out == "true") { return; }

    element.dataset.fading_in = true;

    let fadein_interval = setInterval( () => {
        let op = Number(element.style.opacity);
        if (op >= 1 || element.dataset.fading_out == "true") {
            element.dataset.fading_in = false;
            clearInterval(fadein_interval);
            callback();
            return;
        }
        element.style.opacity = (op + 0.01).toString();
    }, 5);

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
    fadeOut(status_div, setStatus);
}

// switching functions
function switchToBreak() {
    works += 1;
    work_time_stored += time_passed_ms;
    breaking = true;
    time_passed_ms = 0;
    saved_time = 0;
    start_time = Date.now();
    audioAlert(0);
    timer_status = 2;
    updateStatus()
    updatePlaylist();
}

function switchToWork() {
    breaks += 1;
    break_time_stored += time_passed_ms;
    breaking = false;
    time_passed_ms = 0;
    saved_time = 0;
    start_time = Date.now();
    audioAlert(1);
    timer_status = 1;
    updateStatus();
    updatePlaylist();
}

// timer interval
function timerTick() {

    current_time = Date.now();
    time_passed_ms = current_time - start_time;

    updateTimeVariables();
    updateStats();

    // switch to break
    if (breaking == false) {
        if ( time_passed_ms >= ( work_time ) ) {
            switchToBreak();
        }
    }

    // switch to work
    if (breaking == true) {
        if ( time_passed_ms >= ( break_time ) ) {
            switchToWork();
        }
    }
    
    printOutput()
}

// play-pause button function
function pauseTimer() {
    running = false;
    paused = true;
    start_button.innerHTML = "Resume";
    saved_time = time_passed_ms;
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
    timer_buttons.classList.add('timer-buttons-full');
    timer_buttons.classList.remove('timer-buttons-single');
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
    time_passed_ms = 0;
    saved_time = 0;
    timer_status = 0;
    updateStatus()
    printOutput();
    start_button.innerHTML = "Start";
    timer_buttons.classList.add('timer-buttons-single');
    timer_buttons.classList.remove('timer-buttons-full');
    updatePlaylist();

}
reset_button.addEventListener('click', function() {
    resetTimer();
});

// skip button
function skipTimer() {
    if (breaking == false) {
        switchToBreak();
    }
    else {
        switchToWork();
    }
}
skip_button.addEventListener('click', function() {
    if (running == true) {
        skipTimer();
    }
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



// ******************* //TIMER - END *******************//







// ******************* //YOUTUBE PLAYER *******************//

// get elements
const media_display_button = document.getElementById('media-display-button');
const media_display = document.getElementById('media-display');
media_display.dataset.fading_in = false;
media_display.dataset.fading_out = false;

let media_hidden = true;
media_display_button.addEventListener('click', function() {
    if (media_hidden == true) {
        displaySwitch(media_display, true)
        fadeIn(media_display);
    }
    else {
        //media_display.style.opacity = 1;
        fadeOut(media_display, function() { displaySwitch(media_display, false); });
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
        will only work if using a domain to access the webpage in the youtube embed api. some speculation online 
        but no solid answer. Errors for if a video is not embeddable (set by creator) will skip just fine using 
        the nextVideo() function regardless of if they are the first video.
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
        settingsSetInputs();
        openSettings();
    }
})

// settings form
const $settings_save_msg = document.getElementById('settings-save-msg');

const $worktime_hours = document.getElementById('settings-worktime-hours');
const $worktime_mins = document.getElementById('settings-worktime-mins');
const $worktime_secs = document.getElementById('settings-worktime-secs');

const $breaktime_hours = document.getElementById('settings-breaktime-hours');
const $breaktime_mins = document.getElementById('settings-breaktime-mins');
const $breaktime_secs = document.getElementById('settings-breaktime-secs');

const $work_playlist = document.getElementById('settings-work-playlist');
const $break_playlist = document.getElementById('settings-break-playlist');

const $sfx_volume = document.getElementById('settings-volume-sfx');
const $music_volume = document.getElementById('settings-volume-music');
const $sfx_mute_button = document.getElementById('settings-mute-button-sfx');
const $music_mute_button = document.getElementById('settings-mute-button-music');

const $settings_save_button = document.getElementById('settings-save-button');
const $settings_default_button = document.getElementById('settings-default-button');

// hide button focus styling on mouse up 
// - (stops clicking button from creating focus styling but keeps accessibility)
$('.settings-button').mouseup(function() { this.blur(); });

function settingsSetInputs() {

    $break_playlist.value = document.getElementById('settings-break-playlist').value;

    $worktime_hours.value = msToHms(work_time)[0];
    $worktime_mins.value = msToHms(work_time)[1];
    $worktime_secs.value = msToHms(work_time)[2];

    $breaktime_hours.value = msToHms(break_time)[0];
    $breaktime_mins.value = msToHms(break_time)[1];
    $breaktime_secs.value = msToHms(break_time)[2];

    $work_playlist.value = work_playlist;
    $break_playlist.value = break_playlist;

    $sfx_volume.value = sfx_volume;
    $music_volume.value = music_volume;

}

function settingsRetrieveInputs() {

    work_time = hmsToMs($worktime_hours.value, $worktime_mins.value, $worktime_secs.value);
    break_time = hmsToMs($breaktime_hours.value, $breaktime_mins.value, $breaktime_secs.value);

    work_playlist = $work_playlist.value;
    break_playlist = $break_playlist.value;

    sfx_volume = $sfx_volume.value;
    music_volume = $music_volume.value;

}

function settingsSetDefault() {
    work_time = work_time_default;
    break_time = break_time_default;
    work_playlist = work_playlist_default;
    break_playlist = break_playlist_default;

    settingsSetInputs();
}

// mute buttons
const mute_icon = '<i class="fa-solid fa-volume-xmark"></i>';
const unmute_icon = '<i class="fa-solid fa-volume-high"></i>';

$sfx_mute_button.addEventListener('click', function(event) {
    if (sfx_muted == false) {
        sfx_muted = true;                                     
        $sfx_mute_button.innerHTML = mute_icon;
        $sfx_volume.disabled = true;
        $sfx_volume.value = 0;
    }
    else {
        sfx_muted = false;
        $sfx_mute_button.innerHTML = unmute_icon;
        $sfx_volume.disabled = false;
        $sfx_volume.value = sfx_volume;
    }
});

$music_mute_button.addEventListener('click', function(event) {
    if (music_muted == false) {
        music_muted = true;
        youtube_player.mute();                                
        $music_mute_button.innerHTML = mute_icon;
        $music_volume.disabled = true;
        $music_volume.value = 0;
    }
    else {
        music_muted = false;
        youtube_player.unMute();  
        $music_mute_button.innerHTML = unmute_icon;
        $music_volume.disabled = false;
        $music_volume.value = music_volume;
    }
});

// on input change
settings_form.addEventListener('input', function(event) {
    $settings_save_button.disabled = false;
});

// on save button
settings_form.addEventListener('submit', function(event) {
    
    event.preventDefault();

    settingsRetrieveInputs();

    $settings_save_msg.textContent = "Settings Saved!";
    $settings_save_msg.style.display = "block";
    $settings_save_msg.style.animation = "";
    void $settings_save_msg.offsetWidth; // dom reflow to allow animation restart
    $settings_save_msg.style.animation = "3s linear 0.3s fade-in-hold";

    updatePlaylist();

    $settings_save_button.disabled = true;

});

// on reset button
settings_form.addEventListener('reset', function(event) {  

    event.preventDefault();

    $settings_save_msg.textContent = "Settings Reset to Defaults!";
    $settings_save_msg.style.display = "block";
    $settings_save_msg.style.animation = "";
    void $settings_save_msg.offsetWidth; // dom reflow to allow animation restart
    $settings_save_msg.style.animation = "3s linear 0.3s fade-in-hold";

    settingsSetDefault();

});

// reset save msg to display:none to hide for screen readers
$settings_save_msg.addEventListener('animationend', function() {
    $settings_save_msg.style.display = "none";
});

// ******************* //SETTINGS - END *******************//




// ******************* //DEBUGGING *******************//

// html object
const $debug = document.getElementById('debug');

// variable tracking
function debugTracking() {
    
    const seperator_string = " | "
    const label_string = ": "
    const debug_list = [
        {current_playlist},
        {works},
        {breaks},
        {breaking},
        {running},
        {saved_time},
        {total_ms_passed: time_passed_ms},
        {settings_open},
        {"media_display.dataset.fading_in": media_display.dataset.fading_in},
        {"media_display.dataset.fading_out": media_display.dataset.fading_out},
        {"media_display.style.opacity": media_display.style.opacity},
        {media_hidden}
    ];
    
    let debug_output = ""
    
    function debugAddItemString(list_item, index, arr) {
        let key = Object.keys(list_item)[0];
        debug_output += key + ": " + list_item[key];
        if (index != (arr.length-1)) {
            debug_output += " | ";
        }
    }
    debug_list.forEach(debugAddItemString);
    
    const debug_interval = setInterval(function() {
        $debug.innerHTML = debug_output;
    }, 100);
};


// keyboard shortcuts
function debugKeyboardShortcuts() {
    window.addEventListener('keydown', function(event) {
        if (event.code == "KeyS" && event.getModifierState("Shift")) {
            if (settings_open == true) {
                settings_open = false;
                closeSettings();
            }
            else {
                settings_open = true;
                settingsSetInputs();
                openSettings();
            }
        }
    });
    window.addEventListener('keydown', function(event) {
        if (event.code == "KeyT" && event.getModifierState("Shift")) {
            if (running == true) {
                pauseTimer();
            }
            else {
                playTimer();
            }
        }
    });
    window.addEventListener('keydown', function(event) {
        if (event.code == "KeyR" && event.getModifierState("Shift")) {
            resetTimer();
        }
    });
};


if (debug_mode == true) {
    $debug.style.display = "inline";
    $debug.style.visibility = "visible";
    debugTracking();
    debugKeyboardShortcuts();
}
else {
    $debug.style.display = "none";
    $debug.style.visibility = "hidden";
}


// ******************* //DEBUGGING - END *******************//