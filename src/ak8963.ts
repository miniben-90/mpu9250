/* eslint-disable @typescript-eslint/no-explicit-any */
import sleep from 'sleep';
import { Debug } from './debug';
import { I2cService } from './i2c-service';
import { IConfig } from './iconfig';
import { AK8963Map } from './maps';

export class ak8963 {

  private static readonly _MODE_LST = {
    0: '0x00 (Power-down mode)',
    1: '0x01 (Single measurement mode)',
    2: '0x02 (Continuous measurement mode 1: 8Hz)',
    6: '0x06 (Continuous measurement mode 2: 100Hz)',
    4: '0x04 (External trigger measurement mode)',
    8: '0x08 (Self-test mode)',
    15: '0x0F (Fuse ROM access mode)'
  };

  private readonly debug : Debug;

  public readonly isEnabled : boolean = false;

  public asax = 1;
  public asay = 1;
  public asaz = 1;
  public isReady = false;

  constructor(private readonly _config : IConfig, private readonly i2c? : I2cService) {
    
    if (this._config?.ak_address && this._config?.device) {
      /** I2C Service Read/Write */
      this.i2c = new I2cService(this._config.ak_address, { device: this._config.device });
      this.isEnabled = true;
    }

    this.debug = new Debug(this._config.DEBUG || false);
  }

  /**
   * @name initialize
   * @return {boolean}
   */
  public initialize() : boolean {
    if (this.isEnabled && !this.isReady) {
      sleep.usleep(10000);
      const buffer = this.getIDDevice();
      if (buffer === AK8963Map.WHO_AM_I_RESPONSE) {
        this.debug.log('info', `AK8963: Setting magnetomater`);
        this.getSensitivityAdjustmentValues();
        sleep.usleep(10000);
        this.setCNTL(AK8963Map.CNTL_MODE_CONTINUE_MEASURE_2);
        sleep.usleep(10000);
        this.isReady = true;
        return true;
      } else {
        this.debug.log('error', `AK8963: Device ID is not equal to 0x${AK8963Map.WHO_AM_I_RESPONSE.toString(16)}, device value is 0x${buffer.toString(16)}`);
        return false;
      }
    } else {
      return this.isEnabled;
    }
  }

  /**
   * @name initializeAsync
   * @return {Promise<boolean>}
   */
  public async initializeAsync() : Promise<boolean> {
    if (this.isEnabled && !this.isReady) {
      const buffer = await this.getIDDeviceAsync();
      if (buffer === AK8963Map.WHO_AM_I_RESPONSE) {
        this.debug.log('info', `AK8963: Setting magnetomater`);
        await this.getSensitivityAdjustmentValuesAsync();
        await this.setCNTLAsync(AK8963Map.CNTL_MODE_CONTINUE_MEASURE_2);
        this.isReady = true;
        return true;
      } else {
        this.debug.log('error', `AK8963: Device ID is not equal to 0x${AK8963Map.WHO_AM_I_RESPONSE.toString(16)}, device value is 0x${buffer.toString(16)}`);
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * @name printSettings
   * @description Printing magnetometer settings
   */
  public printSettings() : void {
    if (this.isEnabled && this._config.ak_address) {
      this.debug.log('info', 'Magnetometer (Compass):');
      this.debug.log('info', `--> i2c address: 0x${this._config.ak_address.toString(16)}`);
      this.debug.log('info', `--> Device ID: 0x${this.getIDDevice().toString(16)}`);
      this.debug.log('info', `--> Mode: ${ak8963._MODE_LST[this.getCNTL() as number & 0x0F || 0]}`);
      this.debug.log('info', '--> Scalars:');
      this.debug.log('info', `  --> x: ${this.asax}`);
      this.debug.log('info', `  --> y: ${this.asay}`);
      this.debug.log('info', `  --> z: ${this.asaz}`);
    }
  }

  /** Getter */

  /**
   * @name getDataReady
   * @return {number | false}
   */
  public getDataReady() : number | false {
    if (this.i2c) {
      return this.i2c.readBit(AK8963Map.ST1, AK8963Map.ST1_DRDY_BIT);
    }
    return false;
  }

  /**
   * @name getDataReadyAsync
   * @return {number | false}
   */
  public getDataReadyAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readBitAsync(AK8963Map.ST1, AK8963Map.ST1_DRDY_BIT);
    }
    return Promise.resolve(false);
  }

  /**
   * @name getIDDevice
   * @return {number | false}
   */
  public getIDDevice() : number | false {
    if (this.i2c) {
      return this.i2c.readByte(AK8963Map.WHO_AM_I);
    }
    return false;
  }

  /**
   * @name getIDDeviceAsync
   * @return {Promise<number | false>}
   */
  public getIDDeviceAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readByteAsync(AK8963Map.WHO_AM_I);
    }
    return Promise.resolve(false);
  }

  /**
   * @name getSensitivityAdjustmentValues
   * @description Get the Sensitivity Adjustment values.  These were set during manufacture and allow us to get the actual H values from the magnetometer.
   */
  public getSensitivityAdjustmentValues() : void {

    if (!this._config.scaleValues || !this.i2c) {
      this.asax = 1;
      this.asay = 1;
      this.asaz = 1;
      return;
    }

    // Need to set to Fuse mode to get valid values from this.
    const currentMode = this.getCNTL();
    this.setCNTL(AK8963Map.CNTL_MODE_FUSE_ROM_ACCESS);
    sleep.usleep(10000);

    // Get the ASA* values
    this.asax = ((this.i2c.readByte(AK8963Map.ASAX) - 128) * 0.5 / 128 + 1);
    this.asay = ((this.i2c.readByte(AK8963Map.ASAY) - 128) * 0.5 / 128 + 1);
    this.asaz = ((this.i2c.readByte(AK8963Map.ASAZ) - 128) * 0.5 / 128 + 1);

    if (!currentMode) {
      return;
    }

    // Return the mode we were in before
    this.setCNTL(currentMode);
  }

  /**
   * @name getSensitivityAdjustmentValuesAsync
   * @description Get the Sensitivity Adjustment values.  These were set during manufacture and allow us to get the actual H values from the magnetometer.
   */
  public async getSensitivityAdjustmentValuesAsync() : Promise<void> {

    if (!this._config.scaleValues || !this.i2c) {
      this.asax = 1;
      this.asay = 1;
      this.asaz = 1;
      return;
    }

    // Need to set to Fuse mode to get valid values from this.
    const currentMode = await this.getCNTLAsync();
    await this.setCNTLAsync(AK8963Map.CNTL_MODE_FUSE_ROM_ACCESS);

    // Get the ASA* values
    this.asax = ((await this.i2c.readByteAsync(AK8963Map.ASAX) - 128) * 0.5 / 128 + 1);
    this.asay = ((await this.i2c.readByteAsync(AK8963Map.ASAY) - 128) * 0.5 / 128 + 1);
    this.asaz = ((await this.i2c.readByteAsync(AK8963Map.ASAZ) - 128) * 0.5 / 128 + 1);

    if (!currentMode) {
      return;
    }

    // Return the mode we were in before
    await this.setCNTLAsync(currentMode);
  }

  /**
   * @name getMagAttitude
   * @description Get the raw magnetometer values
   * @return {number[]}
   */
  getMagAttitude() : number[] {
    if (this.i2c) {
      // Get the actual data
      const buffer = this.i2c.readBytes(AK8963Map.XOUT_L, 6);
      const cal = this._config.magCalibration;

      if (!cal || !cal.offset || !cal.scale || !this.i2c) {
        return [0, 0, 0];
      }

      // For some reason when we read ST2 (Status 2) just after reading byte, this ensures the
      // next reading is fresh.  If we do it before without a pause, only 1 in 15 readings will
      // be fresh.  The setTimeout ensures this read goes to the back of the queue, once all other
      // computation is done.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      setTimeout(() => {
        if (this?.i2c) {
          this.i2c.readByte(AK8963Map.ST2);
        }
      }, 0);

      return [
        ((buffer.readInt16LE(0) * this.asax) - cal.offset.x) * cal.scale.x,
        ((buffer.readInt16LE(2) * this.asay) - cal.offset.y) * cal.scale.y,
        ((buffer.readInt16LE(4) * this.asaz) - cal.offset.z) * cal.scale.z
      ];
    } else {
      return [0, 0, 0];
    }
  }

  /**
   * @name getMagAttitudeAsync
   * @description Get the raw magnetometer values
   * @return {Promise<number[]>}
   */
  public async getMagAttitudeAsync() : Promise<number[]> {
    if (this.i2c) {
      // Get the actual data
      const buffer = await this.i2c.readBytesAsync(AK8963Map.XOUT_L, 6);
      const cal = this._config.magCalibration;

      if (!cal || !cal.offset || !cal.scale || !this.i2c) {
        return [0, 0, 0];
      }

      // For some reason when we read ST2 (Status 2) just after reading byte, this ensures the
      // next reading is fresh.  If we do it before without a pause, only 1 in 15 readings will
      // be fresh.  The setTimeout ensures this read goes to the back of the queue, once all other
      // computation is done.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      setTimeout(async () => {
        if (this?.i2c) {
          await this.i2c.readByteAsync(AK8963Map.ST2);
        }
      }, 0);

      return [
        ((buffer.readInt16LE(0) * this.asax) - cal.offset.x) * cal.scale.x,
        ((buffer.readInt16LE(2) * this.asay) - cal.offset.y) * cal.scale.y,
        ((buffer.readInt16LE(4) * this.asaz) - cal.offset.z) * cal.scale.z
      ];
    } else {
      return [0, 0, 0];
    }
  }

  /**
   * @name getCNTL
   * @return {byte | false}
   */
  public getCNTL() : number | false {
    if (this.i2c) {
      return this.i2c.readByte(AK8963Map.CNTL);
    }
    return false;
  }

  /**
   * @name getCNTLAsync
   * @return {Promise<byte | false>}
   */
  public getCNTLAsync() : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.readByteAsync(AK8963Map.CNTL);
    }
    return Promise.resolve(false);
  }

  /** Setter */

  /**
   * @name setCNTL
   * @description CNTL_MODE_OFF: 0x00 => Power-down mode
   * CNTL_MODE_SINGLE_MEASURE: 0x01 => Single measurement mode
   * CNTL_MODE_CONTINUE_MEASURE_1: 0x02 => Continuous measurement mode 1
   * CNTL_MODE_CONTINUE_MEASURE_2: 0x06 => Continuous measurement mode 2
   * CNTL_MODE_EXT_TRIG_MEASURE: 0x04 => External trigger measurement mode
   * CNTL_MODE_SELF_TEST_MODE: 0x08 => Self-test mode
   * CNTL_MODE_FUSE_ROM_ACCESS: 0x0F => Fuse ROM access mode
   * @param {number} mode
   * @return {number | false}
   */
  public setCNTL(mode : number) : number | false {
    if (this.i2c) {
      this.i2c.writeBytes(AK8963Map.CNTL, [mode]);
      return mode;
    }
    return false;
  }

  /**
   * @name setCNTLAsync
   * @description CNTL_MODE_OFF: 0x00 => Power-down mode
   * CNTL_MODE_SINGLE_MEASURE: 0x01 => Single measurement mode
   * CNTL_MODE_CONTINUE_MEASURE_1: 0x02 => Continuous measurement mode 1
   * CNTL_MODE_CONTINUE_MEASURE_2: 0x06 => Continuous measurement mode 2
   * CNTL_MODE_EXT_TRIG_MEASURE: 0x04 => External trigger measurement mode
   * CNTL_MODE_SELF_TEST_MODE: 0x08 => Self-test mode
   * CNTL_MODE_FUSE_ROM_ACCESS: 0x0F => Fuse ROM access mode
   * @param {number} mode
   * @return {Promise<number | false>}
   */
  public setCNTLAsync(mode : number) : Promise<number | false> {
    if (this.i2c) {
      return this.i2c.writeBytesAsync(AK8963Map.CNTL, [mode])
      .then(() => {
        return mode;
      });
    }
    return Promise.resolve(false);
  }
}