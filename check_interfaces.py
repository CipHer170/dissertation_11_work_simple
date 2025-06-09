from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from scapy.all import sniff, DNSQR, IP
import psutil
import threading
import time
import logging
import signal

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

logging.basicConfig(level=logging.DEBUG)

# ============================================================================
# IMPROVED MEMORY MANAGEMENT CONFIGURATION
# ============================================================================
from collections import deque
from datetime import datetime, timedelta

class Config:
    MAX_LOGS_IN_MEMORY = 1000  # Consistent limit everywhere
    CLEANUP_INTERVAL = 300     # Clean old logs every 5 minutes
    MAX_LOG_AGE_HOURS = 24     # Keep logs for 24 hours max
    MEMORY_WARNING_THRESHOLD = 800  # Warn when approaching limit

# Use deque for better performance on append/pop operations
logs = deque(maxlen=Config.MAX_LOGS_IN_MEMORY)  # Automatically limits size
capturing = False
selected_interface = None
log_lock = threading.Lock()
sniffer_thread = None
stop_event = threading.Event()
cleanup_thread = None

# Get list of interfaces
@app.route("/interfaces")
def interfaces():
    interfaces = [{"name": name} for name in psutil.net_if_addrs().keys()]
    app.logger.debug(f"Interfaces: {interfaces}")
    return jsonify(interfaces)

# Get DNS logs
@app.route("/logs")
def get_logs():
    with log_lock:
        # Convert deque to list for JSON serialization
        return jsonify(list(logs))

# Show all unique IPs seen in DNS logs
@app.route("/unique_ips")
def unique_ips():
    with log_lock:
        unique = sorted({entry["ip"] for entry in logs if "ip" in entry and entry["ip"]})
    return jsonify(unique)

# Export all DNS logs as CSV
@app.route("/export")
def export_logs():
    import csv
    from flask import Response
    with log_lock:
        export_logs = list(logs)
    if not export_logs:
        return Response('No data to export', mimetype='text/plain')
    headers = export_logs[0].keys()
    def generate():
        import io
        output = io.StringIO()
        yield '\ufeff'  # UTF-8 BOM
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        for row in export_logs:
            writer.writerow(row)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    return Response(generate(), mimetype='text/csv', headers={
        'Content-Disposition': 'attachment; filename="dns_logs.csv"'
    })

# Stop traffic capture
@app.route("/stop", methods=["POST"])
def stop_capture():
    global capturing, sniffer_thread
    
    if capturing and sniffer_thread and sniffer_thread.is_alive():
        stop_event.set()
        capturing = False
        app.logger.info("Stopping capture...")
        sniffer_thread.join(timeout=3)
        if sniffer_thread.is_alive():
            app.logger.warning("Sniffer thread did not terminate gracefully")
        else:
            app.logger.info("Sniffer thread terminated successfully")
    
    return jsonify({"status": "stopped", "memory_stats": get_memory_stats()})

# Start traffic capture
@app.route("/start", methods=["POST"])
def start_capture():
    global capturing, selected_interface, sniffer_thread, stop_event, cleanup_thread
    data = request.get_json()
    selected_interface = data.get("interface")

    if not selected_interface:
        return jsonify({"error": "No interface selected"}), 400
    
    if capturing:
        stop_capture()
    
    stop_event.clear()
    capturing = True
    
    # Start sniffer thread
    sniffer_thread = threading.Thread(target=capture_dns, args=(selected_interface,), daemon=True)
    sniffer_thread.start()
    
    # Start cleanup thread if not already running
    if cleanup_thread is None or not cleanup_thread.is_alive():
        cleanup_thread = threading.Thread(target=cleanup_old_logs, daemon=True)
        cleanup_thread.start()
        app.logger.info("Started cleanup thread")
    
    app.logger.info(f"Started capture on interface: {selected_interface}")
    
    return jsonify({
        "status": "started", 
        "memory_stats": get_memory_stats()
    })

# ============================================================================
# MEMORY MONITORING AND CLEANUP
# ============================================================================
def cleanup_old_logs():
    """Background thread to clean up old logs periodically"""
    while True:
        try:
            time.sleep(Config.CLEANUP_INTERVAL)
            if not logs:
                continue
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(hours=Config.MAX_LOG_AGE_HOURS)
            with log_lock:
                logs_list = list(logs)
                cleaned_logs = []
                for log_entry in logs_list:
                    try:
                        log_time = datetime.strptime(log_entry['time'], "%Y-%m-%d %H:%M:%S")
                        if log_time >= cutoff_time:
                            cleaned_logs.append(log_entry)
                    except (ValueError, KeyError):
                        cleaned_logs.append(log_entry)
                logs.clear()
                logs.extend(cleaned_logs[-Config.MAX_LOGS_IN_MEMORY:])
                removed_count = len(logs_list) - len(cleaned_logs)
                if removed_count > 0:
                    app.logger.info(f"Cleaned up {removed_count} old log entries")
        except Exception as e:
            app.logger.error(f"Error in cleanup thread: {e}")

def get_memory_stats():
    """Get current memory usage statistics"""
    return {
        "logs_count": len(logs),
        "max_logs": Config.MAX_LOGS_IN_MEMORY,
        "memory_usage_percent": (len(logs) / Config.MAX_LOGS_IN_MEMORY) * 100,
        "cleanup_threshold": Config.MEMORY_WARNING_THRESHOLD
    }

# ============================================================================
# IMPROVED DNS CAPTURE WITH MEMORY MANAGEMENT
# ============================================================================
def capture_dns(interface):
    def process_packet(packet):
        if stop_event.is_set():
            return True
        try:
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
                app.logger.debug(f"Captured DNS request: {domain} from {ip}")
                with log_lock:
                    logs.append(entry)
                    current_size = len(logs)
                    if current_size >= Config.MEMORY_WARNING_THRESHOLD:
                        app.logger.warning(f"Memory usage high: {current_size}/{Config.MAX_LOGS_IN_MEMORY} logs")
                socketio.emit("new_log", entry)
                if len(logs) % 100 == 0:
                    socketio.emit("memory_stats", get_memory_stats())
        except Exception as e:
            app.logger.error(f"Error processing packet: {e}")
        return None
    try:
        app.logger.info(f"Starting capture on interface: {interface}")
        sniff(filter="udp port 53", iface=interface, prn=process_packet, 
              store=0, stop_filter=lambda p: stop_event.is_set())
    except Exception as e:
        import traceback
        app.logger.error(f"Error starting capture: {e}\n{traceback.format_exc()}")
    finally:
        global capturing
        capturing = False
        app.logger.info("Capture stopped")

# ============================================================================
# ADDITIONAL ENDPOINTS FOR MEMORY MANAGEMENT
# ============================================================================
@app.route("/memory_stats")
def memory_stats():
    """New endpoint to get memory usage statistics"""
    return jsonify(get_memory_stats())

@app.route("/clear_logs", methods=["POST"])
def clear_logs():
    """New endpoint to manually clear all logs"""
    with log_lock:
        logs.clear()
        app.logger.info("All logs cleared manually")
    return jsonify({"status": "cleared", "logs_count": 0})

# Graceful shutdown handler
def shutdown_server(signal, frame):
    app.logger.info("Shutting down server...")
    global capturing
    if capturing:
        stop_capture()
    time.sleep(1)
    exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, shutdown_server)
signal.signal(signal.SIGTERM, shutdown_server)

# Sniffer health check endpoint
@app.route("/sniffer_status")
def sniffer_status():
    global sniffer_thread
    status = {
        "alive": sniffer_thread.is_alive() if sniffer_thread else False,
        "memory_stats": get_memory_stats()
    }
    return jsonify(status)

# ============================================================================
# DEVICE TRAFFIC ANALYSIS
# ============================================================================
class DeviceStats:
    def __init__(self):
        self.total_bytes_sent = 0
        self.total_bytes_received = 0
        self.packets_sent = 0
        self.packets_received = 0
        self.first_seen = None
        self.last_seen = None
        self.connections = set()
        self.protocols = {}

# Глобальный словарь для хранения статистики по устройствам
device_stats = {}
device_stats_lock = threading.Lock()

def update_device_stats(log):
    with device_stats_lock:
        device_ip = log['ip']
        if device_ip not in device_stats:
            device_stats[device_ip] = DeviceStats()
            device_stats[device_ip].first_seen = log['time']
        
        stats = device_stats[device_ip]
        stats.last_seen = log['time']
        stats.total_bytes_received += int(log['length'])
        stats.packets_received += 1
        stats.connections.add(log['destination_ip'])
        
        # Определяем протокол по порту или другим признакам
        protocol = determine_protocol(log)
        if protocol:
            stats.protocols[protocol] = stats.protocols.get(protocol, 0) + 1

def determine_protocol(log):
    # Простая логика определения протокола
    # Можно расширить в зависимости от доступных данных
    if 'dns' in log.get('type', '').lower():
        return 'DNS'
    elif 'http' in log.get('type', '').lower():
        return 'HTTP'
    elif 'https' in log.get('type', '').lower():
        return 'HTTPS'
    return 'Unknown'

@app.route('/device-stats')
def get_device_stats():
    with device_stats_lock:
        stats = {}
        for ip, device in device_stats.items():
            stats[ip] = {
                'total_bytes_sent': device.total_bytes_sent,
                'total_bytes_received': device.total_bytes_received,
                'packets_sent': device.packets_sent,
                'packets_received': device.packets_received,
                'first_seen': device.first_seen,
                'last_seen': device.last_seen,
                'active_connections': len(device.connections),
                'protocols': device.protocols
            }
        return jsonify(stats)

@app.route('/device-stats/<ip>')
def get_device_stat(ip):
    with device_stats_lock:
        if ip not in device_stats:
            return jsonify({'error': 'Device not found'}), 404
        
        device = device_stats[ip]
        return jsonify({
            'total_bytes_sent': device.total_bytes_sent,
            'total_bytes_received': device.total_bytes_received,
            'packets_sent': device.packets_sent,
            'packets_received': device.packets_received,
            'first_seen': device.first_seen,
            'last_seen': device.last_seen,
            'active_connections': len(device.connections),
            'protocols': device.protocols
        })

# Обновляем обработчик новых логов
def handle_new_log(log):
    update_device_stats(log)
    # ... existing code ...

# Run the application
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
