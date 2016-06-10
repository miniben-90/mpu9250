'use strict';

var NUM_READS = 500;

/**
 * Calibrate the gyro.  The device needs to remain still during calibration.  The calibration will
 * be applied to the gyro.
 *
 * NOTE: The Gyro must not be moved during this process.
 *
 * @name gyroBiasCalibrationSync
 * @param {number} numReads The number of cycles to average the gyro values.
 * @return {Array} The averaged [x, y, z] values for the gyro.
 */

// Instantiate and initialize.
var mpu9250 = require('./mpu9250');
var sleep = require('sleep');

var mpu = new mpu9250({
    device: '/dev/i2c-2',
    scaleValues: true,
    UpMagneto: false
});

function gyroBiasCalibrationSync() {

	// Reset the calibration
	mpu._config.gyroBiasCalibration = { x: 0, y: 0, z: 0 };

	var avg = {
		x: 0,
		y: 0,
		z: 0
	};

	for (var i = 0; i < NUM_READS; i++) {
		var gyroValues = mpu.getGyro();
		avg.x += gyroValues[0];
		avg.y += gyroValues[1];
		avg.z += gyroValues[2];
		sleep.usleep(5000);
	}

	avg.x /= -NUM_READS;
	avg.y /= -NUM_READS;
	avg.z /= -NUM_READS;

	return avg;
}


if (mpu.initialize()) {
    console.log('Calibrating.');
    console.log('GYRO_OFFSET =', gyroBiasCalibrationSync());
}
