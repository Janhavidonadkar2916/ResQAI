import math
import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import IsolationForest
from app.schemas.sensor import SensorPacket


class VitalAnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.04,
            random_state=42
        )
        self._is_trained = False
        self._initialize_baseline_model()

    def _initialize_baseline_model(self):
        """Pre-trains Isolation Forest on standard resting physiological distributions."""
        np.random.seed(42)
        n_samples = 1500

        # Normal resting baseline distributions
        hr = np.random.normal(loc=72.0, scale=6.0, size=n_samples)
        hr = np.clip(hr, 55.0, 95.0)

        spo2 = np.random.normal(loc=98.2, scale=0.8, size=n_samples)
        spo2 = np.clip(spo2, 95.0, 100.0)

        temp = np.random.normal(loc=36.8, scale=0.2, size=n_samples)
        temp = np.clip(temp, 36.2, 37.4)

        accel_mag = np.random.normal(loc=1.0, scale=0.04, size=n_samples)
        accel_mag = np.clip(accel_mag, 0.90, 1.15)

        X_train = np.column_stack([hr, spo2, temp, accel_mag])
        self.model.fit(X_train)
        self._is_trained = True

    def evaluate_packet(self, packet: SensorPacket) -> Tuple[bool, float, Dict[str, float]]:
        """
        Evaluates a sensor observation frame with Isolation Forest and feature deviations.
        Returns: (is_anomaly, anomaly_score_0_to_1, feature_z_scores)
        """
        # Feature extraction
        hr = packet.heart_rate_bpm if packet.heart_rate_bpm is not None else 72.0
        spo2 = packet.spo2_percent if packet.spo2_percent is not None else 98.0
        temp = packet.temperature_c if packet.temperature_c is not None else 36.8
        
        ax = packet.accel_x or 0.0
        ay = packet.accel_y or 1.0
        az = packet.accel_z or 0.0
        accel_mag = math.sqrt(ax**2 + ay**2 + az**2)

        X = np.array([[hr, spo2, temp, accel_mag]])
        
        # Isolation Forest prediction: -1 = anomaly, 1 = normal
        pred = self.model.predict(X)[0]
        # raw decision score: lower values represent severe anomalies
        raw_score = self.model.decision_function(X)[0]

        # Normalize score into a 0.0 (perfectly normal) to 1.0 (extreme anomaly) range
        # Decision function ranges roughly from +0.25 (healthy center) to -0.35 (distant outlier)
        normalized_anomaly = float(np.clip((0.15 - raw_score) / 0.40, 0.0, 1.0))
        is_anomaly = bool(pred == -1 or normalized_anomaly > 0.65)

        # Statistical Z-score excursions from resting reference
        z_scores = {
            "heart_rate_z": round(float(abs(hr - 72.0) / 8.0), 2),
            "spo2_z": round(float(max(0.0, (98.0 - spo2) / 1.5)), 2),
            "temp_z": round(float(abs(temp - 36.8) / 0.3), 2),
            "accel_z": round(float(abs(accel_mag - 1.0) / 0.1), 2)
        }

        return is_anomaly, normalized_anomaly, z_scores


# Global singleton detector instance
anomaly_detector_instance = VitalAnomalyDetector()
