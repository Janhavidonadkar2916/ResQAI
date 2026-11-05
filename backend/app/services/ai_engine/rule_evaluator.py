from typing import List, Tuple
from app.schemas.sensor import SensorPacket
from app.schemas.intelligence import RuleResult


class RuleEvaluator:
    @staticmethod
    def evaluate(packet: SensorPacket) -> List[RuleResult]:
        results: List[RuleResult] = []

        # 1. Heart Rate Evaluation
        hr = packet.heart_rate_bpm
        if hr is not None:
            if hr > 130.0:
                results.append(RuleResult(
                    rule_id="RULE_HR_TACHYCARDIA_CRITICAL",
                    rule_name="Critical Tachycardia",
                    status="CRITICAL_TRIGGERED",
                    observed_value=hr,
                    threshold="> 130.0 BPM",
                    severity_weight=0.9,
                    message=f"Acute heart rate surge to {hr} BPM observed at rest."
                ))
            elif hr > 100.0:
                results.append(RuleResult(
                    rule_id="RULE_HR_TACHYCARDIA_MODERATE",
                    rule_name="Elevated Heart Rate",
                    status="WARNING",
                    observed_value=hr,
                    threshold="> 100.0 BPM",
                    severity_weight=0.4,
                    message=f"Heart rate {hr} BPM is above normal resting baseline."
                ))
            elif hr < 45.0:
                results.append(RuleResult(
                    rule_id="RULE_HR_BRADYCARDIA_CRITICAL",
                    rule_name="Critical Bradycardia",
                    status="CRITICAL_TRIGGERED",
                    observed_value=hr,
                    threshold="< 45.0 BPM",
                    severity_weight=0.95,
                    message=f"Dangerous drop in heart rate to {hr} BPM; hemodynamically compromised."
                ))
            elif hr < 55.0:
                results.append(RuleResult(
                    rule_id="RULE_HR_BRADYCARDIA_MODERATE",
                    rule_name="Low Heart Rate",
                    status="WARNING",
                    observed_value=hr,
                    threshold="< 55.0 BPM",
                    severity_weight=0.4,
                    message=f"Heart rate {hr} BPM is depressed below typical resting baseline."
                ))
            else:
                results.append(RuleResult(
                    rule_id="RULE_HR_NORMAL",
                    rule_name="Heart Rate Norm",
                    status="PASSED",
                    observed_value=hr,
                    threshold="60.0 - 100.0 BPM",
                    severity_weight=0.0,
                    message=f"Heart rate {hr} BPM is within standard sinus rhythm limits."
                ))
        else:
            results.append(RuleResult(
                rule_id="RULE_HR_MISSING",
                rule_name="Heart Rate Signal Unavailable",
                status="WARNING",
                observed_value=None,
                threshold="Valid Reading Required",
                severity_weight=0.5,
                message="Heart rate sensor reading is null or disconnected."
            ))

        # 2. SpO2 Oxygenation Evaluation
        spo2 = packet.spo2_percent
        if spo2 is not None:
            if spo2 < 88.0:
                results.append(RuleResult(
                    rule_id="RULE_SPO2_HYPOXIA_CRITICAL",
                    rule_name="Severe Cyanotic Hypoxia",
                    status="CRITICAL_TRIGGERED",
                    observed_value=spo2,
                    threshold="< 88.0%",
                    severity_weight=1.0,
                    message=f"Critical peripheral oxygen desaturation ({spo2}%); acute respiratory compromise."
                ))
            elif spo2 < 92.0:
                results.append(RuleResult(
                    rule_id="RULE_SPO2_HYPOXIA_MODERATE",
                    rule_name="Moderate Hypoxemia",
                    status="CRITICAL_TRIGGERED",
                    observed_value=spo2,
                    threshold="< 92.0%",
                    severity_weight=0.75,
                    message=f"SpO2 {spo2}% indicates significant respiratory distress."
                ))
            elif spo2 < 95.0:
                results.append(RuleResult(
                    rule_id="RULE_SPO2_HYPOXIA_MILD",
                    rule_name="Sub-optimal Oxygenation",
                    status="WARNING",
                    observed_value=spo2,
                    threshold="< 95.0%",
                    severity_weight=0.35,
                    message=f"SpO2 {spo2}% is slightly below optimal baseline."
                ))
            else:
                results.append(RuleResult(
                    rule_id="RULE_SPO2_NORMAL",
                    rule_name="Oxygenation Norm",
                    status="PASSED",
                    observed_value=spo2,
                    threshold=">= 95.0%",
                    severity_weight=0.0,
                    message=f"Oxygen saturation {spo2}% is clinically adequate."
                ))
        else:
            results.append(RuleResult(
                rule_id="RULE_SPO2_MISSING",
                rule_name="SpO2 Signal Unavailable",
                status="WARNING",
                observed_value=None,
                threshold="Valid Reading Required",
                severity_weight=0.5,
                message="Pulse oximeter reading is null or degraded."
            ))

        # 3. Body Temperature Evaluation
        temp = packet.temperature_c
        if temp is not None:
            if temp > 39.0:
                results.append(RuleResult(
                    rule_id="RULE_TEMP_FEVER_HIGH",
                    rule_name="Severe Hyperthermia / High Pyrexia",
                    status="CRITICAL_TRIGGERED",
                    observed_value=temp,
                    threshold="> 39.0 °C",
                    severity_weight=0.8,
                    message=f"High fever temperature of {temp} °C observed."
                ))
            elif temp > 37.8:
                results.append(RuleResult(
                    rule_id="RULE_TEMP_FEVER_MILD",
                    rule_name="Elevated Body Temperature",
                    status="WARNING",
                    observed_value=temp,
                    threshold="> 37.8 °C",
                    severity_weight=0.35,
                    message=f"Temperature {temp} °C reflects low-grade pyrexia."
                ))
            elif temp < 35.0:
                results.append(RuleResult(
                    rule_id="RULE_TEMP_HYPOTHERMIA",
                    rule_name="Hypothermia Alert",
                    status="CRITICAL_TRIGGERED",
                    observed_value=temp,
                    threshold="< 35.0 °C",
                    severity_weight=0.85,
                    message=f"Body temperature {temp} °C below hypothermic threshold."
                ))
            else:
                results.append(RuleResult(
                    rule_id="RULE_TEMP_NORMAL",
                    rule_name="Temperature Norm",
                    status="PASSED",
                    observed_value=temp,
                    threshold="36.0 - 37.5 °C",
                    severity_weight=0.0,
                    message=f"Body temperature {temp} °C is normothermic."
                ))

        # 4. Sensor Signal Integrity Evaluation
        if packet.signal_quality in ["DEGRADED", "DISCONNECTED"] or packet.data_quality_status == "MISSING_SENSORS":
            results.append(RuleResult(
                rule_id="RULE_SIGNAL_INTEGRITY_COMPROMISED",
                rule_name="Sensor Signal Loss",
                status="WARNING",
                observed_value=None,
                threshold="OPTIMAL / ACCEPTABLE Quality",
                severity_weight=0.45,
                message=f"Signal quality is {packet.signal_quality}; vitals may be intermittent."
            ))

        return results

