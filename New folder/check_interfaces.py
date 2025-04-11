from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from scapy.all import sniff, DNSQR, IP 
import threading
import time
import psutil
import logging


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

logging.basicConfig(level=logging.DEBUG)

logs = []
capturing = False
selected_interface = None
log_lock = threading.Lock()

# Получить список интерфейсов
@app.route("/interfaces")
def interfaces():
    interfaces = [{"name": name} for name in psutil.net_if_addrs().keys()]
    app.logger.debug(f"Интерфейсы: {interfaces}")
    return jsonify(interfaces)
# Получить DNS-логи
@app.route("/logs")
def get_logs():
    with log_lock:
        return jsonify(logs)

# Запустить захват трафика
@app.route("/start", methods=["POST"])
def start_capture():
    global capturing, selected_interface
    data = request.get_json()
    selected_interface = data.get("interface")

    if capturing or not selected_interface:
        return jsonify({"error": "Already capturing or no interface selected"}), 400

    capturing = True
    threading.Thread(target=capture_dns, args=(selected_interface,), daemon=True).start()
    return jsonify({"status": "started"})

# DNS захват
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

            socketio.emit("new_log", entry)

    sniff(filter="udp port 53", iface=interface, prn=process_packet, store=0)

# Запуск приложения
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
