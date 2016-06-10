'use strict';

var mpu9250 = require('./mpu9250');

// These values were generated using calibrate_mag - you will want to create your own.
var MAG_CALIBRATION = {
    min: { x: -106.171875, y: -56.8125, z: -14.828125 },
    max: { x: 71.9609375, y: 117.17578125, z: 164.25 },
    offset: { x: -17.10546875, y: 30.181640625, z: 74.7109375 },
    scale: {
        x: 1.491020130696022,
        y: 1.5265373476123123,
        z: 1.483149376145188
    }
};

// These values were generated using calibrate_gyro - you will want to create your own.
// NOTE: These are temperature dependent.
var GYRO_OFFSET = {
    x: -1.068045801526718,
    y: -0.15665648854961847,
    z: 1.384625954198473
};


// Instantiate and initialize.
var mpu = new mpu9250({
    // i2c path (default is '/dev/i2c-1')
    device: '/dev/i2c-2',

    // Enable/Disable debug mode (default false)
    DEBUG: true,

    // Set the Gyroscope sensitivity (default 0), where:
    //      0 => 250 degrees / second
    //      1 => 500 degrees / second
    //      2 => 1000 degrees / second
    //      3 => 2000 degrees / second
    GYRO_FS: 0,

    // Set the Accelerometer sensitivity (default 2), where:
    //      0 => +/- 2 g
    //      1 => +/- 4 g
    //      2 => +/- 8 g
    //      3 => +/- 16 g
    ACCEL_FS: 0,

    scaleValues: true,

    UpMagneto: true,

    magCalibration: MAG_CALIBRATION,

    gyroBiasOffset: GYRO_OFFSET
});

if (mpu.initialize()) {

    console.log('\n   Time     Accel.x  Accel.y  Accel.z  Gyro.x   Gyro.y   Gyro.z   Mag.x   Mag.y   Mag.z    Temp(°C) heading(°)');
    setInterval(function() {
        var start = new Date().getTime();
        var m9 = mpu.getMotion9();
        var end = new Date().getTime();
        var t = (end - start) / 1000;

        // Make the numbers pretty
        var str = '';
        for (var i = 0; i < m9.length; i++) {
            str += p(m9[i]);
        }

        process.stdout.write(p(t) + str + p(mpu.getTemperatureCelsiusDigital()) + p(calcHeading(m9[6], m9[7])) + '\r');
    }, 5);
}

function p(num) {
    var str = num.toFixed(3);
    while (str.length <= 7) {
        str = ' ' + str;
    }
    return str + ' ';
}

function calcHeading(x, y) {
    var heading = Math.atan2(y, x) * 180 / Math.PI;

    if (heading < -180) {
        heading += 360;
    } else if (heading > 180) {
        heading -= 360;
    }

    return heading;
}
