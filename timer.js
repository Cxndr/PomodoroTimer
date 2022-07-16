document.write("Hello, World");
window.onload = function() {
    const time_interval = setInterval(function() {
        var current_time = Date.getTime();
        document.getElementById("timer-text").innerHTML = current_time;
    
    }, 1000);
}


/*
const time_interval = setInterval(function() {
    var current_time = Date.getTime();
    document.getElementById("timer-text").innerHTML = current_time;

}, 1000);
*/

/*
    var start_time = Date.getTime();
    var work_time = 25 * 60 * 1000;
    var break_time = 5 * 60 * 1000;
    var works = 0;
    var breaks = 0; 
    var target_works = 3;


    const time_interval = setInterval(function() {

        var current_time = Date.getTime() - start_time;

        var time_passed = current_time - start_time;

        document.getElementById("timer-text").innerHTML = time_passed;

        if time_passed > work_time {
            works += 1;
        }
    }, 1000)

    if works > target_works {
        clearInterval(time_interval);
    }
*/
