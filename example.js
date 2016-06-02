var mpu9250 = require('./mpu9250');

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
    ACCEL_FS: 2,

    scaleValues: true,

    UpMagneto: true
});

if (mpu.initialize()) {

    setInterval(function() {
        var start = new Date().getTime();
        var m9 = mpu.getMotion9();
        var end = new Date().getTime();

        for (var i = 0; i < m9.length; i++) {
            m9[i] = m9[i].toFixed(2);
        }

        console.log((end - start) / 1000 + '\t' + m9.toString().replace(/,/g, '\t'));
    }, 5);
}
