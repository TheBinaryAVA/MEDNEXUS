import cv2
import numpy as np

from ultralytics import YOLO
import os
import datetime
import yt_dlp
import time
import torch
import threading

import cv2
from ultralytics import YOLO
import time

# Load the YOLO model (person detection model from repo)
model = YOLO("person_labelling.pt")

# Video source (0 for webcam or replace with video path)
cap = cv2.VideoCapture("Guide_video.mp4")

# KPI baseline values (simulated 7-day averages)
baseline_wait_time = 25   # minutes
avg_consult_time = 6      # minutes per patient

font = cv2.FONT_HERSHEY_SIMPLEX

print("Hospital AI Operations Monitoring Started...")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # Run YOLO detection
    results = model(frame)

    people_count = 0

    for r in results:
        boxes = r.boxes

        for box in boxes:
            cls = int(box.cls)

            # Class 0 usually corresponds to "person"
            if cls == 0:
                people_count += 1

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)

                cv2.putText(frame, "Patient",
                            (x1, y1-10),
                            font,
                            0.5,
                            (0,255,0),
                            2)

    # -------------------------
    # KPI CALCULATION
    # -------------------------

    queue_length = people_count

    wait_time = queue_length * avg_consult_time

    # -------------------------
    # ANOMALY DETECTION
    # -------------------------

    deviation = 0
    anomaly = False

    if baseline_wait_time > 0:
        deviation = (wait_time - baseline_wait_time) / baseline_wait_time

        if deviation > 0.15:
            anomaly = True

    # -------------------------
    # INSIGHT GENERATION
    # -------------------------

    insight = ""

    if anomaly:

        percent = round(deviation * 100)

        insight = f"""
OPD wait time increased by {percent}% compared to the 7-day baseline.
Computer vision detected {queue_length} patients waiting in the OPD area.

Possible Causes:
• High patient inflow
• Reduced doctor availability
• Consultation backlog

Recommended Actions:
• Reassign additional doctor to OPD
• Activate overflow consultation desk
• Notify patients about expected delays
"""

        print(insight)

    # -------------------------
    # DISPLAY METRICS ON VIDEO
    # -------------------------

    cv2.putText(frame,
                f"Queue Length: {queue_length}",
                (30,40),
                font,
                0.8,
                (0,255,0),
                2)

    cv2.putText(frame,
                f"Estimated Wait Time: {wait_time} min",
                (30,80),
                font,
                0.8,
                (0,255,0),
                2)

    cv2.putText(frame,
                f"Baseline Wait Time: {baseline_wait_time} min",
                (30,120),
                font,
                0.7,
                (255,255,0),
                2)

    # -------------------------
    # ALERT DISPLAY
    # -------------------------

    if anomaly:

        cv2.putText(frame,
                    "ALERT: WAIT TIME ANOMALY DETECTED",
                    (30,160),
                    font,
                    0.8,
                    (0,0,255),
                    2)

    # Show video
    cv2.imshow("Hospital Operations AI Monitor", frame)

    key = cv2.waitKey(1)

    if key == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()