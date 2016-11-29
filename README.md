# Internet-of-Robots
This repository contains the codes for IoR, for robots, client and server.

The main script for client side is the javascript located in **scripts/script.js**

Requires, fswebcam onclient for snapshot.

# What is IoR

With development of robotics and its entrance in mainstream lifestyle (restaurants, hotels, security, etc), we need a framework that can:

1) Enable a swarm of robots to be instantly created with functions exposed through the IoR API.

2) An API that allows instantiation of virtual robots through certain properties and setting up communication channels including but not limited to MQTT, socketIO, and/or others.

3) With development of technologies like Intel Euclid, making any robot **mobile** and **functional** should not be trivial.

4) IoR states that any robot is represented as a virtual thing (talking in terms of AWS IoT cloud). This **thing** is then exposed to certain authentication and functions. Functions can include general actions as autonomous navigation, path planning to provision of specific functions within the context of deployment.

5) The current API is a demo allowing robots to share surveillance data to the IoR cloud and retrieve results.

# To Summarize

IoR is inspired from the concept of IoT where multiple robotic agents form a part of a robotic ecosystem sharing data and communicating amongst themselves. Such a system is the next step of autonomous robots where multiple robots can autonomously collaborate with each other towards a specific goal.
