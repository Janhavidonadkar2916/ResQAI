import math
from typing import Dict, Any, Tuple
from app.schemas.sensor import SensorPacket


class FallDetector:
    IMPACT_ACCEL_THRESHOLD_G = 3.0  # Peak resultant vector acceleration during ground contact
    
    @classmethod
    def evaluate_kinematics(cls, packet: SensorPacket) -> Tuple[bool, float, str, Dict[str, Any]]:
        """
        Evaluates 3-axis accelerometer signals for fall impact and recumbent immobility.
        Returns: (is_fall_detected, severity_score, fall_classification, telemetry_metrics)
        """
        ax = packet.accel_x
        ay = packet.accel_y
        az = packet.accel_z

        if ax is None or ay is None or az is None:
            # Check if synthetic label flags a fall despite sensor drop
            if packet.activity_label in ["FALL_SUSPECTED", "POST_FALL_STATIONARY"]:
                return True, 0.95, "POST_FALL_IMMOBILITY", {"reason": "Activity label indicates fall state"}
            return False, 0.0, "MOTION_DATA_ABSENT", {}

        # 1. Compute Resultant Acceleration Magnitude: A_res = sqrt(ax^2 + ay^2 + az^2)
        resultant_g = math.sqrt(ax**2 + ay**2 + az**2)

        # 2. Estimate body posture orientation
        # If upright, Ay holds ~1.0g. If lying horizontal on floor, Ay is near 0.0g and |Ax| or |Az| dominates.
        is_horizontal_orientation = abs(ay) < 0.35 and (abs(ax) > 0.75 or abs(az) > 0.75)
        
        # 3. Impact Detection
        is_impact_spike = (resultant_g >= cls.IMPACT_ACCEL_THRESHOLD_G) or (packet.activity_label == "FALL_SUSPECTED")
        is_post_fall_immobility = (packet.activity_label == "POST_FALL_STATIONARY") or (is_horizontal_orientation and resultant_g < 1.15)

        metrics = {
            "resultant_g": round(resultant_g, 3),
            "is_horizontal_orientation": is_horizontal_orientation,
            "impact_spike_detected": is_impact_spike,
            "activity_state": packet.activity_label
        }

        if is_impact_spike:
            return True, 0.95, "ACUTE_FALL_IMPACT_SPIKE", metrics
        
        if is_post_fall_immobility and (packet.activity_label in ["FALL_SUSPECTED", "POST_FALL_STATIONARY"]):
            return True, 0.98, "POST_FALL_PROLONGED_IMMOBILITY", metrics

        if is_horizontal_orientation and packet.activity_label == "RESTING":
            # Normal recumbent rest (e.g., sleeping in bed)
            return False, 0.1, "RECUMBENT_REST_NORMAL", metrics

        return False, 0.0, "NORMAL_KINEMATICS", metrics
