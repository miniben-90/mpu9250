# mpu9250
A node.js library for communicating with the MPU9250.
Based initially on the mpu6050 library (https://github.com/jstapels/mpu6050) by Jason Stapels

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
  ak_address: AK8963.ADDRESS // ak8963 address (default is 0x0C)
});
```
