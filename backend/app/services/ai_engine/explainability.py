from typing import List, Dict, Any, Tuple
from app.schemas.sensor import SensorPacket
from app.schemas.intelligence import ExplainabilityFactor, RuleResult


class ExplainabilityEngine:
    @staticmethod
    def generate_factors_and_narrative(
        packet: SensorPacket,
        rule_results: List[RuleResult],
        fall_detected: bool,
        fall_class: str,
        ml_score: float,
        z_scores: Dict[str, float]
    ) -> Tuple[List[ExplainabilityFactor], str]:
        factors: List[ExplainabilityFactor] = []

        # 1. Feature contribution weights
        # Base raw weights computed from deviation severity
        w_spo2 = z_scores.get("spo2_z", 0.0) * 1.5
        w_hr = z_scores.get("heart_rate_z", 0.0) * 1.0
        w_temp = z_scores.get("temp_z", 0.0) * 0.8
        w_fall = 4.0 if fall_detected else (z_scores.get("accel_z", 0.0) * 0.5)
        w_signal = 2.0 if packet.signal_quality in ["DEGRADED", "DISCONNECTED"] else 0.0

        total_weight = w_spo2 + w_hr + w_temp + w_fall + w_signal
        if total_weight <= 0.001:
            total_weight = 1.0

        pct_spo2 = round((w_spo2 / total_weight) * 100.0, 1)
        pct_hr = round((w_hr / total_weight) * 100.0, 1)
        pct_temp = round((w_temp / total_weight) * 100.0, 1)
        pct_fall = round((w_fall / total_weight) * 100.0, 1)
        pct_signal = round((w_signal / total_weight) * 100.0, 1)

        # Build factors
        # SpO2 Factor
        spo2_dir = "NORMAL"
        if packet.spo2_percent is not None:
            if packet.spo2_percent < 92.0:
                spo2_dir = "DEPRESSED"
            elif packet.spo2_percent < 95.0:
                spo2_dir = "DEPRESSED"
        else:
            spo2_dir = "DISCONNECTED"

        factors.append(ExplainabilityFactor(
            feature="spo2",
            feature_name="Oxygen Saturation (SpO2)",
            observed_value=packet.spo2_percent,
            baseline_value=98.0,
            contribution_percent=pct_spo2,
            direction=spo2_dir,
            clinical_rationale=(
                f"SpO2 is {packet.spo2_percent}%, falling below optimal reference threshold (95%)."
                if packet.spo2_percent and packet.spo2_percent < 95.0
                else "Oxygenation is stable within normal limits."
            )
        ))

        # Heart Rate Factor
        hr_dir = "NORMAL"
        if packet.heart_rate_bpm is not None:
            if packet.heart_rate_bpm > 100.0:
                hr_dir = "ELEVATED"
            elif packet.heart_rate_bpm < 60.0:
                hr_dir = "DEPRESSED"
        else:
            hr_dir = "DISCONNECTED"

        factors.append(ExplainabilityFactor(
            feature="heart_rate",
            feature_name="Heart Rate",
            observed_value=packet.heart_rate_bpm,
            baseline_value=72.0,
            contribution_percent=pct_hr,
            direction=hr_dir,
            clinical_rationale=(
                f"Heart rate is {packet.heart_rate_bpm} BPM ({hr_dir.lower()})."
                if packet.heart_rate_bpm and (packet.heart_rate_bpm > 100 or packet.heart_rate_bpm < 60)
                else "Heart rate is normocardic."
            )
        ))

        # Fall / Kinematics Factor
        factors.append(ExplainabilityFactor(
            feature="kinematics",
            feature_name="Motion & Fall Kinematics",
            observed_value=packet.accel_y,
            baseline_value=1.0,
            contribution_percent=pct_fall,
            direction="ELEVATED" if fall_detected else "NORMAL",
            clinical_rationale=(
                f"Accelerometer signature indicates {fall_class}."
                if fall_detected
                else "Normal gravitational orientation and voluntary movement detected."
            )
        ))

        # Temperature Factor
        factors.append(ExplainabilityFactor(
            feature="temperature",
            feature_name="Body Temperature",
            observed_value=packet.temperature_c,
            baseline_value=36.8,
            contribution_percent=pct_temp,
            direction="ELEVATED" if packet.temperature_c and packet.temperature_c > 37.8 else "NORMAL",
            clinical_rationale=(
                f"Temperature is {packet.temperature_c} °C."
                if packet.temperature_c and packet.temperature_c > 37.8
                else "Body temperature is normothermic."
            )
        ))

        # 2. Formulate Caregiver Narrative
        narrative_parts = []
        if fall_detected:
            narrative_parts.append(
                f"CRITICAL FALL DETECTED: Kinematic impact spike ({fall_class}) accounts for {pct_fall}% of risk elevation."
            )
        
        triggered_rules = [r for r in rule_results if r.status in ["WARNING", "CRITICAL_TRIGGERED"]]
        if triggered_rules:
            rule_msgs = [r.message for r in triggered_rules]
            narrative_parts.append(f"Physiological alerts: {'; '.join(rule_msgs)}")
        elif not fall_detected and ml_score > 0.6:
            narrative_parts.append(
                f"Multivariate drift: Vital sign cross-correlation shows subtle anomaly deviation (ML Score: {round(ml_score, 2)})."
            )
        elif not fall_detected:
            narrative_parts.append("Normal hemodynamic baseline: All physiological parameters within safe expected parameters.")

        narrative = " ".join(narrative_parts)
        return factors, narrative

