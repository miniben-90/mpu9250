'use strict';

var NUM_READS = 300;

/**
 * Calibrate the Accelerometer.  This device will need to be rotated with the X, Y and Z axes up.
 */

// Instantiate and initialize.
var mpu9250 = require('./mpu9250');
var sleep = require('sleep');

var mpu = new mpu9250({
    device: '/dev/i2c-2',
    scaleValues: true,
    UpMagneto: false
});

var axis = -1;
var axes = ['X', 'Y', 'Z'];
var dir = 'down';
var directions = {
    'up': 1,
    'down': -1
};
var offset = [0, 0, 0];
var scale = [[0, 0], [0, 0], [0, 0]];

if (mpu.initialize()) {
    runNextCapture();
}

/**
 * Set up the next capture for an axis and a direction (up / down).
 */
function runNextCapture() {
    if (dir === 'up') {
        dir = 'down';
    } else {
        axis += 1;
        dir = 'up';
    }
    if (axis === 3) {
        wrapUp();
    }
    console.log('Point the ' + axes[axis] + ' axis arrow ' + dir + '.');
    pressEnterKeyToContinue(function () {
        calibrateAxis(axis, dir);
        runNextCapture();
    });
}

/**
 * This will syncronuously read the accel data from MPU9250.  It will gather the offset and scalar values.
 */
function calibrateAxis() {
    var scaleDir = dir === 'down' ? 0 : 1;

    console.log('Reading values - hold still');
    for (var i = 0; i < NUM_READS; i++) {
        var accelValues = mpu.getAccel();

        for (var a = 0; a < 3; a += 1) {
            if (a === axis) {
                scale[a][scaleDir] += accelValues[a];
            } else {
                offset[a] += accelValues[a];
            }
        }
        sleep.usleep(5000);
    }
}

/**
 * Called when we are done.
 */
function wrapUp() {
    for (var i = 0; i < 3; i++) {
        offset[i] = offset[i] / (NUM_READS * 4);
        scale[i][0] = scale[i][0] / NUM_READS;
        scale[i][1] = scale[i][1] / NUM_READS;
    }
    var calibration = {
        offset: {
            x: offset[0],
            y: offset[1],
            z: offset[2]
        },
        scale: {
            x: scale[0],
            y: scale[1],
            z: scale[2]
        }
    };

    console.log('ACCEL_CALIBRATION = ', calibration);
    var exit = process.exit;
    exit();
}

/**
 * This will ask the user to press the ENTER key to continue.  Then run the callback.
 * @param  {Function} callback
 */
function pressEnterKeyToContinue(callback) {
    console.log('Press ENTER to continue.');

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    var util = require('util');

    var called = false;
    process.stdin.on('data', function (text) {
        if (called) return;
        if (text === '\n') {
            called = true;
            callback();
            console.log();
        }
    });

}
