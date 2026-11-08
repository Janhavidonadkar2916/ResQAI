# ResQCare AI — Clinical & Algorithmic Research Notes

## 1. Abstract & Clinical Background

As global demographics shift towards an aging population, remote health monitoring and automated emergency coordination become critical healthcare infrastructure. However, real-world deployment faces two critical failure modes:
1. **Alarm Fatigue**: Excessive false positives from motion artifacts or transient spikes cause caregivers and clinicians to silence or ignore alerts.
2. **Black-Box AI Skepticism**: Uninterpretable neural network scores prevent clinicians from understanding why an anomaly was flagged.

ResQCare AI addresses these challenges through a **dual-tier, explainable hybrid architecture** combining validated deterministic clinical rules (derived from the **National Early Warning Score - NEWS2**) with unsupervised multivariate **Isolation Forests** and an **inertial kinematic fall detector**.

---

## 2. Clinical Reference Baselines & Scoring Models

### The National Early Warning Score (NEWS2) Foundation
In clinical acute care settings, physiological deterioration precedes cardiac arrest or critical events by several hours. The Royal College of Physicians established NEWS2 to standardize the detection of acute illness severity.

ResQCare AI adapts these clinical boundaries into its Tier 1 Deterministic Rule Engine:

| Physiological Parameter | Severe Low (3 pts) | Moderate Low (2 pts) | Normal (0 pts) | Moderate High (2 pts) | Severe High (3 pts) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heart Rate (bpm)** | $\le 40$ | $41 - 50$ | $51 - 90$ | $111 - 130$ | $\ge 131$ |
| **$\text{SpO}_2$ Oxygen (%)** | $\le 91$ | $92 - 93$ | $96 - 100$ | -- | -- |
| **Temperature (°C)** | $\le 35.0$ | $35.1 - 36.0$ | $36.1 - 38.0$ | $38.1 - 39.0$ | $\ge 39.1$ |

In ResQCare AI:
- An isolated extreme value (e.g. $\text{SpO}_2 < 88\%$ or $\text{HR} > 150\text{ bpm}$) immediately triggers Tier 1 Critical alerts.
- Moderate deviations across multiple vitals are aggregated by the Tier 2 Isolation Forest into an elevated composite risk score.

---

## 3. Kinematic Fall Detection Formulation

Falls represent the leading cause of fatal and non-fatal injuries among individuals aged 65 and older. Inertial measurement units (IMUs) measuring 3-axis linear acceleration ($a_x, a_y, a_z$) allow algorithmic discrimination between normal activities of daily living (ADL) and traumatic fall impacts.

### Resultant Acceleration Magnitude ($A_{res}$)
Linear acceleration components depend on sensor orientation. To achieve rotation-invariant detection, ResQCare AI computes the Euclidean resultant acceleration:

$$A_{res} = \sqrt{a_x^2 + a_y^2 + a_z^2}$$

Under stationary resting conditions, $A_{res} \approx 1.0g$ (due to gravity). During vigorous walking or jogging, $A_{res}$ peaks typically remain below $2.2g$.

### Multi-Stage Fall Criteria
To prevent false alarms from dropped devices or vigorous gestures, ResQCare AI employs a multi-condition temporal state trigger:

1. **Free-Fall Phase (Optional / Sub-second)**: Momentary dip in acceleration ($A_{res} < 0.6g$).
2. **Impact Shock Threshold**: Sudden deceleration spike exceeding safety limits:
   $$A_{res}^{peak} \ge 3.0g$$
3. **Post-Impact Posture Change**: Shift from vertical orientation ($a_y \approx 1.0g$) to horizontal orientation ($a_x \text{ or } a_z \approx 1.0g$).
4. **Post-Impact Sustained Immobility**: Over a subsequent window $W$ ($10\text{ seconds}$), the acceleration variance must fall below an immobility threshold:
   $$\sigma^2(A_{res}) = \frac{1}{N} \sum_{k=1}^N (A_{res}[k] - \mu)^2 < 0.15\, g^2$$

If both the impact spike and sustained immobility conditions are met, the event is classified as `FALL_IMPACT_AND_IMMOBILITY` and triggers immediate Level 4 emergency protocol.

---

## 4. Unsupervised Anomaly Detection: Isolation Forest

Supervised machine learning algorithms (e.g. Random Forests, XGBoost, CNNs) require massive, balanced labeled training sets of pathological events. In real-world telemetry, physiological deterioration is rare and non-stationary.

ResQCare AI employs **Isolation Forest (Liu et al., 2008)**, an unsupervised tree ensemble algorithm built on the premise that anomalies are "few and different":

1. **Isolation Mechanism**: Recursive random partitioning isolates rare feature vectors in significantly fewer tree splits (shorter path lengths $h(x)$).
2. **Anomaly Score Formulation**:
   $$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$
   Where $c(n) = 2\ln(n - 1) + 0.5772156649 - \frac{2(n-1)}{n}$ is the average path length of unsuccessful searches in a Binary Search Tree of $n$ instances.
3. **Contamination Baseline**: Calibrated with a contamination parameter $\gamma = 0.05$, capturing non-linear cross-channel correlations (e.g. elevated heart rate during horizontal immobility without exercise).

---

## 5. Dynamic Feature Attribution & Explainability

Black-box alert flags undermine clinical trust. ResQCare AI computes deterministic **Feature Attributions** to explain each risk assessment:

1. **Rolling Normalization**: For each physiological dimension $j \in \{\text{HR}, \text{SpO}_2, \text{Temp}, A_{res}\}$, compute rolling $Z$-scores relative to the patient's individual baseline $[\mu_j, \sigma_j]$:
   $$Z_j = \frac{x_j - \mu_j}{\sigma_j + \epsilon}$$
2. **Percentage Contribution**:
   $$\text{Attribution}_j = \frac{|Z_j|}{\sum_{k=1}^M |Z_k|} \times 100\%$$
   This ensures $\sum \text{Attribution}_j = 100\%$, allowing the caregiver dashboard to display clear attribution bars (e.g. *SpO2: 65%, Heart Rate: 25%, Motion: 10%*).
3. **Natural Language Synthesis**: The explainability service translates attributions and rule violations into human-readable sentences without clinical jargon.

---

## 6. Regulatory & Ethical Boundaries

1. **Non-Diagnostic Prototype Scope**:
   ResQCare AI is an engineering and algorithmic research platform. It has not undergone clinical trials or FDA 510(k) clearance and must never be utilized as a primary life-support monitor.
2. **Fail-Safe Human-in-the-Loop**:
   Automated systems must never unilaterally dispatch emergency first responders (911/112) without human validation, as false dispatches can trigger severe civil liability and strain public safety resources.
3. **Silence is Never Safety**:
   If a patient fails to answer the 45-second verification countdown, the platform treats the silence as potential incapacitation and immediately alerts the caregiver network.

