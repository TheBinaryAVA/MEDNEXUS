# 🏥 AI-Powered Hospital Operations Monitoring System

## 📌 Problem Statement

Hospitals often face operational challenges such as:

* Long **OPD waiting queues**
* Difficulty **monitoring patient areas in real time**
* Delayed response to **critical events**
* Lack of **data-driven insights for hospital staff**

Manual monitoring makes it difficult to detect overcrowding, estimate wait times, or quickly identify operational bottlenecks.

This project proposes an **AI-powered monitoring system** that uses **computer vision to automatically analyze hospital environments** and generate insights that help staff manage operations more efficiently.

---

## 💡 Solution Overview

The system uses **YOLO-based real-time computer vision** to monitor hospital environments through a camera feed.

It automatically:

* Detects people in waiting areas
* Estimates **queue length**
* Predicts **patient waiting time**
* Helps hospital staff **identify overcrowding situations**

This enables hospitals to make **faster operational decisions**, improving patient flow and reducing wait times.

---

## ⚙️ Key Features

### 👁️ Real-Time Monitoring

The system processes live camera feeds to continuously monitor patient areas.

### 👥 Queue Detection

Detects and counts people in the OPD waiting area.

### ⏳ Wait Time Estimation

Uses detected queue length to estimate approximate waiting time.

### 🚨 Operational Awareness

Helps hospital staff identify overcrowding and take action quickly.

---

## 🧠 Technology Stack

* **Python**
* **Ultralytics YOLO (Object Detection)**
* **OpenCV**
* **PyTorch**
* **NumPy**

---

## 📂 Project Structure

```
hospital-ai-monitor/
│
├── queue.py
├── person_labelling.pt
├── requirements.txt
├── datasets/
└── Training Performance Graphs/
```

### File Description

**queue.py**
Main program that runs the monitoring system and performs people detection.

**person_labelling.pt**
Trained YOLO model used for detecting people in the camera feed.

**requirements.txt**
Contains required Python libraries.

---

## 🚀 Installation

### 1. Clone the repository

```
git clone https://github.com/your-username/hospital-ai-monitor.git
cd hospital-ai-monitor
```

### 2. Install dependencies

```
pip install -r requirements.txt
```

If needed, install manually:

```
pip install ultralytics opencv-python torch numpy
```

---

## ▶️ Running the System

Run the monitoring script:

```
python queue.py
```

The system will start the camera feed and detect people in real time.

---

## 📊 Example System Output

```
People detected: 8
Estimated queue length: 8
Estimated waiting time: 32 minutes
```

This information can help hospital administrators:

* Identify OPD congestion
* Allocate additional staff
* Improve patient flow

---

## 🔮 Future Enhancements

* Patient **fall detection** in ICU
* **Doctor vs patient detection**
* **Automated alerts for overcrowding**
* Hospital **dashboard visualization**
* Integration with **hospital management systems**

---

## 🎯 Impact

By introducing **AI-based monitoring**, hospitals can:

* Improve patient experience
* Reduce waiting times
* Enable data-driven decision making
* Enhance hospital operational efficiency

---

## 👨‍💻 Developed For

Healthcare AI / Hospital Operations Monitoring Hackathon Project

---

## 📜 License

MIT License

