
from flask import Flask, jsonify, Response
from prometheus_client import (
    Gauge,
    Counter,
    generate_latest,
    CONTENT_TYPE_LATEST
)
import psutil
import platform
import time

app = Flask(__name__, static_folder="frontend", static_url_path="")

START_TIME = time.time()

# Métriques Prometheus
cpu_usage = Gauge("serverwatch_cpu_usage_percent", "CPU usage in percent")
ram_usage = Gauge("serverwatch_ram_usage_percent", "RAM usage in percent")
disk_usage = Gauge("serverwatch_disk_usage_percent", "Disk usage in percent")

app_requests = Counter(
    "serverwatch_http_requests_total",
    "Total HTTP requests"
)


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "system": platform.system()
    })


@app.route("/api/metrics")
def system_metrics():
    cpu = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    cpu_usage.set(cpu)
    ram_usage.set(memory.percent)
    disk_usage.set(disk.percent)

    app_requests.inc()

    return jsonify({
        "cpu": cpu,
        "ram": memory.percent,
        "disk": disk.percent,
        "uptime": round(time.time() - START_TIME, 2),
        "hostname": platform.node(),
        "platform": platform.system()
    })


@app.route("/metrics")
def prometheus_metrics():
    return Response(
        generate_latest(),
        mimetype=CONTENT_TYPE_LATEST
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
