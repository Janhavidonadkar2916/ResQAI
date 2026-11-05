from datetime import datetime, timezone
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.intelligence import RiskAssessment
from app.schemas.sensor import SensorPacket
from app.schemas.intelligence import RiskAssessmentResponse, RiskLevel
from app.services.ai_engine.rule_evaluator import RuleEvaluator
from app.services.ai_engine.fall_detector import FallDetector
from app.services.ai_engine.anomaly_detector import anomaly_detector_instance
from app.services.ai_engine.explainability import ExplainabilityEngine


class IntelligenceOrchestrator:
    @classmethod
    def evaluate_packet(
        cls, 
        packet: SensorPacket, 
        db: Optional[Session] = None,
        persist: bool = True
    ) -> RiskAssessmentResponse:
        # 1. Tier 1: Clinical Rule Evaluation
        rule_results = RuleEvaluator.evaluate(packet)
        critical_rules = [r for r in rule_results if r.status == "CRITICAL_TRIGGERED"]
        warning_rules = [r for r in rule_results if r.status == "WARNING"]

        # 2. Kinematic Fall Detection
        fall_detected, fall_severity, fall_class, fall_metrics = FallDetector.evaluate_kinematics(packet)

        # 3. Tier 2: Isolation Forest & Z-Score Anomaly Detection
        is_ml_anomaly, ml_score, z_scores = anomaly_detector_instance.evaluate_packet(packet)

        # 4. Composite Risk Score Synthesis (0.0 to 100.0)
        risk_score: float = 10.0
        risk_level: RiskLevel = "NORMAL"
        trigger_category: str = "NORMAL_BASELINE"

        if fall_detected:
            risk_score = 95.0 + (fall_severity * 4.0)
            risk_level = "CRITICAL"
            trigger_category = "FALL_SIGNATURE"
        elif len(critical_rules) > 0:
            max_rule_weight = max(r.severity_weight for r in critical_rules)
            risk_score = 80.0 + (max_rule_weight * 18.0)
            risk_level = "CRITICAL"
            trigger_category = "VITALS_OUT_OF_BOUNDS"
        elif len(warning_rules) > 0:
            risk_score = 50.0 + (len(warning_rules) * 10.0)
            risk_level = "ELEVATED"
            trigger_category = "VITALS_DRIFT"
        elif is_ml_anomaly:
            risk_score = 45.0 + (ml_score * 25.0)
            risk_level = "ELEVATED" if risk_score > 60 else "LOW"
            trigger_category = "MULTIVARIATE_ANOMALY"
        else:
            risk_score = 5.0 + (ml_score * 15.0)
            risk_level = "NORMAL"
            trigger_category = "NORMAL_BASELINE"

        risk_score = round(min(100.0, max(0.0, risk_score)), 1)

        # 5. Explainability Layer
        factors, narrative = ExplainabilityEngine.generate_factors_and_narrative(
            packet=packet,
            rule_results=rule_results,
            fall_detected=fall_detected,
            fall_class=fall_class,
            ml_score=ml_score,
            z_scores=z_scores
        )

        assessment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        response = RiskAssessmentResponse(
            id=assessment_id,
            patient_id=packet.patient_id,
            reading_id=packet.reading_id,
            assessed_at=now,
            combined_risk_score=risk_score,
            risk_level=risk_level,
            trigger_category=trigger_category,
            rule_evaluations=rule_results,
            ml_anomaly_score=round(ml_score, 3),
            explainability_factors=factors,
            summary_narrative=narrative,
            model_version="ResQCare-Hybrid-v1.0"
        )

        # 6. Database Persistence
        if persist and db:
            db_record = RiskAssessment(
                id=assessment_id,
                patient_id=packet.patient_id,
                reading_id=packet.reading_id,
                assessed_at=now,
                combined_risk_score=risk_score,
                risk_level=risk_level,
                trigger_category=trigger_category,
                rule_evaluations=[r.model_dump() for r in rule_results],
                ml_anomaly_score=round(ml_score, 3),
                explainability_factors=[f.model_dump() for f in factors],
                summary_narrative=narrative
            )
            db.add(db_record)
            db.commit()

            # Phase 4 Hook: Auto-trigger Emergency Workflow if Critical
            try:
                from app.services.emergency_service import EmergencyService
                EmergencyService.auto_trigger_from_ai(db, packet, response)
            except Exception as e:
                # Log but do not block AI scoring
                pass

        return response

