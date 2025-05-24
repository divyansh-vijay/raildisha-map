// // New file: d:\Current Project\RailDisha-map\utils\DeadReckoning.js
// import { KalmanFilter } from './KalmanFilter';

// export class DeadReckoning {
//     constructor(initialLat, initialLng) {
//         this.position = { lat: initialLat, lng: initialLng };
//         this.lastStep = Date.now();
//         this.headingFilter = new KalmanFilter();
//         this.accelerationFilter = new KalmanFilter();

//         // Initialize sensor calibration
//         this.calibrateOrientation = true;
//         this.orientationOffset = 0;
//         this.lastAccel = { x: 0, y: 0, z: 0 };
//     }

//     processMotion(acceleration, orientation) {
//         const now = Date.now();
//         const filteredAccel = this.accelerationFilter.filter(
//             Math.sqrt(
//                 acceleration.x ** 2 +
//                 acceleration.y ** 2 +
//                 acceleration.z ** 2
//             )
//         );

//         // Detect step using acceleration threshold
//         if (filteredAccel > DR_CONFIG.stepThreshold &&
//             (now - this.lastStep) > DR_CONFIG.timeThreshold) {

//             // Get filtered heading
//             const heading = this.headingFilter.filter(orientation.alpha) + this.orientationOffset;

//             // Calculate new position
//             const radians = (heading * Math.PI) / 180;
//             this.position = {
//                 lat: this.position.lat + (DR_CONFIG.stepLength * Math.cos(radians) / 111111),
//                 lng: this.position.lng + (DR_CONFIG.stepLength * Math.sin(radians) / (111111 * Math.cos(this.position.lat)))
//             };

//             this.lastStep = now;
//             return true;
//         }
//         return false;
//     }

//     calibrate(trueHeading) {
//         if (this.calibrateOrientation) {
//             this.orientationOffset = trueHeading;
//             this.calibrateOrientation = false;
//         }
//     }

//     getPosition() {
//         return [this.position.lat, this.position.lng];
//     }
// }