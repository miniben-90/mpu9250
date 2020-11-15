export class KalmanFilter {
  public Q_angle = 0.001;
  public Q_bias = 0.003;
  public R_measure = 0.03;

  public angle = 0;
  public bias = 0;
  public rate = 0;

  public P = [[0, 0], [0, 0]];

  public S = 0;
  public K = [0, 0];
  public Y = 0;

  public getAngle(newAngle : number, newRate : number, dt : number) : number {

    this.rate = newRate - this.bias;
    this.angle += dt * this.rate;

    this.P[0][0] += dt * (dt * this.P[1][1] - this.P[0][1] - this.P[1][0] + this.Q_angle);
    this.P[0][1] -= dt * this.P[1][1];
    this.P[1][0] -= dt * this.P[1][1];
    this.P[1][1] += this.Q_bias * dt;

    this.S = this.P[0][0] + this.R_measure;

    this.K[0] = this.P[0][0] / this.S;
    this.K[1] = this.P[1][0] / this.S;

    this.Y = newAngle - this.angle;

    this.angle += this.K[0] * this.Y;
    this.bias += this.K[1] * this.Y;

    this.P[0][0] -= this.K[0] * this.P[0][0];
    this.P[0][1] -= this.K[0] * this.P[0][1];
    this.P[1][0] -= this.K[1] * this.P[0][0];
    this.P[1][1] -= this.K[1] * this.P[0][1];

    return this.angle;
  }

  public getRate() : number {
    return this.rate;
  }

  public getQangle() : number {
    return this.Q_angle;
  }

  public getQbias() : number {
    return this.Q_bias;
  }

  public getRmeasure() : number {
    return this.R_measure;
  }

  public setAngle(value : number) : void {
    this.angle = value;
  }
  public setQangle(value : number) : void {
    this.Q_angle = value;
  }
  public setQbias(value : number) : void {
    this.Q_bias = value;
  }
  public setRmeasure(value : number) : void {
    this.R_measure = value;
  }
}
