// New file: d:\Current Project\RailDisha-map\utils\KalmanFilter.js
export class KalmanFilter {
    constructor() {
        this.Q = 0.1; // process noise
        this.R = 1.0; // measurement noise
        this.P = 1.0; // estimation error
        this.X = 0.0; // initial value
        this.K = 0.0; // kalman gain
    }

    filter(measurement) {
        // Prediction
        this.P = this.P + this.Q;

        // Update
        this.K = this.P / (this.P + this.R);
        this.X = this.X + this.K * (measurement - this.X);
        this.P = (1 - this.K) * this.P;

        return this.X;
    }
}