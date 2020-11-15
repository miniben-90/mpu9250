/* eslint-disable @typescript-eslint/no-explicit-any */
import i2c from '@abandonware/i2c';

/**
 * Read/Write service for I2CBus
 */
export class I2cService extends i2c {

  constructor(address : number, options : { device : string; debug? : boolean }) {
    super(address, options);
  }

  /**
   * @name writeBytes
   * @param {number} adrs
   * @param {number[] | Buffer | any} Buffer
   * @param {Function} callback
   */
  public writeBytes(adrs : number, buffer : number[] | Buffer | any, callback? : (...args : any) => void) : void {
    callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    super.writeBytes(adrs, buffer, callback);
  }

  /**
   * @name writeBytesAsync
   * @param {number} adrs
   * @param {number[] | Buffer | any} Buffer
   */
  public writeBytesAsync(adrs : number, buffer : number[] | Buffer | any) : Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeBytes(adrs, buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * @name readBytes
   * @param {number} adrs
   * @param {number} length
   * @param {Function} callback
   */
  public readBytes(adrs : number, length : number, callback? : (...args : any) => void) : Buffer {
    callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    return super.readBytes(adrs, length, callback);
  }

  /**
   * @name readBytesAsync
   * @param {number} adrs
   * @param {number} length
   */
  public readBytesAsync(adrs : number, length : number) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffer = this.readBytes(adrs, length, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
   * @name bitMask
   * @param {number} bit The address of the byte to read.
   * @param {number} length (Optional) callback
   * @return {number}
   */
  public bitMask(bit : number, length : number) : number {
    return ((1 << length) - 1) << bit;
  }
  
  /**
   * @name readByte
   * @param {number} adrs The address of the byte to read.
   * @param {Function} callback (Optional) callback
   * @return {number}
   */
  public readByte(adrs : number, callback? : (...args : any) => void) : number {
    callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    const buf = this.readBytes(adrs, 1, callback);
    return buf[0];
  }

  /**
   * @name readByteAsync
   * @param {number} adrs The address of the byte to read.
   * @return {number}
   */
  public readByteAsync(adrs : number) : Promise<number> {
    return new Promise((resolve, reject) => {
      const byte = this.readByte(adrs, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(byte);
        }
      });
    });
  }
  
  /**
   * @name readBit
   * @description Return the bit value, 1 or 0.
   * @param {number} adrs The address of the byte to read.
   * @param {number} bit The nth bit.
   * @param {Function} callback (Optional) callback
   * @return {number}
   */
  public readBit(adrs : number, bit : number, callback? : (...args : any) => void) : number {
    callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    const buf = this.readByte(adrs, callback);
    return (buf >> bit) & 1;
  }
  
  /**
   * @name readBitAsync
   * @description Return the bit value, 1 or 0.
   * @param {number} adrs The address of the byte to read.
   * @param {number} bit The nth bit.
   * @return {Promise<number>}
   */
  public readBitAsync(adrs : number, bit : number) : Promise<number> {
    return new Promise((resolve, reject) => {
      const _bit = this.readBit(adrs, bit, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(_bit);
        }
      });
    });
  }
  
  /**
   * @name writeBits
   * @description Write a sequence of bits.  Note, this will do a read to get the existing value, then a write.
   * @param {number} adrs The address of the byte to write.
   * @param {number} bit The nth bit to start at.
   * @param {number} length The number of bits to change.
   * @param {number} value The values to change.
   * @param {Function} callback
   */
  public writeBits(adrs : number, bit : number, length : number, value : number, callback? : (...args : any) => void) : void {
    callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    const oldValue = this.readByte(adrs, () => { /** no action */ });
    const mask = this.bitMask(bit, length);
    const newValue = oldValue ^ ((oldValue ^ (value << bit)) & mask);
    this.writeBytes(adrs, [ newValue ], callback);
  }

  /** Async method */
  
  /**
   * @name writeBitsAsync
   * @description Write a sequence of bits.  Note, this will do a read to get the existing value, then a write.
   * @param {number} adrs The address of the byte to write.
   * @param {number} bit The nth bit to start at.
   * @param {number} length The number of bits to change.
   */
  public writeBitsAsync(adrs : number, bit : number, length : number, value : number) : Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeBits(adrs, bit, length, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * @name writeBit
   * @description Write one bit. Note, this will do a read to get the existing value, then a write.
   * @param {number} adrs The address of the byte to write.
   * @param {number} bit The nth bit.
   * @param {number} The new value, 1 or 0.
   * @param {Function} callback
   */
  public writeBit(adrs : number, bit : number, value : number, callback? : (...args : any) => void) : void {
    callback = callback = (callback instanceof Function) ? callback : function () { /** no action */ };
    this.writeBits(adrs, bit, 1, value, callback);
  }

  /** Async method */

  /**
   * @name writeBitAsync
   * @description Write one bit. Note, this will do a read to get the existing value, then a write.
   * @param {number} adrs The address of the byte to write.
   * @param {number} bit The nth bit.
   * @param {number} value The new value, 1 or 0.
   */
  public writeBitAsync(adrs : number, bit : number, value : 0 | 1) : Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeBit(adrs, bit, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

}
