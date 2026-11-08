# ResQCare AI — Sensor Contract v1.0 Specification

## 1. Overview & Specification Objectives

The **ResQCare Sensor Contract v1.0** defines the canonical data interchange format between physiological telemetry producers (simulators, virtual bridges, and future physical wearable hardware) and the ResQCare AI ingestion pipeline.

Adherence to this contract guarantees:
1. **Hardware Independence**: The backend ingestion engine operates identically on synthetic simulator frames or real wearable sensor payloads.
2. **Deterministic Validation**: Corrupt, out-of-range, or malformed data is rejected at the API perimeter.
3. **Clinical Non-Hallucination**: Sensor dropouts and signal degradations are explicitly preserved with `null` fields rather than inferred healthy defaults.

---

## 2. JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SensorReadingContract_v1",
  "type": "object",
  "required": [
    "schema_version",
    "patient_id",
    "source_type",
    "recorded_at",
    "signal_quality",
    "data_quality_status"
  ],
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": ["1.0"]
    },
    "patient_id": {
      "type": "string",
      "format": "uuid"
    },
    "source_type": {
      "type": "string",
      "enum": ["SYNTHETIC_SIMULATOR", "VIRTUAL_DEVICE", "WEARABLE_DEVICE"]
    },
    "recorded_at": {
      "type": "string",
      "format": "date-time"
    },
    "received_at": {
      "type": "string",
      "format": "date-time"
    },
    "heart_rate_bpm": {
      "type": ["number", "null"],
      "minimum": 20.0,
      "maximum": 260.0
    },
    "spo2_percent": {
      "type": ["number", "null"],
      "minimum": 50.0,
      "maximum": 100.0
    },
    "temperature_c": {
      "type": ["number", "null"],
      "minimum": 30.0,
      "maximum": 45.0
    },
    "accel_x": {
      "type": ["number", "null"],
      "minimum": -16.0,
      "maximum": 16.0
    },
    "accel_y": {
      "type": ["number", "null"],
      "minimum": -16.0,
      "maximum": 16.0
    },
    "accel_z": {
      "type": ["number", "null"],
      "minimum": -16.0,
      "maximum": 16.0
    },
    "activity_label": {
      "type": "string",
      "enum": ["RESTING", "WALKING", "RUNNING", "EXERCISING", "FALL_IMPACT", "IMMOBILE", "UNKNOWN"]
    },
    "signal_quality": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "data_quality_status": {
      "type": "string",
      "enum": ["VALID", "DEGRADED_SIGNAL", "MISSING_SENSORS", "STALE_DATA"]
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

---

## 3. Data Field Specifications & Boundary Rules

| Field Name | Type | Valid Physical Range | Unit | Missing Value Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `schema_version` | String | Fixed `"1.0"` | N/A | Mandatory |
| `patient_id` | UUID | RFC 4122 UUID v4 | N/A | Mandatory |
| `source_type` | Enum | `SYNTHETIC_SIMULATOR`, `WEARABLE_DEVICE` | N/A | Mandatory |
| `recorded_at` | DateTime | Valid ISO 8601 UTC | UTC | Mandatory |
| `heart_rate_bpm` | Float | `20.0` to `260.0` | Beats/Min | Set to `null` on optical PPG disconnect |
| `spo2_percent` | Float | `50.0` to `100.0` | Percentage | Set to `null` on poor perfusion/motion artifact |
| `temperature_c` | Float | `30.0` to `45.0` | Celsius | Set to `null` on thermistor detachment |
| `accel_x, y, z` | Float | `-16.0` to `+16.0` | Earth Gravity ($g$) | Set to `null` on IMU failure |
| `signal_quality` | Float | `0.0` (Noise) to `1.0` (Pristine) | Ratio | Mandatory |
| `data_quality_status` | Enum | `VALID`, `DEGRADED_SIGNAL`, `MISSING_SENSORS` | Enum | Mandatory |

---

## 4. Null-Handling & Sensor Fault Protocol

In healthcare telemetry, **missing data carries distinct clinical significance** compared to normal readings. A missing $\text{SpO}_2$ reading might indicate sensor displacement, poor peripheral perfusion, or patient agitation.

### Strict Non-Substitution Rules
1. **Never Default to Normal**: The ingestion pipeline and AI engine must NEVER replace `null` or missing values with normal population baselines (e.g. replacing missing $\text{SpO}_2$ with $98.0\%$).
2. **Quality Downgrade**: If any primary physiological field is null, `data_quality_status` MUST be set to `MISSING_SENSORS` or `DEGRADED_SIGNAL`.
3. **Model Awareness**: Machine learning components must isolate and impute missing values defensively or mask them out of feature vectors without distorting anomaly confidence scores.

---

## 5. Synthetic Scenario Reference Catalog

The ResQCare Simulator produces 7 reproducible physiological scenarios:

```
+---------------------------------------------------------------------------------------+
| SCENARIO 1: NORMAL_RESTING                                                            |
| HR: 68-76 bpm | SpO2: 97-99% | Temp: 36.6-37.0°C | Accel: ~1.0g vertical gravity       |
| Activity: RESTING | Signal Quality: 0.98 | Quality Status: VALID                      |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 2: ACTIVE_EXERCISE                                                           |
| HR: 120-145 bpm | SpO2: 96-98% | Temp: 37.2-37.6°C | Accel: Periodic 1.8-2.4g cycles     |
| Activity: RUNNING | Signal Quality: 0.90 | Quality Status: VALID                      |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 3: TACHYCARDIA_EPISODE                                                       |
| HR: 150-175 bpm (Sudden onset) | SpO2: 95-97% | Temp: 37.0°C | Accel: 1.0g resting    |
| Activity: RESTING | Clinical Flag: Inappropriate resting tachycardia                  |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 4: BRADYCARDIA_EPISODE                                                       |
| HR: 35-42 bpm (Pathological drop) | SpO2: 94-96% | Temp: 36.4°C | Accel: 1.0g resting |
| Activity: RESTING | Clinical Flag: Severe sinus bradycardia                           |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 5: RESPIRATORY_DISTRESS                                                      |
| HR: 115-130 bpm | SpO2: 82-88% (Severe Hypoxia) | Temp: 37.8°C | Accel: Agitated      |
| Activity: RESTING | Clinical Flag: Acute hypoxemic respiratory insufficiency           |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 6: FALL_IMPACT_AND_IMMOBILITY                                                |
| Phase A (T=0): High-g shock spike (A_res: 3.5g - 5.2g)                                |
| Phase B (T+1 to T+60): Horizontal posture change (A_y -> 0, A_z -> 1)                 |
| Phase C: Complete stillness (Variance < 0.05 g^2) | Activity: IMMOBILE                |
+---------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| SCENARIO 7: SENSOR_DISCONNECT_DROPOUT                                                 |
| HR: null | SpO2: null | Temp: 36.7°C | Accel: 1.0g | Signal Quality: 0.0              |
| Activity: UNKNOWN | Quality Status: MISSING_SENSORS | Provenance preserved            |
+---------------------------------------------------------------------------------------+
```

