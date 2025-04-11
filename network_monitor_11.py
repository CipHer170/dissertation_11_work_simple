from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from scapy.all import sniff, DNSQR, IP
import threading
import time
import psutil
import logging
import json
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

logging.basicConfig(level=logging.DEBUG)

logs = []
capturing = False
selected_interface = None
log_lock = threading.Lock()
log_file = "logs.json"

# Загрузка логов из файла при старте сервера
if os.path.exists(log_file):
    with open(log_file, "r") as f:
        try:
            logs = json.load(f)
        except json.JSONDecodeError:
            logs = []

# Сохранение логов в файл
def save_logs():
    with log_lock:
        with open(log_file, "w") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)

@app.route("/interfaces")
def interfaces():
    interfaces = [{"name": name} for name in psutil.net_if_addrs().keys() if name != "lo"]
    app.logger.debug(f"Интерфейсы: {interfaces}")
    return jsonify(interfaces)

@app.route("/logs")
def get_logs():
    with log_lock:
        return jsonify(logs)

@app.route("/start", methods=["POST"])
def start_capture():
    global capturing, selected_interface
    data = request.get_json()
    selected_interface = data.get("interface")

    if not selected_interface:
        return jsonify({"error": "No interface selected"}), 400

    if capturing:
        return jsonify({"status": "already capturing"})

    capturing = True
    threading.Thread(target=capture_dns, args=(selected_interface,), daemon=True).start()
    return jsonify({"status": "started"})

# DNS захват трафика
def capture_dns(interface):
    def process_packet(packet):
        if packet.haslayer(DNSQR) and packet.haslayer(IP):
            domain = packet[DNSQR].qname.decode("utf-8").rstrip(".")
            ip = packet[IP].src
            proto = packet.proto
            proto_name = "UDP" if proto == 17 else str(proto)
            length = len(packet)
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

            entry = {
                "ip": ip,
                "domain": domain,
                "protocol": proto_name,
                "length": length,
                "time": timestamp
            }

            with log_lock:
                logs.append(entry)
                if len(logs) > 1000:
                    logs.pop(0)
                save_logs()  # сохраняем каждый новый лог

            socketio.emit("new_log", entry)

    sniff(filter="udp port 53", iface=interface, prn=process_packet, store=0)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
