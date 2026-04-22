const cityName = "Alexandroupoli, Greece";
const cityLat = 40.848;
const cityLng = 25.874;

const map = L.map("map").setView([cityLat, cityLng], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let currentLayer = null;
let autoRefreshInterval = null;

function getColorByTemperature(temp) {
  if (temp === null || temp === undefined || isNaN(temp)) return "#808080";
  if (temp >= 30) return "#d73027";
  if (temp >= 20) return "#fc8d59";
  if (temp >= 10) return "#fee08b";
  return "#4575b4";
}

function getRadiusByPressure(pressure) {
  if (pressure === null || pressure === undefined || isNaN(pressure)) return 12;
  return Math.max(10, Math.min(40, (pressure - 700) * 0.8));
}

function formatHour(datetimeString) {
  if (!datetimeString) return "-";

  const safeDate = new Date(datetimeString.replace(" ", "T"));
  if (Number.isNaN(safeDate.getTime())) {
    return "-";
  }

  return safeDate.toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderWeatherPoint(row) {
  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  const temp = parseFloat(row.t);
  const pressure = parseFloat(row.p);

  currentLayer = L.circleMarker([cityLat, cityLng], {
    radius: getRadiusByPressure(pressure),
    color: getColorByTemperature(temp),
    fillColor: getColorByTemperature(temp),
    fillOpacity: 0.65,
    weight: 2
  }).addTo(map);

  currentLayer.bindPopup(`
    <b>${cityName}</b><br>
    Date & Time: ${row.event_time}<br>
    Temperature: ${row.t ?? "-"} °C<br>
    Po: ${row.po ?? "-"}<br>
    P: ${row.p ?? "-"}
  `);

  currentLayer.openPopup();
}

function updateSummary(row, selectedDate) {
  document.getElementById("cityTitle").textContent = cityName;
  document.getElementById("selectedDateText").textContent = `Showing data for: ${selectedDate}`;
  document.getElementById("tempValue").textContent = row.t !== null && row.t !== undefined ? `${row.t} °C` : "-";
  document.getElementById("poValue").textContent = row.po ?? "-";
  document.getElementById("pValue").textContent = row.p ?? "-";
  document.getElementById("lastTimeValue").textContent = formatHour(row.event_time);
}

function renderTable(rows) {
  const tableBody = document.getElementById("weatherTableBody");
  tableBody.innerHTML = "";

  if (!rows || rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">No data found for this date.</td>
      </tr>
    `;
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.id ?? "-"}</td>
      <td>${row.event_time ?? "-"}</td>
      <td>${formatHour(row.event_time)}</td>
      <td>${row.t ?? "-"}</td>
      <td>${row.po ?? "-"}</td>
      <td>${row.p ?? "-"}</td>
    `;

    tableBody.appendChild(tr);
  });
}

async function loadWeatherForDate(date) {
  try {
    const response = await fetch(`get_weather.php?date=${encodeURIComponent(date)}`);
    const data = await response.json();

    if (data.error) {
      alert(data.error + (data.details ? " | " + data.details : ""));
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("selectedDateText").textContent = `Showing data for: ${date}`;
      document.getElementById("tempValue").textContent = "-";
      document.getElementById("poValue").textContent = "-";
      document.getElementById("pValue").textContent = "-";
      document.getElementById("lastTimeValue").textContent = "-";

      renderTable([]);

      if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
      }

      return;
    }

    const lastRow = data[data.length - 1];
    updateSummary(lastRow, date);
    renderWeatherPoint(lastRow);
    renderTable(data);

  } catch (error) {
    console.error("Error loading weather data:", error);
    alert("Failed to load weather data.");
  }
}

async function loadLatestDateAndWeather() {
  try {
    const response = await fetch("get_latest_date.php");
    const data = await response.json();

    if (data.error) {
      alert(data.error + (data.details ? " | " + data.details : ""));
      return;
    }

    const latestDate = data.latest_date;
    document.getElementById("datePicker").value = latestDate;
    await loadWeatherForDate(latestDate);

  } catch (error) {
    console.error("Error loading latest date:", error);
    alert("Failed to load latest date.");
  }
}

function changeDate(days) {
  const dateInput = document.getElementById("datePicker");
  if (!dateInput.value) return;

  const current = new Date(dateInput.value + "T00:00:00");
  current.setDate(current.getDate() + days);

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  const newDate = `${year}-${month}-${day}`;

  dateInput.value = newDate;
  loadWeatherForDate(newDate);
}

function showAbout() {
  alert(
    "Alexandroupoli Weather Dashboard\n\n" +
    "This project shows historical weather data for Alexandroupoli.\n\n" +
    "It uses MySQL, PHP, JavaScript and Leaflet.\n\n" +
    "Data source: rp5.ru"
  );
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(() => {
    const selectedDate = document.getElementById("datePicker").value;
    if (!selectedDate) return;

    loadWeatherForDate(selectedDate);
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadBtn");
  const prevDayBtn = document.getElementById("prevDayBtn");
  const nextDayBtn = document.getElementById("nextDayBtn");
  const datePicker = document.getElementById("datePicker");

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const selectedDate = datePicker.value;
      if (!selectedDate) {
        alert("Please select a date.");
        return;
      }
      loadWeatherForDate(selectedDate);
    });
  }

  if (datePicker) {
    datePicker.addEventListener("change", (e) => {
      if (e.target.value) {
        loadWeatherForDate(e.target.value);
      }
    });
  }

  if (prevDayBtn) {
    prevDayBtn.addEventListener("click", () => changeDate(-1));
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener("click", () => changeDate(1));
  }

  window.showAbout = showAbout;

  loadLatestDateAndWeather();
  startAutoRefresh();
});