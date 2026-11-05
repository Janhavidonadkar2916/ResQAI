import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.schemas.sensor import SensorPacket
from app.services.ai_engine.rule_evaluator import RuleEvaluator
from app.services.ai_engine.fall_detector import FallDetector
from app.services.ai_engine.anomaly_detector import anomaly_detector_instance
from app.services.ai_engine.orchestrator import IntelligenceOrchestrator

def make_sample_packet(**kwargs):
    defaults = {
        "schema_version": "1.0",
        "reading_id": str(uuid.uuid4()),
        "patient_id": str(uuid.uuid4()),
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc),
        "received_at": datetime.now(timezone.utc),
        "heart_rate_bpm": 72.0,
        "spo2_percent": 98.0,
        "temperature_c": 36.8,
        "accel_x": 0.02,
        "accel_y": 0.98,
        "accel_z": 0.05,
        "activity_label": "RESTING",
        "signal_quality": "OPTIMAL",
        "data_quality_status": "VALID"
    }
    defaults.update(kwargs)
    return SensorPacket(**defaults)

def test_rule_evaluator_clinical_thresholds():
    # Test Normal
    normal_pkt = make_sample_packet(heart_rate_bpm=72.0, spo2_percent=98.0, temperature_c=36.8)
    rules = RuleEvaluator.evaluate(normal_pkt)
    criticals = [r for r in rules if r.status == "CRITICAL_TRIGGERED"]
    assert len(criticals) == 0

    # Test Acute Tachycardia
    tachy_pkt = make_sample_packet(heart_rate_bpm=145.0)
    rules_tachy = RuleEvaluator.evaluate(tachy_pkt)
    rule_ids = [r.rule_id for r in rules_tachy if r.status == "CRITICAL_TRIGGERED"]
    assert "RULE_HR_TACHYCARDIA_CRITICAL" in rule_ids

    # Test Severe Hypoxia
    hypo_pkt = make_sample_packet(spo2_percent=85.0)
    rules_hypo = RuleEvaluator.evaluate(hypo_pkt)
    hypo_ids = [r.rule_id for r in rules_hypo if r.status == "CRITICAL_TRIGGERED"]
    assert "RULE_SPO2_HYPOXIA_CRITICAL" in hypo_ids

    # Test Critical Bradycardia
    brady_pkt = make_sample_packet(heart_rate_bpm=42.0)
    rules_brady = RuleEvaluator.evaluate(brady_pkt)
    brady_ids = [r.rule_id for r in rules_brady if r.status == "CRITICAL_TRIGGERED"]
    assert "RULE_HR_BRADYCARDIA_CRITICAL" in brady_ids

def test_fall_detector_kinematics():
    # High-g impact spike
    impact_pkt = make_sample_packet(
        accel_x=2.2, accel_y=3.5, accel_z=1.8,
        activity_label="FALL_SUSPECTED"
    )
    detected, severity, f_class, metrics = FallDetector.evaluate_kinematics(impact_pkt)
    assert detected is True
    assert severity >= 0.9
    assert f_class == "ACUTE_FALL_IMPACT_SPIKE"

    # Post-fall immobility (horizontal on ground)
    still_pkt = make_sample_packet(
        accel_x=0.96, accel_y=0.08, accel_z=0.04,
        activity_label="POST_FALL_STATIONARY"
    )
    detected, severity, f_class, metrics = FallDetector.evaluate_kinematics(still_pkt)
    assert detected is True
    assert f_class == "POST_FALL_PROLONGED_IMMOBILITY"

    # Normal upright posture
    upright_pkt = make_sample_packet(accel_x=0.02, accel_y=0.99, accel_z=0.04, activity_label="RESTING")
    detected, severity, f_class, metrics = FallDetector.evaluate_kinematics(upright_pkt)
    assert detected is False

def test_isolation_forest_anomaly_detection():
    # Normal frame
    normal_pkt = make_sample_packet()
    is_anomaly, score, z_scores = anomaly_detector_instance.evaluate_packet(normal_pkt)
    assert score < 0.6

    # Extreme multi-vital anomaly (155 bpm, 84% SpO2, 39.2°C)
    extreme_pkt = make_sample_packet(
        heart_rate_bpm=155.0,
        spo2_percent=84.0,
        temperature_c=39.2
    )
    is_anomaly, score, z_scores = anomaly_detector_instance.evaluate_packet(extreme_pkt)
    assert is_anomaly is True
    assert score > 0.65

def test_orchestrator_and_api(client: TestClient):
    # Fetch demo patient
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    # Ingest a severe hypoxia reading
    severe_pkt = {
        "schema_version": "1.0",
        "reading_id": str(uuid.uuid4()),
        "patient_id": pid,
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "heart_rate_bpm": 128.0,
        "spo2_percent": 86.0,
        "temperature_c": 37.1,
        "activity_label": "RESTING",
        "signal_quality": "OPTIMAL",
        "data_quality_status": "VALID"
    }
    client.post("/api/v1/sensors/ingest", json=severe_pkt)

    # Call AI latest assessment endpoint
    res = client.get(f"/api/v1/intelligence/patients/{pid}/latest-assessment")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "CRITICAL"
    assert data["combined_risk_score"] > 80.0
    assert len(data["explainability_factors"]) > 0
    assert "hypoxia" in data["summary_narrative"].lower() or "oxygen" in data["summary_narrative"].lower()

    # Call Monitoring Summary endpoint
    summary_res = client.get(f"/api/v1/monitoring/patients/{pid}/summary?hours=24")
    assert summary_res.status_code == 200
    s_data = summary_res.json()
    assert s_data["patient_id"] == pid
    assert "heart_rate_stats" in s_data
    assert "spo2_stats" in s_data
    assert len(s_data["recommendations"]) > 0
