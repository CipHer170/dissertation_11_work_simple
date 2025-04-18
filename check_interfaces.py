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

logs = []
capturing = False
selected_interface = None
log_lock = threading.Lock()
# Global variable to hold the sniffer thread
sniffer_thread = None
# Event to signal the sniffer thread to stop
stop_event = threading.Event()

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
        return jsonify(logs)

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
        # Write UTF-8 BOM for Excel/Unicode compatibility
        yield '\ufeff'
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
        stop_event.set()  # Signal the thread to stop
        capturing = False
        app.logger.info("Stopping capture...")
        # Wait for thread to finish (with timeout)
        sniffer_thread.join(timeout=3)
        if sniffer_thread.is_alive():
            app.logger.warning("Sniffer thread did not terminate gracefully")
        else:
            app.logger.info("Sniffer thread terminated successfully")
    
    return jsonify({"status": "stopped"})

# Start traffic capture
@app.route("/start", methods=["POST"])
def start_capture():
    global capturing, selected_interface, sniffer_thread, stop_event
    data = request.get_json()
    selected_interface = data.get("interface")

    if not selected_interface:
        return jsonify({"error": "No interface selected"}), 400
    
    # If already capturing, stop first
    if capturing:
        stop_capture()
    
    # Reset stop event
    stop_event.clear()
    
    # Start new capture
    capturing = True
    sniffer_thread = threading.Thread(target=capture_dns, args=(selected_interface,), daemon=True)
    sniffer_thread.start()
    app.logger.info(f"Started capture on interface: {selected_interface}")
    
    return jsonify({"status": "started"})

# DNS capture function
def capture_dns(interface):
    def process_packet(packet):
        # Check if we should stop
        if stop_event.is_set():
            return True  # Signal to stop sniffing
            
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
                    if len(logs) > 1000:
                        logs.pop(0) 

                socketio.emit("new_log", entry)
        except Exception as e:
            app.logger.error(f"Error processing packet: {e}")
        
        return None  # Continue sniffing

    try:
        app.logger.info(f"Starting capture on interface: {interface}")
        # The stop_filter parameter allows us to stop sniffing when the function returns True
        sniff(filter="udp port 53", iface=interface, prn=process_packet, 
              store=0, stop_filter=lambda p: stop_event.is_set())
    except Exception as e:
        import traceback
        app.logger.error(f"Error starting capture: {e}\n{traceback.format_exc()}")
    finally:
        global capturing
        capturing = False
        app.logger.info("Capture stopped")
        # Optionally: auto-restart if not stopped intentionally
        if not stop_event.is_set():
            app.logger.warning("Sniffer died unexpectedly. Auto-restarting...")
            # Restart the sniffer thread after a short delay
            time.sleep(2)
            global sniffer_thread
            sniffer_thread = threading.Thread(target=capture_dns, args=(interface,), daemon=True)
            sniffer_thread.start()

# Graceful shutdown handler
def shutdown_server(signal, frame):
    app.logger.info("Shutting down server...")
    global capturing
    if capturing:
        stop_capture()
    # Allow some time for cleanup
    time.sleep(1)
    exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, shutdown_server)
signal.signal(signal.SIGTERM, shutdown_server)

# Sniffer health check endpoint
@app.route("/sniffer_status")
def sniffer_status():
    global sniffer_thread
    if sniffer_thread is not None:
        return jsonify({"alive": sniffer_thread.is_alive()})
    return jsonify({"alive": False})

# Run the application
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
