/* eslint-disable @typescript-eslint/no-explicit-any */
import { MPU9250Map, AK8963Map } from './maps';
import { IConfig } from './iconfig';
import extend from 'extend';
import { Debug } from './debug';
import { I2cService } from './i2c-service';
import { ak8963 } from './ak8963';
import sleep from 'sleep';

/**
 * NodeJs Module : MPU9250
 * @author BENKHADRA Hocine
 * @description Simple reading data for node js and mpu9250
 * @version 1.0.0
 * @dependent @abandonware/i2c, extend, sleep
 * @license MIT
 */
export class mpu9250 {

  /** Default gyro offset values */
  private static readonly _DEFAULT_GYRO_OFFSET = { x: 0, y: 0, z: 0 };

  /** Default accel calibration values */
  private static readonly _DEFAULT_ACCEL_CALIBRATION = {
    offset: { x: 0, y: 0, z: 0 },
    scale: {
      x: [-1, 1],
      y: [-1, 1],
      z: [-1, 1]
    }
  };

  private static readonly _CLK_RNG = [
    '0 (Internal 20MHz oscillator)',
    '1 (Auto selects the best available clock source)',
    '2 (Auto selects the best available clock source)',
    '3 (Auto selects the best available clock source)',
    '4 (Auto selects the best available clock source)',
    '5 (Auto selects the best available clock source)',
    '6 (Internal 20MHz oscillator)',
    '7 (Stops the clock and keeps timing generator in reset)'
  ];

  private static readonly _STR_FS_ACCEL_RANGE = ['±2g (0)', '±4g (1)', '±8g (2)', '±16g (3)'];

  private static readonly _STR_FS_GYRO_RANGE = ['+250dps (0)', '+500 dps (1)', '+1000 dps (2)', '+2000 dps (3)'];

  private static readonly _FS_GYRO_RANGE = [ MPU9250Map.GYRO_FS_250, MPU9250Map.GYRO_FS_500, MPU9250Map.GYRO_FS_1000, MPU9250Map.GYRO_FS_2000 ];

  private static readonly _FS_ACCEL_RANGE = [ MPU9250Map.ACCEL_FS_2, MPU9250Map.ACCEL_FS_4, MPU9250Map.ACCEL_FS_8, MPU9250Map.ACCEL_FS_16 ];

  /** Default magnetometer calibration values */
  private static readonly _DEFAULT_CALIBRATION = {
    offset: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  };

  public static readonly MPU9250 = MPU9250Map;
  public static readonly AK8963 = AK8963Map;

  public accelScalarInv = 0;
  public gyroScalarInv = 0;
  public readonly i2c: I2cService;
  public readonly debug: Debug;
  public ak8963: ak8963;

  private readonly _config: IConfig;

  constructor(config: IConfig) {
    /** Default configuration */
    const _default = {
      device: '/dev/i2c-1',
      address: MPU9250Map.I2C_ADDRESS_AD0_LOW,
      UpMagneto: false,
      DEBUG: false,
      scaleValues: false,
      ak_address: AK8963Map.ADDRESS,
      GYRO_FS: 0,
      ACCEL_FS: 2,
      gyroBiasOffset: mpu9250._DEFAULT_GYRO_OFFSET,
      accelCalibration: mpu9250._DEFAULT_ACCEL_CALIBRATION
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._config = extend({}, _default, (config && config instanceof Object) ? config : {});

    /** IF no device configured should not able to run this plugin */
    if (!this._config.device) {
      throw new Error('Device parameter required!');
    }
    /** If address not defined */
    if (!this._config.address) {
      throw new Error('Address parameter required!');
    }

    /** print debug */
    this.debug = new Debug(this._config.DEBUG || false);
    /** I2C Service Read/Write */
    this.i2c = new I2cService(this._config.address, { device: this._config.device });
    /** Magnetomater */
    this.ak8963 = new ak8963(this._config);
  }

  /**
   * @name initialize
   * @return {boolean}
   */
  public initialize() : boolean {
    this.debug.log('info', 'Initialization MPU9250 ....');
    // clear configuration
    this.resetConfig();

    // defined sample rate
    if (this._config?.SAMPLE_RATE && this.hasSampleRate) {
      this.setSampleRate(this._config.SAMPLE_RATE);
      sleep.usleep(100000);
    }

    // define DLPF_CFG
    if (this._config?.DLPF_CFG) {
      this.setDLPFConfig(this._config.DLPF_CFG);
      sleep.usleep(100000);
    }

    // define A_DLPF_CFG
    if (this._config?.A_DLPF_CFG) {
      this.setAccelDLPFConfig(this._config.A_DLPF_CFG);
      sleep.usleep(100000);
    }
    
    // define clock source
    this.setClockSource(MPU9250Map.CLOCK_PLL_XGYRO);
    sleep.usleep(10000);

    // define gyro range
    this.setFullScaleGyroRange(this._getFsGyroValue(this._config?.GYRO_FS || -1));
    sleep.usleep(10000);

    // define accel range
    this.setFullScaleAccelRange(this._getFsAccelValue(this._config.ACCEL_FS || -1));
    sleep.usleep(10000);

    // disable sleepEnabled
    this.setSleepEnabled(false);
    sleep.usleep(10000);

    if (this._config?.UpMagneto) {
      this.debug.log('info', 'Enabled magnetometer. Starting initialization ....');
      this.enableMagnetometer();
      sleep.usleep(10000);
      this.debug.log('info', 'END of magnetometer initialization.');
    }
    this.debug.log('info', 'END of MPU9150 initialization.');

    // Print out the configuration
    if (this._config?.DEBUG) {
      this.printSettings();
      this.printAccelSettings();
      this.printGyroSettings();
      if (this.ak8963) {
        this.ak8963.printSettings();
      }
    }

    return this.testDevice();
  }

  /**
   * @name initialize
   * @return {Promise<boolean>}
   */
  public async initializeAsync() : Promise<boolean> {
    this.debug.log('info', 'Initialization MPU9250 ....');
    // clear configuration
    await this.resetConfigAsync();

    // defined sample rate
    if (this._config?.SAMPLE_RATE && this.hasSampleRate) {
      await this.setSampleRateAsync(this._config.SAMPLE_RATE);
    }

    // define DLPF_CFG
    if (this._config?.DLPF_CFG) {
      await this.setDLPFConfigAsync(this._config.DLPF_CFG);
    }

    // define A_DLPF_CFG
    if (this._config?.A_DLPF_CFG) {
      await this.setAccelDLPFConfigAsync(this._config.A_DLPF_CFG);
    }
    
    // define clock source
    await this.setClockSourceAsync(MPU9250Map.CLOCK_PLL_XGYRO);

    // define gyro range
    await this.setFullScaleGyroRangeAsync(this._getFsGyroValue(this._config?.GYRO_FS || -1));

    // define accel range
    await this.setFullScaleAccelRangeAsync(this._getFsAccelValue(this._config.ACCEL_FS || -1));

    // disable sleepEnabled
    await this.setSleepEnabledAsync(false);

    if (this._config?.UpMagneto) {
      this.debug.log('info', 'Enabled magnetometer. Starting initialization ....');
      await this.enableMagnetometerAsync();
      this.debug.log('info', 'END of magnetometer initialization.');
    }
    this.debug.log('info', 'END of MPU9150 initialization.');

    // Print out the configuration
    if (this._config?.DEBUG) {
      this.printSettings();
      this.printAccelSettings();
      this.printGyroSettings();
      if (this.ak8963) {
        this.ak8963.printSettings();
      }
    }

    return await this.testDeviceAsync();
  }

  /**
   * @name resetConfig
   * @description Reset configuration
   */
  public resetConfig() : void {
    this.i2c.writeBit(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_DEVICE_RESET_BIT, 1);
    sleep.usleep(10000);
    this.debug.log('info', 'Reset configuration MPU9250.');
  }

  /**
   * @name resetConfigAsync
   * @description Reset Configuration
   */
  public async resetConfigAsync() : Promise<void> {
    await this.i2c.writeBitAsync(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_DEVICE_RESET_BIT, 1);
    this.debug.log('info', 'Reset configuration MPU9250.');
  }

  /**
   * @name testDevice
   * @return {boolean}
   */
  public testDevice() : boolean {
    const currentDeviceID = this.getIDDevice();
    return !!(currentDeviceID && (currentDeviceID === MPU9250Map.ID_MPU_9250 || currentDeviceID === MPU9250Map.ID_MPU_9255));
  }

  /**
   * @name testDeviceAsync
   * @return {Promise<boolean>}
   */
  public async testDeviceAsync() : Promise<boolean> {
    const currentDeviceID = await this.getIDDeviceAsync();
    return !!(currentDeviceID && (currentDeviceID === MPU9250Map.ID_MPU_9250 || currentDeviceID === MPU9250Map.ID_MPU_9255));
  }

  /**
   * @name enableMagnetometer
   * @return {boolean}
   */
  public enableMagnetometer() : boolean {
    if (this.i2c) {
      this.setI2CMasterModeEnabled(false);
      sleep.usleep(100000);

      this.setByPASSEnabled(true);
      sleep.usleep(100000);

      if (this.getByPASSEnabled() && this.ak8963) {
        return this.ak8963.initialize();
      } else {
        this.debug.log('error', 'Can\'t turn on RA_INT_PIN_CFG.');
      }

    }
    return false;
  }

  /**
   * @name enableMagnetometerAsync
   * @return {Promise<boolean>}
   */
  public async enableMagnetometerAsync() : Promise<boolean> {
    if (this.i2c) {
      await this.setI2CMasterModeEnabledAsync(false);
      await this.setByPASSEnabledAsync(true);
      if (this.getByPASSEnabled() && this.ak8963) {
        return await this.ak8963.initializeAsync();
      } else {
        this.debug.log('error', 'Can\'t turn on RA_INT_PIN_CFG.');
      }

    }
    return false;
  }

  /**
   * @name getTemperatureCelsiusDigital
   * @param {number} temp
   * @return {number}
   */
  public getTemperatureCelsiusDigital(temp : number) : number {
    if (temp) {
      return (temp / 333.87) + 21.0;
    }
    return 0;
  }

  /** Getter */

  /**
   * @name getIDDevice
   * @return {number | false}
   */
  public getIDDevice() : number | false {
    if (this.i2c) {
      return this.i2c.readByte(MPU9250Map.WHO_AM_I);
    }
    return false;
  }

  /**
   * @name getIDDeviceAsync
   * @return {Promise<number | false>}
   */
  public getIDDeviceAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readByteAsync(MPU9250Map.WHO_AM_I);
    }
    return Promise.resolve(false);
  }

  /**
   * @name getTemperature
   * @return {number | false}
   */
  public getTemperature() : number | false {
    if (this.i2c) {
      const buffer = this.i2c.readBytes(MPU9250Map.TEMP_OUT_H, 2);
      return buffer.readInt16BE(0);
    }
    return false;
  }

  /**
   * @name getTemperatureAsync
   * @return {Promise<number | false>}
   */
  public getTemperatureAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readBytesAsync(MPU9250Map.TEMP_OUT_H, 2)
      .then(buffer => {
        return buffer.readInt16BE(0);
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name getTemperatureCelsius
   * @return {string}
   */
  public getTemperatureCelsius() : string {
    /*
    ((TEMP_OUT – RoomTemp_Offset)/Temp_Sensitivity) + 21degC
    */
    let TEMP_OUT = this.getTemperature();
    if (TEMP_OUT) {
      TEMP_OUT = this.getTemperatureCelsiusDigital(TEMP_OUT);
      return `${TEMP_OUT}°C`;
    } else {
      return 'no data';
    }
  }

  /**
   * @name getTemperatureCelsiusAsync
   * @return {Promise<string>}
   */
  public async getTemperatureCelsiusAsync() : Promise<string> {
    /*
    ((TEMP_OUT – RoomTemp_Offset)/Temp_Sensitivity) + 21degC
    */
    let TEMP_OUT = await this.getTemperatureAsync();
    if (TEMP_OUT) {
      TEMP_OUT = this.getTemperatureCelsiusDigital(TEMP_OUT);
      return `${TEMP_OUT}°C`;
    } else {
      return 'no data';
    }
  }

  /**
   * @name getMotion6
   * @return {number[] | false}
   */
  public getMotion6() : number[] | false {
    if (this.i2c) {
      const buffer = this.i2c.readBytes(MPU9250Map.ACCEL_XOUT_H, 14);

      const gCal = this._config.gyroBiasOffset;
      const aCal = this._config.accelCalibration;

      if (!gCal || !aCal) {
        return false;
      }

      const xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
      const yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
      const zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

      return [
        mpu9250.scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
        mpu9250.scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
        mpu9250.scaleAccel(zAccel, aCal.offset.z, aCal.scale.z),
        // Skip Temperature - bytes 6:7
        buffer.readInt16BE(8) * this.gyroScalarInv + gCal.x,
        buffer.readInt16BE(10) * this.gyroScalarInv + gCal.y,
        buffer.readInt16BE(12) * this.gyroScalarInv + gCal.z
      ];
    }
    return false;
  }

  /**
   * @name getMotion6Async
   * @return {Promise<number[] | false>}
   */
  public async getMotion6Async() : Promise<number[] | false> {
    if (this.i2c) {
      const buffer = await this.i2c.readBytesAsync(MPU9250Map.ACCEL_XOUT_H, 14);

      const gCal = this._config.gyroBiasOffset;
      const aCal = this._config.accelCalibration;

      if (!gCal || !aCal) {
        return false;
      }

      const xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
      const yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
      const zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

      return [
        mpu9250.scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
        mpu9250.scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
        mpu9250.scaleAccel(zAccel, aCal.offset.z, aCal.scale.z),
        // Skip Temperature - bytes 6:7
        buffer.readInt16BE(8) * this.gyroScalarInv + gCal.x,
        buffer.readInt16BE(10) * this.gyroScalarInv + gCal.y,
        buffer.readInt16BE(12) * this.gyroScalarInv + gCal.z
      ];
    }
    return false;
  }

  /**
   * @name getMotion9
   * @return {number[] | false}
   */
  public getMotion9() : number[] | false {
    if (this.i2c) {
      const mpudata: number[] | false = this.getMotion6();
      if (!mpudata) {
        return false;
      }
      let magdata = [];
      if (this.ak8963?.isEnabled && this.ak8963.isReady) {
        magdata = this.ak8963.getMagAttitude() || [0, 0, 0];
      } else {
        magdata = [0, 0, 0];
      }
      return mpudata.concat(magdata);
    }
    return false;
  }

  /**
   * @name getMotion9Async
   * @return {Promise<number[] | false>}
   */
  public async getMotion9Async() : Promise<number[] | false> {
    if (this.i2c) {
      const mpudata: number[] | false = await this.getMotion6Async();
      if (!mpudata) {
        return false;
      }
      let magdata = [];
      if (this.ak8963?.isEnabled && this.ak8963.isReady) {
        magdata = await this.ak8963.getMagAttitudeAsync() || [0, 0, 0];
      } else {
        magdata = [0, 0, 0];
      }
      return mpudata.concat(magdata);
    }
    return false;
  }

  /**
   * @name getAccel
   * @return {number[] | false}
   */
  public getAccel() : number[] | false {
    if (this.i2c) {
      const buffer = this.i2c.readBytes(MPU9250Map.ACCEL_XOUT_H, 6);
      const aCal = this._config.accelCalibration;

      if (!aCal) {
        return false;
      }

      const xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
      const yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
      const zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

      return [
        mpu9250.scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
        mpu9250.scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
        mpu9250.scaleAccel(zAccel, aCal.offset.z, aCal.scale.z)
      ];
    }
    return false;
  }

  /**
   * @name getAccelAsync
   * @return {Promise<number[] | false>}
   */
  public async getAccelAsync() : Promise<number[] | false> {
    if (this.i2c) {
      const buffer = await this.i2c.readBytesAsync(MPU9250Map.ACCEL_XOUT_H, 6);
      const aCal = this._config.accelCalibration;

      if (!aCal) {
        return false;
      }

      const xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
      const yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
      const zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

      return [
        mpu9250.scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
        mpu9250.scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
        mpu9250.scaleAccel(zAccel, aCal.offset.z, aCal.scale.z)
      ];
    }
    return false;
  }

  /**
   * @name getGyro
   * @return {number[] | false}
   */
  public getGyro() : number[] | false {
    if (this.i2c) {
      const buffer = this.i2c.readBytes(MPU9250Map.GYRO_XOUT_H, 6);
      const gCal = this._config.gyroBiasOffset;

      if (!gCal) {
        return false;
      }

      return [
        buffer.readInt16BE(0) * this.gyroScalarInv + gCal.x,
        buffer.readInt16BE(2) * this.gyroScalarInv + gCal.y,
        buffer.readInt16BE(4) * this.gyroScalarInv + gCal.z
      ];
    }
    return false;
  }

  /**
   * @name getGyroAsync
   * @return {Async<number[] | false>}
   */
  public async getGyroAsync() : Promise<number[] | false> {
    if (this.i2c) {
      const buffer = await this.i2c.readBytesAsync(MPU9250Map.GYRO_XOUT_H, 6);
      const gCal = this._config.gyroBiasOffset;

      if (!gCal) {
        return false;
      }

      return [
        buffer.readInt16BE(0) * this.gyroScalarInv + gCal.x,
        buffer.readInt16BE(2) * this.gyroScalarInv + gCal.y,
        buffer.readInt16BE(4) * this.gyroScalarInv + gCal.z
      ];
    }
    return false;
  }

  /**
   * @name getSleepEnabled
   * @return {number | false}
   */
  public getSleepEnabled() : number | false {
    if (this.i2c) {
      return this.i2c.readBit(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_SLEEP_BIT);
    }
    return false;
  }

  /**
   * @name getSleepEnabledAsync
   * @return {Promise<number | false>}
   */
  public async getSleepEnabledAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readBitAsync(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_SLEEP_BIT);
    }
    return false;
  }

  /**
   * @name getClockSource
   * @return {number | false}
   */
  public getClockSource() : number | false {
    if (this.i2c) {
      return this.i2c.readByte(MPU9250Map.RA_PWR_MGMT_1) & 0x07;
    }
    return false;
  }

  /**
   * @name getClockSourceAsync
   * @return {Promise<number | false>}
   */
  public async getClockSourceAsync() : Promise<number | false> {
    if (this.i2c) {
      return await this.i2c.readByteAsync(MPU9250Map.RA_PWR_MGMT_1) & 0x07;
    }
    return false;
  }

  /**
   * @name getFullScaleGyroRange
   * @return {number | false}
   */
  public getFullScaleGyroRange() : number | false {
    if (this.i2c) {
      let byte = this.i2c.readByte(MPU9250Map.RA_GYRO_CONFIG);
      byte = byte & 0x18;
      byte = byte >> 3;
      return byte;
    }
    return false;
  }

  /**
   * @name getFullScaleGyroRangeAsync
   * @return {Promise<number | false>}
   */
  public async getFullScaleGyroRangeAsync() : Promise<number | false> {
    if (this.i2c) {
      let byte = await this.i2c.readByteAsync(MPU9250Map.RA_GYRO_CONFIG);
      byte = byte & 0x18;
      byte = byte >> 3;
      return byte;
    }
    return false;
  }

  /**
   * @name getGyroPowerSettings
   * @return {number[] | false}
   */
  public getGyroPowerSettings() : number[] | false {
    if (this.i2c) {
      let byte = this.i2c.readByte(MPU9250Map.RA_PWR_MGMT_2);
      byte = byte & 0x07;
      return [
        (byte >> 2) & 1,    // X
        (byte >> 1) & 1,    // Y
        (byte >> 0) & 1	    // Z
      ];
    }
    return false;
  }

  /**
   * @name getGyroPowerSettingsAsync
   * @return {Promise<number[] | false>}
   */
  public async getGyroPowerSettingsAsync() : Promise<number[] | false> {
    if (this.i2c) {
      let byte = await this.i2c.readByteAsync(MPU9250Map.RA_PWR_MGMT_2);
      byte = byte & 0x07;
      return [
        (byte >> 2) & 1,    // X
        (byte >> 1) & 1,    // Y
        (byte >> 0) & 1	    // Z
      ];
    }
    return false;
  }

  /**
   * @name getAccelPowerSettings
   * @return {number[] | false}
   */
  public getAccelPowerSettings() : number[] | false {
    if (this.i2c) {
      let byte = this.i2c.readByte(MPU9250Map.RA_PWR_MGMT_2);
      byte = byte & 0x38;
      return [
        (byte >> 5) & 1, // X
        (byte >> 4) & 1, // Y
        (byte >> 3) & 1 // Z
      ];
    }
    return false;
  }

  /**
   * @name getAccelPowerSettingsAsync
   * @return {Promise<number[] | false>}
   */
  public async getAccelPowerSettingsAsync() : Promise<number[] | false> {
    if (this.i2c) {
      let byte = await this.i2c.readByteAsync(MPU9250Map.RA_PWR_MGMT_2);
      byte = byte & 0x38;
      return [
        (byte >> 5) & 1, // X
        (byte >> 4) & 1, // Y
        (byte >> 3) & 1 // Z
      ];
    }
    return false;
  }

  /**
   * @name getFullScaleAccelRange
   * @return {number | false}
   */
  public getFullScaleAccelRange() : number | false {
    if (this.i2c) {
      let byte = this.i2c.readByte(MPU9250Map.RA_ACCEL_CONFIG_1);
      byte = byte & 0x18;
      byte = byte >> 3;
      return byte;
    }
    return false;
  }

  /**
   * @name getFullScaleAccelRangeAsync
   * @return {Promise<number | false>}
   */
  public async getFullScaleAccelRangeAsync() : Promise<number | false> {
    if (this.i2c) {
      let byte = await this.i2c.readByteAsync(MPU9250Map.RA_ACCEL_CONFIG_1);
      byte = byte & 0x18;
      byte = byte >> 3;
      return byte;
    }
    return false;
  }

  /**
   * @name getByPASSEnabled
   * @return {number | false}
   */
  public getByPASSEnabled() : number | false {
    if (this.i2c) {
      return this.i2c.readBit(MPU9250Map.RA_INT_PIN_CFG, MPU9250Map.INTCFG_BYPASS_EN_BIT);
    }
    return false;
  }

  /**
   * @name getByPASSEnabled
   * @return {Promise<number | false>}
   */
  public getByPASSEnabledAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readBitAsync(MPU9250Map.RA_INT_PIN_CFG, MPU9250Map.INTCFG_BYPASS_EN_BIT);
    }
    return Promise.resolve(false);
  }

  /**
   * @name getI2CMasterMode
   * @return {number | false}
   */
  public getI2CMasterMode() : number | false {
    if (this.i2c) {
      return this.i2c.readBit(MPU9250Map.RA_USER_CTRL, MPU9250Map.USERCTRL_I2C_MST_EN_BIT);
    }
    return false;
  }

  /**
   * @name getI2CMasterModeAsync
   * @return {Promise<number | false>}
   */
  public getI2CMasterModeAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readBitAsync(MPU9250Map.RA_USER_CTRL, MPU9250Map.USERCTRL_I2C_MST_EN_BIT);
    }
    return Promise.resolve(false);
  }

  /**
   * @name getPitch
   * @param {number[]} value
   * @return {number}
   */
  public getPitch(value: number[]) : number {
    return ((Math.atan2(value[0], value[2]) + Math.PI) * (180 / Math.PI)) - 180;
  }

  /**
   * @name getRoll
   * @param {number[]} value
   * @return {number}
   */
  public getRoll(value: number[]) : number {
    return ((Math.atan2(value[1], value[2]) + Math.PI) * (180 / Math.PI)) - 180;
  }

  /**
   * @name getYaw
   * @param {number[]} value
   * @return {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getYaw(value: number[]) : 0 {
    return 0;
  }


  /**
   * @name printAccelSettings
   */
  printSettings() : void {
    this.debug.log('info', 'MPU9250:');
    if (this._config?.address) {
      this.debug.log('info', `--> Device address: 0x${this._config.address.toString(16)}`);
      this.debug.log('info', `--> i2c bus: 0x${this.getIDDevice().toString(16)}`);
      this.debug.log('info', `--> Device ID: 0x${this.getIDDevice().toString(16)}`);
      this.debug.log('info', `--> BYPASS enabled: ${this.getByPASSEnabled() ? 'Yes' : 'No'}`);
      this.debug.log('info', `--> SleepEnabled Mode: ${this.getSleepEnabled() === 1 ? 'On' : 'Off'}`);
      this.debug.log('info', `--> i2c Master Mode: ${this.getI2CMasterMode() === 1 ? 'Enabled' : 'Disabled'}`);
      this.debug.log('info', `--> Power Management (0x6B, 0x6C):`);
      this.debug.log('info', `  --> Clock Source: ${mpu9250._CLK_RNG[this.getClockSource() || 0]}`);
      this.debug.log('info', `  --> Accel enabled (x, y, z): ${mpu9250.vectorToYesNo(this.getAccelPowerSettings() || [1, 1, 1])}`);
      this.debug.log('info', `  --> Gyro enabled (x, y, z): ${mpu9250.vectorToYesNo(this.getGyroPowerSettings() || [1, 1, 1])}`);
    } else {
      this.debug.log('error', 'No address defined!');
    }
  }

  /**
   * @name printAccelSettings
   */
  public printAccelSettings() : void {
    this.debug.log('info', 'Accelerometer:');
    this.debug.log('info', `--> Full Scale Range (0x1C): ${mpu9250._STR_FS_ACCEL_RANGE[this.getFullScaleAccelRange() || 0]}`);
    this.debug.log('info', `--> Scalar: 1/${1 / this.accelScalarInv}`);
    this.debug.log('info', `--> Calibration:`);
    this.debug.log('info', `  --> Offset:`);
    if (this._config?.accelCalibration?.offset) {
    this.debug.log('info', `    --> x: ${this._config.accelCalibration.offset.x}`);
    this.debug.log('info', `    --> y: ${this._config.accelCalibration.offset.y}`);
    this.debug.log('info', `    --> z: ${this._config.accelCalibration.offset.z}`);
    } else {
      this.debug.log('error', `    --> accelCalibration offset not defined!`);
    }
    this.debug.log('info', `  --> Scale:`);
    if (this._config?.accelCalibration?.scale) {
      this.debug.log('info', `    --> x: ${this._config.accelCalibration.scale.x}`);
      this.debug.log('info', `    --> y: ${this._config.accelCalibration.scale.y}`);
      this.debug.log('info', `    --> z: ${this._config.accelCalibration.scale.z}`);
    } else {
      this.debug.log('error', `    --> accelCalibration scale not defined!`);
    }
  }

  /**
   * @name printGyroSettings
   */
  public printGyroSettings() : void {
    this.debug.log('info', 'Gyroscope:');
    this.debug.log('info', `--> Full Scale Range (0x1B): ${mpu9250._STR_FS_GYRO_RANGE[this.getFullScaleGyroRange() || 0]}`);
    this.debug.log('info', `--> Scalar: 1/${1 / this.gyroScalarInv}`);
    this.debug.log('info', `--> Bias Offset:`);
    if (this._config?.gyroBiasOffset) {
      this.debug.log('info', `  --> x: ${this._config.gyroBiasOffset.x}`);
      this.debug.log('info', `  --> y: ${this._config.gyroBiasOffset.y}`);
      this.debug.log('info', `  --> z: ${this._config.gyroBiasOffset.z}`);
    } else {
      this.debug.log('error', `    --> gyroBiasOffset offset not defined!`);
    }
  }

  /** Setter */

  /**
   * @name setClockSource
   * @param {number} adrs
   * @return {number | false}
   */
  public setClockSource(adrs: number) : number | false {
    if (this.i2c) {
      this.i2c.writeBits(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_CLKSEL_BIT, MPU9250Map.PWR1_CLKSEL_LENGTH, adrs);
      return adrs;
    }
    return false;
  }

  /**
   * @name setClockSourceAsync
   * @param {number} adrs
   * @return {Promise<number | false>}
   */
  public setClockSourceAsync(adrs: number) : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.writeBitsAsync(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_CLKSEL_BIT, MPU9250Map.PWR1_CLKSEL_LENGTH, adrs)
      .then(() => {
        return adrs;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setFullScaleGyroRange
   * @param {number} adrs
   * @return {number | false}
   */
  public setFullScaleGyroRange(adrs: number) : number | false {
    if (this.i2c) {
      this._setGyroScalarInv(adrs);
      this.i2c.writeBits(MPU9250Map.RA_GYRO_CONFIG, MPU9250Map.GCONFIG_FS_SEL_BIT, MPU9250Map.GCONFIG_FS_SEL_LENGTH, adrs);
      return adrs;
    }
    return false;
  }

  /**
   * @name setFullScaleGyroRangeAsync
   * @param {number} adrs
   * @return {Promise<undefined | false>}
   */
  public setFullScaleGyroRangeAsync(adrs: number) : Promise<number | false> {
    if (this.i2c) {
      this._setGyroScalarInv(adrs);
      return this.i2c.writeBitsAsync(MPU9250Map.RA_GYRO_CONFIG, MPU9250Map.GCONFIG_FS_SEL_BIT, MPU9250Map.GCONFIG_FS_SEL_LENGTH, adrs)
      .then(() => {
        return adrs;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setFullScaleAccelRange
   * @param {number} adrs
   * @return {number | false}
   */
  public setFullScaleAccelRange(adrs: number): number | false {
    if (this.i2c) {
      this._setAccelScalarInv(adrs);
      this.i2c.writeBits(MPU9250Map.RA_ACCEL_CONFIG_1, MPU9250Map.ACONFIG_FS_SEL_BIT, MPU9250Map.ACONFIG_FS_SEL_LENGTH, adrs);
      return adrs;
    }
    return false;
  }

  /**
   * @name setFullScaleAccelRangeAsync
   * @param {number} adrs
   * @return {Promise<number | false>}
   */
  public setFullScaleAccelRangeAsync(adrs: number): Promise<number | false> {
    if (this.i2c) {
      this._setAccelScalarInv(adrs);
      return this.i2c.writeBitsAsync(MPU9250Map.RA_ACCEL_CONFIG_1, MPU9250Map.ACONFIG_FS_SEL_BIT, MPU9250Map.ACONFIG_FS_SEL_LENGTH, adrs)
      .then(() => {
        return adrs;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setSleepEnabled
   * @param {boolean} enable
   * @return {number | false}
   */
  public setSleepEnabled(enable: boolean): number | false {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      this.i2c.writeBit(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_SLEEP_BIT, val);
      return val;
    }
    return false;
  }

  /**
   * @name setSleepEnabledAsync
   * @param {boolean} enable
   * @return {Promise<number | false>}
   */
  public setSleepEnabledAsync(enable: boolean): Promise<number | false> {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      return this.i2c.writeBitAsync(MPU9250Map.RA_PWR_MGMT_1, MPU9250Map.PWR1_SLEEP_BIT, val)
      .then(() => {
      return val;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setI2CMasterModeEnabled
   * @param {boolean} enable
   * @return {number | false}
   */
  public setI2CMasterModeEnabled(enable: boolean): number | false {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      this.i2c.writeBit(MPU9250Map.RA_USER_CTRL, MPU9250Map.USERCTRL_I2C_MST_EN_BIT, val);
      return val;
    }
    return false;
  }

  /**
   * @name setI2CMasterModeEnabledAsync
   * @param {boolean} enable
   * @return {Promise<number | false>}
   */
  public setI2CMasterModeEnabledAsync(enable: boolean): Promise<number | false> {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      return this.i2c.writeBitAsync(MPU9250Map.RA_USER_CTRL, MPU9250Map.USERCTRL_I2C_MST_EN_BIT, val)
      .then(() => {
        return val;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setByPASSEnabled
   * @param {boolean} enable
   * @return {number | false}
   */
  public setByPASSEnabled(enable: boolean): number | false {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      this.i2c.writeBit(MPU9250Map.RA_INT_PIN_CFG, MPU9250Map.INTCFG_BYPASS_EN_BIT, val);
      return val;
    }
    return false;
  }

  /**
   * @name setByPASSEnabledAsync
   * @param {boolean} enable
   * @return {Promise<number | false>}
   */
  public setByPASSEnabledAsync(enable: boolean): Promise<number | false> {
    const val = enable ? 1 : 0;
    if (this.i2c) {
      return this.i2c.writeBitAsync(MPU9250Map.RA_INT_PIN_CFG, MPU9250Map.INTCFG_BYPASS_EN_BIT, val)
      .then(() => {
        return val;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setConfig
   * @param {number} dlpf_cfg
   * @return {number | false}
   */
  public setDLPFConfig(dlpf_cfg: number): number | false {
    if (this.i2c) {
      this.i2c.writeBits(MPU9250Map.RA_CONFIG, 0, 3, dlpf_cfg);
      return dlpf_cfg;
    }
    return false;
  }

  /**
   * @name setDLPFConfigAsync
   * @param {number} dlpf_cfg
   * @return {Promise<number | false>}
   */
  public setDLPFConfigAsync(dlpf_cfg: number): Promise<number | false> {
    if (this.i2c) {
      return this.i2c.writeBitsAsync(MPU9250Map.RA_CONFIG, 0, 3, dlpf_cfg)
      .then(() => {
        return dlpf_cfg;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setAccelDLPFConfig
   * @param {number} sample_rate
   * @return {number | false}
   */
  public setAccelDLPFConfig(a_dlpf_cfg: number): number | false {
    if (this.i2c) {
      this.i2c.writeBits(MPU9250Map.RA_ACCEL_CONFIG_2, 0, 4, a_dlpf_cfg);
      return a_dlpf_cfg;
    }
    return false;
  }

  /**
   * @name setAccelDLPFConfig
   * @param {number} sample_rate
   * @return {Promise<number | false>}
   */
  public setAccelDLPFConfigAsync(a_dlpf_cfg: number): Promise<number | false> {
    if (this.i2c) {
      return this.i2c.writeBitsAsync(MPU9250Map.RA_ACCEL_CONFIG_2, 0, 4, a_dlpf_cfg)
      .then(() => {
        return a_dlpf_cfg;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name setSampleRate
   * @param {number} sample_rate
   * @return {number | false}
   */
  public setSampleRate(sample_rate: number): number | false {
    if (this.i2c) {
      this.i2c.writeBits(MPU9250Map.SMPLRT_DIV, 0, 8, this._estimateRate(sample_rate));
      return sample_rate;
    }
    return false;
  }

  /**
   * @name setSampleRateAsync
   * @param {number} sample_rate
   * @return {Promise<number | false>}
   */
  public setSampleRateAsync(sample_rate: number): Promise<number | false> {
    if (this.i2c) {
      return this.i2c.writeBitsAsync(MPU9250Map.SMPLRT_DIV, 0, 8, this._estimateRate(sample_rate))
      .then(() => {
        return sample_rate;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * @name scaleAccel
   * @description This wee function just simplifies the code.  It scales the Accelerometer values appropriately. The values are scaled to 1g and the offset it taken into account.
   * @param {number} val
   * @param {number} offset
   * @param {number[]} scalerArr
   */
  public static scaleAccel(val: number, offset: number, scalerArr: number[]): number {
    if (val < 0) {
      return -(val - offset) / (scalerArr[0] - offset);
    } else {
      return (val - offset) / (scalerArr[1] - offset);
    }
  }

  /**
   * @name vectorToYesNo
   * @param {number[]} v
   */
  public static vectorToYesNo(v: number[]): string {
    const YesNo = (val: number) => val ? 'No' : 'Yes';
    return `(${YesNo(v[0])}, ${YesNo(v[1])}, ${YesNo(v[2])})`;
  }

  /**
   * @name _estimateRate
   * @description Calculate sample rate
   * @param {number} sample_rate
   * @return {number}
   */
  private _estimateRate(sample_rate : number) : number {
    if (sample_rate < MPU9250Map.SAMPLERATE_MAX && sample_rate >= 8000) {
      sample_rate = 8000;
    }
    if (sample_rate < 8000 && sample_rate > 1000) {
      sample_rate = 1000;
    }
    if (sample_rate < 1000) {
      sample_rate = 1000 / (1 + sample_rate);
    }
    return sample_rate;
  }
  

  /**
   * @name _setGyroScalarInv
   * @param {number} adrs
   * @return {number}
   */
  private _setGyroScalarInv(adrs : number) : void {
    if (this._config?.scaleValues) {
      this.gyroScalarInv = 1 / MPU9250Map.GYRO_SCALE_FACTOR[adrs];
    } else {
      this.gyroScalarInv = 1;
    }
  }

  /**
   * @name _setAccelScalarInv
   * @param {number} adrs
   * @return {number}
   */
  private _setAccelScalarInv(adrs : number) : void {
    if (this._config?.scaleValues) {
      this.accelScalarInv = 1 / MPU9250Map.ACCEL_SCALE_FACTOR[adrs];
    } else {
      this.accelScalarInv = 1;
    }
  }

  /**
   * @name _getFsGyroValue
   * @param {number} index
   * @return {number}
   */
  private _getFsGyroValue(index : number) : number {
    let gyro_value = MPU9250Map.GYRO_FS_250;
    if (this._config?.GYRO_FS && mpu9250._FS_GYRO_RANGE[index]) {
      gyro_value = mpu9250._FS_GYRO_RANGE[index];
    }
    return gyro_value;
  }

  /**
   * @name _getFsAccelValue
   * @param {number} index
   * @return {number}
   */
  private _getFsAccelValue(index : number) : number {
    let accel_fs = MPU9250Map.ACCEL_FS_4;
    if (this._config?.GYRO_FS && mpu9250._FS_ACCEL_RANGE[index]) {
      accel_fs = mpu9250._FS_ACCEL_RANGE[index];
    }
    return accel_fs;
  }

  /**
   * @return {boolean}
   */
  public get hasSampleRate() : boolean {
    return !!(this._config?.SAMPLE_RATE && ( this._config.SAMPLE_RATE > MPU9250Map.SAMPLERATE_MIN && this._config.SAMPLE_RATE < MPU9250Map.SAMPLERATE_MAX ));
  }
}
