/**
 * 
 * NodeJs Module : MPU9250
 * @author BENKHADRA Hocine
 * @description Simple reading data for node js and mpu9250
 * @version 0.0.1
 * @dependent i2c, extend, sleep
 * @license MIT
 * 
 */
 
///////////////////////////////////////////////////////////////////////////////////////
//***********************************************************************************//
//**                                                                               **//
//**                                                                               **//
//** The MIT License (MIT)                                                         **//
//**                                                                               **//
//** Copyright (c) <2015> <BENKHADRA Hocine>                                       **//
//**                                                                               **//
//** Permission is hereby granted, free of charge, to any person obtaining a copy  **//
//** of this software and associated documentation files (the "Software"), to deal **//
//** in the Software without restriction, including without limitation the rights  **//
//** to use, copy, modify, merge, publish, distribute, sublicense, and/or sell     **//
//** copies of the Software, and to permit persons to whom the Software is         **//
//** furnished to do so, subject to the following conditions:                      **//
//**                                                                               **//
//** The above copyright notice and this permission notice shall be included in    **//
//** all copies or substantial portions of the Software.                           **//
//**                                                                               **//
//** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR    **//
//** IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,      **//
//** FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE   **//
//** AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER        **//
//** LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, **//
//** OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN     **//
//** THE SOFTWARE.                                                                 **//
//**                                                                               **//
//***********************************************************************************//
///////////////////////////////////////////////////////////////////////////////////////

/*********************/
/** Module required **/
/*********************/ 
var MOD_I2C = require('i2c');
var extend = require('extend');
var sleep = require('sleep');

/*****************/
/** MPU9250 MAP **/
/*****************/
var MPU9250 = {
	ADDRESS_AD0_LOW: 0x68,
	ADDRESS_AD0_HIGHT: 0x69,
	WHO_AM_I: 0x75,

	GYRO_FULL_SCALE_250_DPS: 0x00, 
	GYRO_FULL_SCALE_500_DPS: 0x08,
	GYRO_FULL_SCALE_1000_DPS: 0x10,
	GYRO_FULL_SCALE_2000_DPS: 0x18,

	ACC_FULL_SCALE_2_G: 0x00,
	ACC_FULL_SCALE_4_G: 0x08,
	ACC_FULL_SCALE_8_G: 0x10,
	ACC_FULL_SCALE_16_G: 0x18,
	
	RA_CONFIG: 0x1A,
	RA_GYRO_CONFIG: 0x1B,
	RA_ACCEL_CONFIG: 0x1C,
	
	RA_INT_PIN_CFG: 0x37,
	
	INTCFG_ACTL_BIT: 7,
	INTCFG_OPEN_BIT: 6,
	INTCFG_LATCH_INT_EN_BIT_BIT: 5,
	INTCFG_INT_ANYRD_2CLEAR_BIT: 4,
	INTCFG_ACTL_FSYNC_BIT: 3,
	INTCFG_FSYNC_INT_MODE_EN_BIT: 2,
	INTCFG_BYPASS_EN_BIT: 1,
	INTCFG_NONE_BIT: 0,
	
	BY_PASS_MODE: 0x02,

	ACCEL_XOUT_H: 0x3B,
	ACCEL_XOUT_L: 0x3C,
	ACCEL_YOUT_H: 0x3D,
	ACCEL_YOUT_L: 0x3E,
	ACCEL_ZOUT_H: 0x3F,
	ACCEL_ZOUT_L: 0x40,
	TEMP_OUT_H: 0x41,
	TEMP_OUT_L: 0x42,
	GYRO_XOUT_H: 0x43,
	GYRO_XOUT_L: 0x44,
	GYRO_YOUT_H: 0x45,
	GYRO_YOUT_L: 0x46,
	GYRO_ZOUT_H: 0x47,
	GYRO_ZOUT_L: 0x48,
	
	RA_USER_CTRL: 0x6A,
	RA_PWR_MGMT_1: 0x6B,
	RA_PWR_MGMT_2: 0x6C,
	PWR1_DEVICE_RESET_BIT: 7,
	PWR1_SLEEP_BIT:6,
	PWR1_CYCLE_BIT: 5,
	PWR1_TEMP_DIS_BIT: 3,
	PWR1_CLKSEL_BIT: 2,
	PWR1_CLKSEL_LENGTH: 3,
	
	GCONFIG_FS_SEL_BIT: 4,
	GCONFIG_FS_SEL_LENGTH: 2,
	
	GYRO_FS_250: 0x00,
	GYRO_FS_500: 0x01,
	GYRO_FS_1000: 0x02,
	GYRO_FS_2000: 0x03,
	
	CLOCK_INTERNAL: 0x00,
	CLOCK_PLL_XGYRO: 0x01,
	CLOCK_PLL_YGYRO: 0x02,
	CLOCK_PLL_ZGYRO: 0x03,
	CLOCK_KEEP_RESET: 0x07,
	CLOCK_PLL_EXT32K: 0x04,
	CLOCK_PLL_EXT19M: 0x05,

	ACONFIG_AFS_SEL_BIT: 4,
	ACONFIG_AFS_SEL_LENGTH: 2,
	ACCEL_FS_2: 0x00,
	ACCEL_FS_4: 0x01,
	ACCEL_FS_8: 0x02,
	ACCEL_FS_16: 0x03,
	
	I2C_SLV0_DO: 0x63,
	I2C_SLV1_DO: 0x64,
	I2C_SLV2_DO: 0x65,
	
	USERCTRL_DMP_EN_BIT: 7,
	USERCTRL_FIFO_EN_BIT: 6,
	USERCTRL_I2C_MST_EN_BIT: 5,
	USERCTRL_I2C_IF_DIS_BIT: 4,
	USERCTRL_DMP_RESET_BIT: 3,
	USERCTRL_FIFO_RESET_BIT: 2,
	USERCTRL_I2C_MST_RESET_BIT: 1,
	USERCTRL_SIG_COND_RESET_BIT: 0
};

/****************/
/** AK8963 MAP **/
/****************/
var AK8963 = {
	ADDRESS: 0x0C,
	WHO_AM_I: 0x00, // should return 0x48
	INFO: 0x01,
	ST1: 0x02,  // data ready status bit 0
	XOUT_L: 0x03,  // data
	XOUT_H: 0x04,
	YOUT_L: 0x05,
	YOUT_H: 0x06,
	ZOUT_L: 0x07,
	ZOUT_H: 0x08,
	ST2: 0x09,  // Data overflow bit 3 and data read error status bit 2
	CNTL: 0x0A,  // Power down (0000), single-measurement (0001), self-test (1000) and Fuse ROM (1111) modes on bits 3:0
	ASTC: 0x0C,  // Self test control
	I2CDIS: 0x0F,  // I2C disable
	ASAX: 0x10,  // Fuse ROM x-axis sensitivity adjustment value
	ASAY: 0x11,  // Fuse ROM y-axis sensitivity adjustment value
	ASAZ: 0x12,
	
	WHO_AM_I_BIT: 1,
	CNTL_MODE_BIT: 0,
	
	ST1_DRDY_BIT: 0,
	ST1_DOR_BIT: 1,
	
	CNTL_MODE_OFF: 0x00, // Power-down mode
	CNTL_MODE_SINGLE_MESURE: 0x01, // Single measurement mode
	CNTL_MODE_CONTINUE_MESURE_1: 0x02, // Continuous measurement mode 1
	CNTL_MODE_CONTINUE_MESURE_2: 0x06, // Continuous measurement mode 2
	CNTL_MODE_EXT_TRIG_MESURE: 0x04, // External trigger measurement mode
	CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
	CNTL_MODE_FULL_ROM_ACCESS: 0x0F  // Fuse ROM access mode
};

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 						MPU Configuration						   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

/**
 * @name mpu9250
 * @params Object {device: '', address: '', UpMagneto: false, DEBUG: false, ak_address: ''}
 */
var mpu9250 = function(cfg) {
	cfg = cfg || {};
	if (typeof cfg != "object")
		cfg = {};
	config = extend({},{device: '/dev/i2c-1', address: MPU9250.ADDRESS_AD0_LOW, UpMagneto: false, DEBUG: false, ak_address: AK8963.ADDRESS},cfg);
	this._config = config;
};

/**
 * @name initialize
 * @return boolean
 */
mpu9250.prototype.initialize = function() {
	this.i2c = new LOCAL_I2C(this._config.address, {device: this._config.device});
	this.debug = new debugConsole(this._config.DEBUG);
	this.debug.Log('INFO','device address is 0x' + this._config.address.toString(16) + ', device is ' + this._config.device);
	this.debug.Log('INFO','Initialization MPU9250 ....');
	
	// clear configuration
	this.i2c.writeBit(MPU9250.PWR_MGMT_1, 1, 0x80, function() {});
	this.debug.Log('INFO', 'Reset configuration MPU9250.');
	sleep.usleep(10000);
	
	// define clock source
	this.setClockSource(MPU9250.CLOCK_PLL_XGYRO);
	this.debug.Log('INFO', 'ClockSource to 0x' + MPU9250.CLOCK_PLL_XGYRO.toString(16));
	sleep.usleep(10000);
	
	// define gyro range
	this.setFullScaleGyroRange(MPU9250.GYRO_FS_250);
	this.debug.Log('INFO', 'Set setFullScaleGyroRange to 0x' + MPU9250.GYRO_FS_2000.toString(16));
	sleep.usleep(10000);
	
	// define accel range
	this.setFullScaleAccelRange(MPU9250.ACCEL_FS_4);
	this.debug.Log('INFO', 'Set setFullScaleAccelRange to 0x' + MPU9250.ACCEL_FS_16.toString(16));
	sleep.usleep(10000);
	
	// desiable sleepEnabled
	this.setSleepEnabled(false);
	this.debug.Log('INFO', 'SleepEnabled mode disabled');
	sleep.usleep(10000);
	this.debug.Log('INFO', 'END of initialization.');
	this.debug.Log('INFO', 'Device id : 0x' + this.getIDDevice().toString(16));
	this.debug.Log('INFO', 'Device is online ? ' + ((this.testDevice()) ? 'Yes': 'No'));
	this.success = this.testDevice();
	
	if (this._config.UpMagneto) {
		this.debug.Log('INFO', 'Enabled magnetometer. Starting initialization ....');
		this.enableMagnetometer();
		this.debug.Log('INFO', 'END of initialization.');
	}
	return this.success;
}

/**------------------|[ FUNCTION ]|------------------**/
/**
 * @name testDevice
 * @return boolean
 */
mpu9250.prototype.testDevice = function() {
	return (this.getIDDevice() & 0x71);
};

/**
 * @name enableMagnetometer
 * @return boolean
 */
mpu9250.prototype.enableMagnetometer = function() {
	if (this.i2c) {
		this.debug.Log('INFO', 'Disable I2C Master');
		this.setI2CMasterModeEnabled(false);
		sleep.usleep(100000);
		
		this.debug.Log('INFO', 'Enable BYPASS');
		this.setByPASSEnabled(true);
		sleep.usleep(100000);
		
		buffer = this.getByPASSEnabled();
		if (buffer & 0x02) {	
			this.debug.Log('INFO', 'Creation of a new Class ak8963.');
			this.ak8963 = new ak8963(this._config);
			
			this.debug.Log('INFO', 'END of configuration of magnetometer.');
		} else {
			this.debug.Log('ERROR', 'Can\'t turn on RA_INT_PIN_CFG.');
			console.log(buffer);
		}
		//console.log(this.ak8963.getMotion6());
	}
	return false;
};

/**---------------------|[ GET ]|--------------------**/
/**
 * @name getTemperature
 * @return Byte | false
 */
mpu9250.prototype.getIDDevice = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.WHO_AM_I, 6, 8, function(){});
	}
	return false;
};

/**
 * @name getTemperature
 * @return int | false
 */
mpu9250.prototype.getTemperature = function() {
	if (this.i2c) {
		buffer = this.i2c.readBytes(MPU9250.TEMP_OUT_H, 2, function(){});
		return buffer.readInt16BE(0);
	}
	return false;
};

/**
 * @name getTemperatureCelsius
 * @return string
 */
mpu9250.prototype.getTemperatureCelsius = function() {
/*
((TEMP_OUT – RoomTemp_Offset)/Temp_Sensitivity) + 21degC
*/
	if ((TEMP_OUT = this.getTemperature()) !== false) {
		inc = (TEMP_OUT / 333.87) + 21.0;
		return inc + '°C';
	}
	return 'no data';
};

/**
 * @name getMotion6
 * @return array | false
 */
mpu9250.prototype.getMotion6 = function() {
	if (this.i2c) {
		buffer = this.i2c.readBytes(MPU9250.ACCEL_XOUT_H, 14, function(){});
		return [
			buffer.readInt16BE(0),
			buffer.readInt16BE(2),
			buffer.readInt16BE(4),
			buffer.readInt16BE(8),
			buffer.readInt16BE(10),
			buffer.readInt16BE(12)
		];
	}
	return false;
};

/**
 * @name getMotion9
 * @return array | false
 */

mpu9250.prototype.getMotion9 = function() {
	if (this.i2c) {
		mpudata = this.getMotion6();
		if (this.ak8963) {
			magdata = this.ak8963.getMotion6();
		} else {
			magdata = [0,0,0];
		}
		return mpudata.concat(magdata);
	}
	return false;
};
 
/**
 * @name getAccel
 * @return array | false
 */ 
mpu9250.prototype.getAccel = function() {
	if (this.i2c) {
		buffer = this.i2c.readBytes(MPU9250.ACCEL_XOUT_H, 6, function(){});
		return [
			buffer.readInt16BE(0),
			buffer.readInt16BE(2),
			buffer.readInt16BE(4)
		];
	}
	return false;
};

/**
 * @name getAccel
 * @return array | false
 */ 
mpu9250.prototype.getGyro = function() {
	if (this.i2c) {
		buffer = this.i2c.readBytes(MPU9250.GYRO_XOUT_H, 6, function(){});
		return [
			buffer.readInt16BE(0),
			buffer.readInt16BE(2),
			buffer.readInt16BE(4)
		];
	}
	return false;
};

/**
 * @name getSleepEnabled
 * @return byte | false
 */
mpu9250.prototype.getSleepEnabled = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_SLEEP_BIT); 
	}
	return false;
};

/**
 * @name getClockSource
 * @return byte | false
 */
mpu9250.prototype.getClockSource = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_CLKSEL_BIT); 
	}
	return false;
};

/**
 * @name getFullScaleGyroRange
 * @return byte | false
 */
 mpu9250.prototype.getFullScaleGyroRange = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.RA_GYRO_CONFIG, MPU9250.PWR1_CLKSEL_BIT); 
	}
	return false;
};

/**
 * @name getFullScaleAccelRange
 * @return byte | false
 */
mpu9250.prototype.getFullScaleAccelRange = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.RA_ACCEL_CONFIG, MPU9250.PWR1_CLKSEL_BIT); 
	}
	return false;
}

/**
 * @name getByPASSEnabled
 * @return undefined | false
 */
mpu9250.prototype.getByPASSEnabled = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9250.RA_INT_PIN_CFG, MPU9250.INTCFG_BYPASS_EN_BIT);
	}
	return false;
};

/**---------------------|[ SET ]|--------------------**/

/**
 * @name setClockSource
 * @return undefined | false
 */
mpu9250.prototype.setClockSource = function(adrs) {
	if (this.i2c) {
		return this.i2c.writeBits(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_CLKSEL_BIT, MPU9250.PWR1_CLKSEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setFullScaleGyroRange
 * @return undefined | false
 */
mpu9250.prototype.setFullScaleGyroRange = function(adrs) {
	if (this.i2c) {
		return this.i2c.writeBits(MPU9250.RA_GYRO_CONFIG, MPU9250.PWR1_CLKSEL_BIT, MPU9250.PWR1_CLKSEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setFullScaleAccelRange
 * @return undefined | false
 */
mpu9250.prototype.setFullScaleAccelRange = function(adrs) {
	if (this.i2c) {
		return this.i2c.writeBits(MPU9250.RA_ACCEL_CONFIG, MPU9250.PWR1_CLKSEL_BIT, MPU9250.PWR1_CLKSEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setSleepEnabled
 * @return undefined | false
 */
mpu9250.prototype.setSleepEnabled = function(bool) {
	adrs = (bool === true);
	if (this.i2c) {
		return this.i2c.writeBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_SLEEP_BIT, adrs);
	}
	return false;
};

/**
 * @name setSleepEnabled
 * @return undefined | false
 */
mpu9250.prototype.setI2CMasterModeEnabled = function(bool) {
	adrs = (bool === true);
	if (this.i2c) {
		return this.i2c.writeBit(MPU9250.RA_USER_CTRL, MPU9250.USERCTRL_I2C_MST_EN_BIT, adrs);
	}
	return false;
};

/**
 * @name setByPASSEnabled
 * @return undefined | false
 */
mpu9250.prototype.setByPASSEnabled = function(bool) {
	adrs = (bool === true);
	if (this.i2c) {
		return this.i2c.writeBit(MPU9250.RA_INT_PIN_CFG, MPU9250.INTCFG_BYPASS_EN_BIT, adrs);
	}
	return false;
};

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 					Magnetometer Configuration					   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

var ak8963 = function(config, callback) {
	callback = callback || function() {};
	this._config = config;
	this.debug = new debugConsole(config.DEBUG);
	this._config.ak_address = this._config.ak_address || AK8963.ADDRESS;
	this.debug.Log('INFO', 'AK8963 Address is 0x' + this._config.ak_address.toString(16) + ', Device is ' + this._config.device);
	// connection with magnetometer
	this.i2c = new LOCAL_I2C(this._config.ak_address, {device: this._config.device});
	sleep.usleep(100000);
	buffer = this.getIDDevice();
	this.debug.Log('INFO', 'Device ID is ' + buffer.toString(16));

	if (buffer & 0x48) {
		this.debug.Log('INFO', 'Magnetometer data is ready to work.');
		this.setCNTL(AK8963.CNTL_MODE_SINGLE_MESURE);
		sleep.usleep(100000);
		buffer = this.getDataReady();
		if (buffer & 0x01) {
			this.debug.Log('INFO', 'DATA is ready, buffer value : ' + buffer.toString(16));
			this.getMotion6();
			callback(true);
			this._ready = true;
		} else {
			this.debug.Log('INFO', 'DATA is not ready, buffer value : ' + buffer.toString(16));
		}
	} else {
		this.debug.Log('ERROR', 'Device ID is not equal to 0x48, device value is ' + buffer.toString(16));
	}
	this._ready = false;
	callback(false);
};

/**------------------|[ FUNCTION ]|------------------**/


/**---------------------|[ GET ]|--------------------**/

/**
 * @name getDataReady
 * @return byte | false
 */
ak8963.prototype.getDataReady = function() {
	if (this.i2c) {
		return this.i2c.readBit(AK8963.ST1, AK8963.ST1_DRDY_BIT);
	}
	return false;
};

 
/**
 * @name getIDDevice
 * @return byte | false
 */
ak8963.prototype.getIDDevice = function() {
	if (this.i2c) {
		return this.i2c.readBit(AK8963.WHO_AM_I, AK8963.WHO_AM_I_BIT);
	}
	return false;
};

/**
 * @name getMotion6
 * @return array | false
 */
ak8963.prototype.getMotion6 = function() {
	if (this.i2c) {
		var buffer = this.i2c.readBytes(AK8963.XOUT_L, 7, function(){});
		if (!(buffer[6] & 0x08)) {
			return [
				buffer.readInt16BE(0),
				buffer.readInt16BE(2),
				buffer.readInt16BE(4)
			];
		}
	}
	return false;
};

/**
 * @name getCNTL
 * @return byte | false
 */
ak8963.prototype.getCNTL = function() {
	if (this.i2c) {
		return this.i2c.readBit(AK8963.CNTL, AK8963.CNTL_MODE_BIT);
	}
	return false;
};

/**---------------------|[ SET ]|--------------------**/

/**
 * @name setCNTL
 * CNTL_MODE_OFF: 0x00, // Power-down mode
 * CNTL_MODE_SINGLE_MESURE: 0x01, // Single measurement mode
 * CNTL_MODE_CONTINUE_MESURE_1: 0x02, // Continuous measurement mode 1
 * CNTL_MODE_CONTINUE_MESURE_2: 0x06, // Continuous measurement mode 2
 * CNTL_MODE_EXT_TRIG_MESURE: 0x04, // External trigger measurement mode
 * CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
 * CNTL_MODE_FULL_ROM_ACCESS: 0x0F  // Fuse ROM access mode
 * @return undefined | false
 */
ak8963.prototype.setCNTL = function(adrs) {
	if (this.i2c) {
		return this.i2c.writeBit(AK8963.CNTL, AK8963.CNTL_MODE_BIT, adrs);
	}
	return false;
};

ak8963.prototype.constructor = ak8963;

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 					Debug Console Configuration					   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

var debugConsole = function(debug) {
	this.enabled = debug || false;
};
debugConsole.prototype.Log = function(type,str) {
	if (this.enabled) {
		date = new Date();
		strdate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
		strhour = date.getHours() + ':' + date.getMinutes();
		console.log('[' + type.toUpperCase() + '][' + strhour + ' ' + strdate + ']:' + str);
	}
};
debugConsole.prototype.constructor = debugConsole;

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 					I2C SURCHARGE Configuration					   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

var LOCAL_I2C = function(adrs, params) {
	MOD_I2C.call(this, adrs, params);
};
 
LOCAL_I2C.prototype = Object.create(MOD_I2C.prototype);
LOCAL_I2C.prototype.constructor = LOCAL_I2C;

LOCAL_I2C.prototype.bitMask = function(bit, length) {
  return ((1 << length) - 1) << (1 + bit - length);
};

LOCAL_I2C.prototype.readBit = function(adrs, bit, length, callback) {
	callback = callback || function(e,r) {};
	var buf = this.readBytes(adrs, 1, callback);
	return buf[0];
};

LOCAL_I2C.prototype.writeBits = function(adrs, bit, legnth, value, callback) {
	callback = callback || function(e,r) {};
	var oldValue = this.readBytes(adrs, 1, callback);
	var mask = this.bitMask(bit, legnth);
	var newValue = oldValue ^ ((oldValue ^ (value << bit)) & mask);
	return this.writeBytes(adrs, [newValue], callback);
};

LOCAL_I2C.prototype.writeBit = function(adrs, bit, value, callback) {
	callback = callback || function(e,r) {};
	return this.writeBits(adrs, bit, 1, value, callback);
};

/*******************************/
/** export the module to node **/
/*******************************/

module.exports = mpu9250;