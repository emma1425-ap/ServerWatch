const API_URL = "/api/metrics";

const elements = {
    cpu: document.getElementById("cpu-value"),
    ram: document.getElementById("ram-value"),
    disk: document.getElementById("disk-value"),
    uptime: document.getElementById("uptime-value"),
    hostname: document.getElementById("hostname"),
    platform: document.getElementById("platform"),
    status: document.getElementById("connection-status"),
    cpuBar: document.getElementById("cpu-bar"),
    ramBar: document.getElementById("ram-bar"),
    diskBar: document.getElementById("disk-bar")
};

const history = {
    labels: [],
    cpu: [],
    ram: [],
    disk: []
};

const chartCanvas = document.getElementById("performanceChart");

let performanceChart = null;

if (chartCanvas) {
    performanceChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: history.labels,
            datasets: [
                {
                    label: "CPU",
                    data: history.cpu,
                    borderColor: "#8b5cf6",
                    backgroundColor: "rgba(139, 92, 246, 0.12)",
                    fill: true,
                    tension: 0.4
                },
                {
                    label: "RAM",
                    data: history.ram,
                    borderColor: "#06b6d4",
                    backgroundColor: "rgba(6, 182, 212, 0.08)",
                    fill: true,
                    tension: 0.4
                },
                {
                    label: "Disk",
                    data: history.disk,
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#a1a1aa"
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#71717a" },
                    grid: { display: false }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: "#71717a",
                        callback: value => value + "%"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.06)"
                    }
                }
            }
        }
    });
}

function updateValue(element, value, suffix = "%") {
    if (element) {
        element.textContent = `${Number(value).toFixed(1)}${suffix}`;
    }
}

function updateBar(element, value) {
    if (element) {
        element.style.width = `${Math.min(100, Math.max(0, value))}%`;
    }
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}j ${hours}h ${minutes}min`;
}

function updateChart(data) {
    const now = new Date().toLocaleTimeString();

    history.labels.push(now);
    history.cpu.push(data.cpu);
    history.ram.push(data.ram);
    history.disk.push(data.disk);

    if (history.labels.length > 15) {
        history.labels.shift();
        history.cpu.shift();
        history.ram.shift();
        history.disk.shift();
    }

    if (performanceChart) {
        performanceChart.update();
    }
}

async function fetchMetrics() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Erreur serveur");
        }

        const data = await response.json();

        updateValue(elements.cpu, data.cpu);
        updateValue(elements.ram, data.ram);
        updateValue(elements.disk, data.disk);

        if (elements.uptime) {
            elements.uptime.textContent = formatUptime(data.uptime);
        }

        if (elements.hostname) {
            elements.hostname.textContent = data.hostname;
        }

        if (elements.platform) {
            elements.platform.textContent = data.platform;
        }

        updateBar(elements.cpuBar, data.cpu);
        updateBar(elements.ramBar, data.ram);
        updateBar(elements.diskBar, data.disk);

        updateChart(data);

        if (elements.status) {
            elements.status.textContent = "Connected";
        }

    } catch (error) {
        console.error("ServerWatch:", error);

        if (elements.status) {
            elements.status.textContent = "Disconnected";
        }
    }
}

fetchMetrics();
setInterval(fetchMetrics, 5000);