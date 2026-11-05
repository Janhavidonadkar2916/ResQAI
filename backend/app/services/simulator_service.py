import asyncio
import math
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.schemas.sensor import SensorPacket
from app.schemas.simulator import ScenarioName, SimulatorConfig, SimulatorStatus, SimulatorScenarioInfo


AVAILABLE_SCENARIOS: List[SimulatorScenarioInfo] = [
    SimulatorScenarioInfo(
        name="NORMAL_RESTING",
        display_title="Normal Resting Baseline",
        description="Stable hemodynamic vitals with small natural respiratory sinus fluctuations and resting accelerometer.",
        target_vitals="HR: 68-76 bpm | SpO2: 97-99% | Temp: 36.6-37.1 °C",
        risk_profile="NORMAL"
    ),
    SimulatorScenarioInfo(
        name="ACTIVE_EXERCISE",
        display_title="Active Physical Exercise",
        description="Elevated heart rate due to cardiovascular exertion with cyclical gait oscillations on accelerometer.",
        target_vitals="HR: 110-135 bpm | SpO2: 96-98% | Temp: 37.2-37.7 °C",
        risk_profile="NORMAL (Exertional)"
    ),
    SimulatorScenarioInfo(
        name="TACHYCARDIA_EPISODE",
        display_title="Acute Paroxysmal Tachycardia",
        description="Sudden surge in heart rate exceeding clinical safety thresholds at rest without motion.",
        target_vitals="HR: 140-165 bpm | SpO2: 95-97% | Temp: 36.8 °C",
        risk_profile="ELEVATED / URGENT"
    ),
    SimulatorScenarioInfo(
        name="BRADYCARDIA_EPISODE",
        display_title="Symptomatic Bradycardia",
        description="Critical drop in heart rate below hemodynamic stability threshold (< 45 bpm).",
        target_vitals="HR: 38-44 bpm | SpO2: 93-96% | Temp: 36.4 °C",
        risk_profile="CRITICAL"
    ),
    SimulatorScenarioInfo(
        name="RESPIRATORY_DISTRESS",
        display_title="Hypoxemia & Respiratory Distress",
        description="Desaturation of peripheral oxygen saturation coupled with compensatory tachycardic response.",
        target_vitals="HR: 118-132 bpm | SpO2: 83-89% | Temp: 38.3 °C (Febrile)",
        risk_profile="CRITICAL"
    ),
    SimulatorScenarioInfo(
        name="FALL_IMPACT_AND_IMMOBILITY",
        display_title="Fall Impact Signature & Post-Fall Immobility",
        description="Sharp 3-axis acceleration vector spike (> 3.5g impact) followed by zero movement.",
        target_vitals="HR: 110-128 bpm (Stress) | Impact Spike | Stationary",
        risk_profile="CRITICAL EMERGENCY"
    ),
    SimulatorScenarioInfo(
        name="SENSOR_DISCONNECT_DROPOUT",
        display_title="Electrode Disconnect & Degraded Signal",
        description="Simulates physical sensor detachment, intermittent telemetry dropouts, and null vital readings.",
        target_vitals="HR: None | SpO2: None | Signal: DISCONNECTED",
        risk_profile="TECHNICAL WARNING"
    ),
]


class PatientSimulatorState:
    def __init__(self, patient_id: str, config: SimulatorConfig):
        self.patient_id = patient_id
        self.config = config
        self.is_running = False
        self.packet_count = 0
        self.last_packet: Optional[SensorPacket] = None
        self.step = 0
        self.task: Optional[asyncio.Task] = None
        self.fall_phase = 0  # 0: normal, 1: impact spike, 2: post-fall stillness


class VirtualSensorEngine:
    def __init__(self):
        self.simulators: Dict[str, PatientSimulatorState] = {}

    def get_or_create(self, patient_id: str, scenario: ScenarioName = "NORMAL_RESTING") -> PatientSimulatorState:
        if patient_id not in self.simulators:
            config = SimulatorConfig(patient_id=patient_id, scenario=scenario)
            self.simulators[patient_id] = PatientSimulatorState(patient_id, config)
        return self.simulators[patient_id]

    def set_scenario(self, patient_id: str, scenario: ScenarioName, tick_rate_ms: int = 1000) -> SimulatorStatus:
        state = self.get_or_create(patient_id, scenario)
        state.config.scenario = scenario
        state.config.tick_rate_ms = tick_rate_ms
        state.fall_phase = 0
        return self.get_status(patient_id)

    def generate_packet(
        self, 
        patient_id: str, 
        scenario_override: Optional[ScenarioName] = None,
        timestamp_override: Optional[datetime] = None
    ) -> SensorPacket:
        state = self.get_or_create(patient_id)
        scenario = scenario_override or state.config.scenario
        state.step += 1
        t = state.step * (state.config.tick_rate_ms / 1000.0)
        noise = random.gauss(0, state.config.noise_std)

        now = timestamp_override or datetime.now(timezone.utc)
        reading_id = str(uuid.uuid4())

        # Physiological synthesis based on active scenario
        if scenario == "NORMAL_RESTING":
            # Sinus rhythm baseline: 72 bpm with 0.15 Hz respiratory sinus arrhythmia
            hr = 72.0 + 3.0 * math.sin(2 * math.pi * 0.15 * t) + noise * 1.5
            spo2 = min(100.0, max(95.0, 98.4 + 0.3 * math.cos(0.08 * t) + noise * 0.2))
            temp = 36.8 + 0.05 * math.sin(0.01 * t) + noise * 0.02
            # Accelerometer resting in vertical gravity orientation (accel_y ≈ 1.0g)
            ax = 0.02 + noise * 0.01
            ay = 0.98 + noise * 0.01
            az = 0.06 + noise * 0.01
            activity = "RESTING"
            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        elif scenario == "ACTIVE_EXERCISE":
            # Ramping exertion up to 132 bpm
            target_hr = 126.0 + 5.0 * math.sin(2 * math.pi * 0.05 * t) + noise * 2.0
            hr = max(90.0, target_hr)
            spo2 = min(99.0, max(95.0, 97.2 + noise * 0.3))
            temp = 37.4 + 0.1 * math.sin(0.02 * t) + noise * 0.03
            # Cyclical gait motion on accelerometer (~1.8 Hz step frequency)
            ax = 0.25 * math.sin(2 * math.pi * 1.8 * t) + noise * 0.05
            ay = 1.0 + 0.45 * math.cos(2 * math.pi * 1.8 * t) + noise * 0.05
            az = 0.20 * math.sin(2 * math.pi * 0.9 * t) + noise * 0.05
            activity = "WALKING"
            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        elif scenario == "TACHYCARDIA_EPISODE":
            # Acute sudden tachycardia > 145 bpm at rest
            hr = 148.0 + 6.0 * math.sin(2 * math.pi * 0.2 * t) + noise * 2.5
            spo2 = min(98.0, max(93.0, 95.8 + noise * 0.4))
            temp = 36.9 + noise * 0.02
            ax = 0.04 + noise * 0.02
            ay = 0.96 + noise * 0.02
            az = 0.08 + noise * 0.02
            activity = "RESTING"
            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        elif scenario == "BRADYCARDIA_EPISODE":
            # Hemodynamic drop < 44 bpm
            hr = 41.0 + 2.0 * math.sin(2 * math.pi * 0.05 * t) + noise * 1.0
            spo2 = min(96.0, max(90.0, 93.5 + noise * 0.5))
            temp = 36.3 + noise * 0.02
            ax = 0.01 + noise * 0.01
            ay = 0.97 + noise * 0.01
            az = 0.04 + noise * 0.01
            activity = "RESTING"
            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        elif scenario == "RESPIRATORY_DISTRESS":
            # Hypoxemia with SpO2 dropping to 85% and tachycardia compensation
            decay_factor = min(1.0, state.step / 10.0)
            spo2 = max(82.0, 96.0 - (11.0 * decay_factor) + noise * 0.5)
            hr = 88.0 + (35.0 * decay_factor) + noise * 2.0
            temp = 38.4 + noise * 0.05  # Febrile
            ax = 0.05 + noise * 0.02
            ay = 0.94 + noise * 0.02
            az = 0.10 + noise * 0.02
            activity = "RESTING"
            sig_qual = "ACCEPTABLE"
            data_qual = "VALID"

        elif scenario == "FALL_IMPACT_AND_IMMOBILITY":
            # Simulates 3 phases: pre-fall motion, sudden impact spike, post-fall immobility
            phase_step = state.step % 20
            if phase_step < 3:
                # Pre-fall stumbling
                hr = 82.0 + noise * 2.0
                spo2 = 97.0
                temp = 36.7
                ax = 0.4 * math.sin(t * 3.0)
                ay = 0.9 + 0.3 * math.cos(t * 3.0)
                az = 0.2
                activity = "TRANSITION"
            elif phase_step == 3:
                # IMPACT SPIKE: High-g peak (|a| > 3.8g)
                hr = 105.0
                spo2 = 96.5
                temp = 36.7
                ax = 2.45 + noise * 0.2
                ay = 3.80 + noise * 0.3
                az = 1.90 + noise * 0.2
                activity = "FALL_SUSPECTED"
            else:
                # POST-FALL IMMOBILITY: Patient lying down horizontally on ground
                hr = 118.0 + noise * 1.5  # Elevated panic/stress HR
                spo2 = 95.8
                temp = 36.6
                # Horizontal posture: gravity aligns on X or Z instead of Y, zero fluctuation
                ax = 0.95 + noise * 0.005
                ay = 0.08 + noise * 0.005
                az = 0.05 + noise * 0.005
                activity = "POST_FALL_STATIONARY"

            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        elif scenario == "SENSOR_DISCONNECT_DROPOUT":
            # Disconnected electrode: vitals are None, signal degraded
            hr = None
            spo2 = None
            temp = None
            ax = None
            ay = None
            az = None
            activity = "UNKNOWN"
            sig_qual = "DISCONNECTED"
            data_qual = "MISSING_SENSORS"

        else:
            # Fallback normal
            hr = 72.0
            spo2 = 98.0
            temp = 36.8
            ax, ay, az = 0.0, 1.0, 0.0
            activity = "RESTING"
            sig_qual = "OPTIMAL"
            data_qual = "VALID"

        # Construct packet strictly adhering to Contract v1.0
        packet = SensorPacket(
            schema_version="1.0",
            reading_id=reading_id,
            patient_id=patient_id,
            device_id=f"SIM-{patient_id[:8].upper()}",
            source_type="VIRTUAL_SIMULATOR",
            recorded_at=now,
            received_at=now,
            heart_rate_bpm=round(hr, 1) if hr is not None else None,
            spo2_percent=round(spo2, 1) if spo2 is not None else None,
            temperature_c=round(temp, 2) if temp is not None else None,
            accel_x=round(ax, 3) if ax is not None else None,
            accel_y=round(ay, 3) if ay is not None else None,
            accel_z=round(az, 3) if az is not None else None,
            activity_label=activity,
            signal_quality=sig_qual,
            data_quality_status=data_qual,
            provenance_metadata={
                "scenario_name": scenario,
                "step_index": state.step,
                "synthetic_noise_std": state.config.noise_std,
                "simulated_battery_pct": state.config.simulated_battery_pct
            }
        )

        state.packet_count += 1
        state.last_packet = packet
        return packet

    def generate_batch(self, patient_id: str, scenario: ScenarioName, count: int, interval_seconds: int = 1) -> List[SensorPacket]:
        packets = []
        base_time = datetime.now(timezone.utc).timestamp() - (count * interval_seconds)
        for i in range(count):
            t_stamp = datetime.fromtimestamp(base_time + (i * interval_seconds), tz=timezone.utc)
            packet = self.generate_packet(patient_id, scenario_override=scenario, timestamp_override=t_stamp)
            packets.append(packet)
        return packets

    def get_status(self, patient_id: str) -> SimulatorStatus:
        state = self.get_or_create(patient_id)
        return SimulatorStatus(
            patient_id=patient_id,
            is_running=state.is_running,
            current_scenario=state.config.scenario,
            tick_rate_ms=state.config.tick_rate_ms,
            packet_count=state.packet_count,
            last_packet=state.last_packet
        )

    def list_active_statuses(self) -> List[SimulatorStatus]:
        return [self.get_status(pid) for pid in self.simulators.keys()]


# Global singleton instance
virtual_sensor_engine = VirtualSensorEngine()
