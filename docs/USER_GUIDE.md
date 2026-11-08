# ResQCare AI — User & Operator Guide

## 1. Introduction

Welcome to the **ResQCare AI Command Center**, an advanced, research-oriented health monitoring and emergency response platform.

This guide provides caregivers, clinicians, and researchers with clear, step-by-step instructions for operating the platform, monitoring patients in real time, testing simulated anomalies, handling emergency incidents, and managing medical profiles.

---

## 2. Navigating the Command Center

The web dashboard is organized into primary functional views accessible via the top navigation bar:

```
[ResQCare AI]  [Overview]  [Emergencies]  [AI Insights]  [Medical Profile]  [Audit Log]  [Analytics]  [Simulator]
```

### Top Bar Indicators
- **Selected Patient Dropdown**: Switch between active patients (e.g., *Eleanor Vance (Age 78)* vs. *Arthur Pendelton (Age 82)*).
- **Global Status Badge**: Shows the patient's current risk level (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`).
- **Telemetry Latency**: Displays live stream latency (typically `< 45ms`).
- **Notification Bell**: Displays unread high-priority alerts with an interactive notification drawer.
- **Role Persona**: Displays current active credentials (`Dr. Sarah Chen, Primary Caregiver`).

---

## 3. Real-Time Patient Monitoring

### Vitals Trend Monitor (`Overview` Tab)
- **Heart Rate Chart**: Continuously streams heart rate readings in bpm, showing normal baseline reference zones ($60 - 100\text{ bpm}$) and clinical thresholds ($> 120\text{ bpm}$ or $< 50\text{ bpm}$).
- **$\text{SpO}_2$ Oxygenation Chart**: Displays pulse oximetry percentage with hypoxia warning markers ($< 92\%$).
- **Temperature & Kinematics**: Displays body temperature (°C) and 3-axis motion components ($a_x, a_y, a_z$).

### Kinematic 3D Gauge
- Visualizes the instantaneous resultant acceleration vector:
  $$|A_{res}| = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
- Color-coded safety zones:
  - **Green ($< 1.8g$)**: Normal resting or walking movement.
  - **Amber ($1.8g - 3.0g$)**: Vigorous activity or sudden movement.
  - **Red ($\ge 3.0g$)**: Impact spike suggestive of a traumatic fall.

---

## 4. Virtual Sensor Simulation System (`Simulator` Tab)

The built-in simulator allows testing complex clinical events without requiring physical wearable hardware.

### Operating the Simulator
1. Navigate to the **Simulator** tab.
2. Select a target patient.
3. Choose a physiological profile from the **Scenario Selector**:
   - `NORMAL_RESTING`: Baseline vitals at rest.
   - `ACTIVE_EXERCISE`: Elevated heart rate and rhythmic acceleration.
   - `TACHYCARDIA_EPISODE`: Sudden paroxysmal tachycardia.
   - `BRADYCARDIA_EPISODE`: Pathological bradycardia drop.
   - `RESPIRATORY_DISTRESS`: Hypoxia ($\text{SpO}_2 < 85\%$) and rapid breathing.
   - `FALL_IMPACT_AND_IMMOBILITY`: Severe deceleration spike followed by immobility.
   - `SENSOR_DISCONNECT_DROPOUT`: Missing sensor readings and zero signal quality.
4. **Adjust Tick Rate**: Change data generation frequency ($250\text{ms}$ fast streaming up to $5000\text{ms}$).
5. **Toggle Jitter**: Enable or disable realistic biological baseline noise.

### Instant Anomaly Injection
Click any **Instant Injection** button to immediately insert an acute episode into the live stream:
- **Inject Fall Shock**: Fires a $3.8g$ impact reading and forces prone immobility.
- **Inject Acute Hypoxia**: Drops $\text{SpO}_2$ to $82\%$ immediately.
- **Inject Tachycardia Spike**: Jumps heart rate to $165\text{ bpm}$.

---

## 5. Explainable AI Insights (`AI Insights` Tab)

The AI engine evaluates multi-modal telemetry to deliver transparent risk assessments.

### Interpreting AI Output
- **Composite Risk Score (0–100)**: Unified health risk score calculated from clinical rules and Isolation Forest anomaly predictions.
- **Feature Attribution Breakdown**: Visual percentage bars explaining exactly which vital sign contributed most to the elevated score (e.g., *Oxygenation $\text{SpO}_2$: 65%*, *Heart Rate: 25%*).
- **Clinical Rule Status**: Displays active clinical rule validations (e.g., *RULE_HYPOXIA_CRITICAL: Violated*).
- **Plain-Language Narrative**: Human-readable clinical summary generated dynamically by the explainability engine.

---

## 6. Emergency Incident Management (`Emergencies` Tab)

When an acute anomaly or fall is detected, an Emergency Incident is automatically instantiated.

### The 45-Second Verification Grace Period
1. An urgent notification banner appears across the dashboard with an audible alarm indicator.
2. The **Emergency Verification Console** displays a 45-second countdown timer.
3. **If the incident is a false alarm**:
   - Click **"Cancel (False Alarm)"** to abort the emergency workflow and log the reason.
4. **If the user is unresponsive**:
   - When the 45-second timer reaches zero, the system **automatically escalates** the incident to `ESCALATED` status and notifies all registered emergency contacts.
5. **Caregiver Acknowledgment**:
   - Caregivers click **"Acknowledge Incident"** to indicate they are actively responding.
6. **Incident Resolution**:
   - Click **"Mark as Resolved"**, enter clinical debrief notes (e.g., *"Patient assisted, vitals normalized"*), and archive the incident.

---

## 7. Secure Medical Profile & Emergency Pass (`Medical Profile` Tab)

### Managing Medical Vault Data
1. Navigate to the **Medical Profile** tab.
2. View blood type, confirmed allergies with severity ratings, current prescription medications with dosages, known medical conditions, and Resuscitation Directives (DNR/DNAR).
3. Click **"Edit Profile"** to modify information and save changes. Every edit is cryptographically recorded in the security audit log.

### Exporting First-Responder Emergency Pass
1. Click **"Export Emergency Pass"**.
2. A high-contrast, printable emergency medical card appears formatted specifically for paramedics and emergency room staff.
3. Click **"Print / Save PDF"** to generate a hard-copy pass.

---

## 8. Tamper-Evident Security Audit Log (`Audit Log` Tab)

ResQCare AI maintains an immutable security audit ledger tracking all interactions with patient records.

### Reviewing Audit Records
- Navigate to the **Audit Log** tab.
- Inspect chronological entries recording:
  - **Timestamp (UTC)**
  - **Action Type** (e.g. `VIEW_MEDICAL_PROFILE`, `UPDATE_MEDICAL_PROFILE`, `EXPORT_EMERGENCY_PASS`, `RESOLVE_EMERGENCY`)
  - **Actor / User Email**
  - **IP Address**
  - **Target Resource UUID**
- Use the **Filter dropdown** to view specific action categories or click **Refresh** to poll recent entries.
