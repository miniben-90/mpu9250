# mpu9250
A node.js library for communicating with the MPU9250.
Based initially on the mpu6050 library (https://github.com/jstapels/mpu6050) by Jason Stapels.
___
## Dependencies
|   Lib.  | Version |
| ------- | ------- |
|     i2c |   0.2.1 |
|  extend |   3.0.0 |
|   sleep |   3.0.0 |
___
## Install
```
npm install mpu9250
```

## How to use it
```javascript
var mpu9250 = require('mpu9250');
// Instantiate and initialize.
var mpu = new mpu9250();
if (mpu.initialize()) {
  console.log(mpu.getMotion9());
}
```

## Parameters
```javascript
// default value
var mpu = new mpu9250({
  device: '/dev/i2c-1', // i2c path
  address: MPU9250.ADDRESS_AD0_LOW, // mpu9250 address (default is 0x68)
  UpMagneto: false, // Enable/Disable magnetometer data
  DEBUG: false, // Enable/Disable debug mode
  ak_address: AK8963.ADDRESS, // ak8963 address (default is 0x0C)
  GYRO_FS: 0, // 0 => GYRO_FS_250 | 1 => GYRO_FS_500| 2 => GYRO_FS_1000 | 3 => GYRO_FS_2000
  ACCEL_FS: 1 // 0 => ACCEL_FS_2 | 1 => ACCEL_FS_4 | 2 => ACCEL_FS_8 | 3 => ACCEL_FS_16
});
```

## Integration of Calman Filter
###Example :
```javascript

var timer = 0;

var kalmanX = new Kalman_filter();
var kalmanY = new Kalman_filter();

var values = mpu.getMotion6();
var pitch = getPitch(values);
var roll = getRoll(values);
var yaw = getYaw(values);

timer = micros();
var interval;

kalmanX.setAngle(roll);
kalmanY.setAngle(pitch);

var kalAngleX = 0,
	kalAngleY = 0,
	kalAngleZ = 0,
	gyroXangle = roll,
	gyroYangle = pitch,
	gyroZangle = yaw,
	gyroXrate = 0,
	gyroYrate = 0,
	gyroZrate = 0,
	compAngleX = roll,
	compAngleY = pitch,
	compAngleZ = yaw;

interval = setInterval(function() {
	var values = mpu.getMotion6();
	
	var dt = (micros() - timer) / 1000000;
	timer = micros();
	
	pitch = getPitch(values);
	roll = getRoll(values);
	yaw = getYaw(values);
	
	var gyroXrate = values[3] / 131.0;
	var gyroYrate = values[4] / 131.0;
	var gyroZrate = values[5] / 131.0;
	
	if ((roll < -90 && kalAngleX > 90) || (roll > 90 && kalAngleX < -90)) {
		kalmanX.setAngle(roll);
		compAngleX = roll;
		kalAngleX = roll;
		gyroXangle = roll;
	} else {
		kalAngleX = kalmanX.getAngle(roll, gyroXrate, dt);
	}
	
	if (Math.abs(kalAngleX) > 90) {
		gyroYrate = -gyroYrate;
	}
	kalAngleY = kalmanY.getAngle(pitch, gyroYrate, dt);
	
	gyroXangle += gyroXrate * dt;
	gyroYangle += gyroYrate * dt;
	compAngleX = 0.93 * (compAngleX + gyroXrate * dt) + 0.07 * roll;
	compAngleY = 0.93 * (compAngleY + gyroYrate * dt) + 0.07 * pitch;
	
	if (gyroXangle < -180 || gyroXangle > 180) gyroXangle = kalAngleX;
	if (gyroYangle < -180 || gyroYangle > 180) gyroYangle = kalAngleY;
	
	var accel = {
		pitch: compAngleY,
		roll: compAngleX
	};
	
	console.log(accel);
}, 1);
```