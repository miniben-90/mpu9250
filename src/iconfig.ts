/**
 * Interface for the configuration of MPU9250
 */
export interface IConfig {
  device: string,
  address?: number,
  UpMagneto?: boolean,
  DEBUG?: boolean,
  scaleValues?: boolean,
  ak_address?: number,
  GYRO_FS?: number,
  ACCEL_FS?: number,
  gyroBiasOffset?: IgyroOffset,
  accelCalibration?: IAccelCalibration,
  magCalibration? : IMagnetometerCalibration,
  SAMPLE_RATE? : number,
  DLPF_CFG? : number,
  A_DLPF_CFG? : number,
}

/**
 * Interface of offsets
 */
export interface IgyroOffset {
  x: number;
  y: number;
  z: number;
}

/**
 * Interface for helping the magnetometer calibration
 */
export interface IMagnetometerCalibration {
  offset: {
    x: number;
    y: number;
    z: number;
  },
  scale: {
    x: number;
    y: number;
    z: number;
  }
}

/**
 * Interface for helping the accel calibration
 */
export interface IAccelCalibration {
  offset: {
    x: number;
    y: number;
    z: number;
  },
  scale: {
    x: number[],
    y: number[],
    z: number[]
  }
}