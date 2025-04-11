import React, { useEffect, useState, useMemo } from "react";
import io from "socket.io-client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function AllData({ onStopCapture }) {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCapturing, setIsCapturing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const logsPerPage = 20;

  // Filter states
  const [filters, setFilters] = useState({
    domain: "",
    minDataSize: "",
    maxDataSize: "",
    startDate: "",
    endDate: "",
    activeOnly: false,
  });

  // Function to load logs from the server
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/logs");
      const data = await res.json();
      setLogs(data);
      console.log("Логи успешно загружены");
    } catch (err) {
      console.error("Ошибка загрузки логов:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs based on current filter settings
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Domain filter
      if (filters.domain && !log.domain.includes(filters.domain)) {
        return false;
      }

      // Data size filters
      const dataSize = parseInt(log.length) || 0;
      if (filters.minDataSize && dataSize < parseInt(filters.minDataSize)) {
        return false;
      }
      if (filters.maxDataSize && dataSize > parseInt(filters.maxDataSize)) {
        return false;
      }

      // Date filters
      if (filters.startDate && log.time < filters.startDate) {
        return false;
      }
      if (filters.endDate && log.time > filters.endDate) {
        return false;
      }

      // Active only filter (domains with recent activity)
      if (filters.activeOnly) {
        const now = new Date();
        const logTime = new Date(log.time);
        const hoursDiff = (now - logTime) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          // Consider active if within last 24 hours
          return false;
        }
      }

      return true;
    });
  }, [logs, filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      domain: "",
      minDataSize: "",
      maxDataSize: "",
      startDate: "",
      endDate: "",
      activeOnly: false,
    });
    // Reset to first page when filters are reset
    setCurrentPage(1);
  };

  // Calculate statistics using useMemo to avoid unnecessary recalculations
  const statistics = useMemo(() => {
    const domainStats = {};
    const deviceStats = {
      totalDevices: new Set(),
      totalDataTransferred: 0,
    };

    filteredLogs.forEach((log) => {
      // Domain statistics
      if (!domainStats[log.domain]) {
        domainStats[log.domain] = {
          firstSeen: log.time,
          lastSeen: log.time,
          dataTransferred: 0,
          requestCount: 0,
        };
      } else {
        domainStats[log.domain].lastSeen = log.time;
      }
      domainStats[log.domain].dataTransferred += parseInt(log.length) || 0;
      domainStats[log.domain].requestCount += 1;

      // Device statistics
      deviceStats.totalDevices.add(log.ip);
      deviceStats.totalDataTransferred += parseInt(log.length) || 0;
    });

    return {
      domainStats,
      deviceStats: {
        totalDevices: deviceStats.totalDevices.size,
        totalDataTransferred: deviceStats.totalDataTransferred,
      },
    };
  }, [filteredLogs]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Data for domain activity duration chart
    const domainActivityData = {
      labels: Object.keys(statistics.domainStats),
      datasets: [
        {
          label: "Количество запросов",
          data: Object.values(statistics.domainStats).map(
            (stats) => stats.requestCount
          ),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(199, 199, 199, 0.6)",
            "rgba(83, 102, 255, 0.6)",
            "rgba(255, 99, 255, 0.6)",
            "rgba(255, 159, 159, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(199, 199, 199, 1)",
            "rgba(83, 102, 255, 1)",
            "rgba(255, 99, 255, 1)",
            "rgba(255, 159, 159, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    // Data for data transfer volume chart
    const dataTransferData = {
      labels: Object.keys(statistics.domainStats),
      datasets: [
        {
          label: "Объем данных (байт)",
          data: Object.values(statistics.domainStats).map(
            (stats) => stats.dataTransferred
          ),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    return {
      domainActivityData,
      dataTransferData,
    };
  }, [statistics]);

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Распределение запросов по доменам",
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Объем данных по доменам",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Байты",
        },
      },
      x: {
        title: {
          display: true,
          text: "Домены",
        },
      },
    },
  };

  useEffect(() => {
    // Загружаем старые логи при старте
    loadLogs();

    // Подключаемся к WebSocket
    const socket = io("http://localhost:5000");

    // Слушаем новые логи
    socket.on("new_log", (newLog) => {
      setLogs((prevLogs) => [...prevLogs.slice(-999), newLog]); // ограничение 1000 записей
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Функция для остановки захвата
  const handleStopCapture = async () => {
    try {
      setIsCapturing(false);
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      if (res.ok) {
        console.log("Захват остановлен");
      } else {
        console.error("Ошибка остановки захвата");
      }
    } catch (err) {
      console.error("Ошибка подключения к API:", err);
    }
  };

  // Calculation of pagination should be done after filtering
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredLogs, currentPage, totalPages]);

  // Изменение страницы
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[1000px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Данные DNS трафика</h2>
          <div className="flex space-x-2">
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className={`px-4 py-2 rounded ${
                isLoading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isLoading ? "Загрузка..." : "Обновить данные"}
            </button>
            <button
              onClick={handleStopCapture}
              className={`px-4 py-2 rounded ${
                isCapturing ? "bg-red-600 hover:bg-red-700" : "bg-gray-400"
              } text-white`}
              disabled={!isCapturing}
            >
              Остановить захват
            </button>
            <button
              onClick={onStopCapture}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Сменить интерфейс
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Фильтры</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Домен
              </label>
              <input
                type="text"
                name="domain"
                value={filters.domain}
                onChange={handleFilterChange}
                placeholder="Фильтр по домену"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Размер данных (байт)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minDataSize"
                  value={filters.minDataSize}
                  onChange={handleFilterChange}
                  placeholder="Мин"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  name="maxDataSize"
                  value={filters.maxDataSize}
                  onChange={handleFilterChange}
                  placeholder="Макс"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Период
              </label>
              <div className="flex space-x-2">
                <input
                  type="datetime-local"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="datetime-local"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activeOnly"
                name="activeOnly"
                checked={filters.activeOnly}
                onChange={handleFilterChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="activeOnly"
                className="ml-2 block text-sm text-gray-700"
              >
                Только активные домены (за последние 24 часа)
              </label>
            </div>
            <button
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
            >
              Сбросить фильтры
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Показано: {filteredLogs.length} из {logs.length} записей
          </div>
        </div>

        {logs.length === 0 ? (
          <p>Данные пока не поступают...</p>
        ) : filteredLogs.length === 0 ? (
          <p>Нет данных, соответствующих выбранным фильтрам</p>
        ) : (
          <>
            {/* Interactive Charts */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <Pie data={chartData.domainActivityData} options={pieOptions} />
              </div>
              <div className="bg-white p-4 rounded shadow">
                <Bar data={chartData.dataTransferData} options={barOptions} />
              </div>
            </div>

            {/* Statistics Tables */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Статистика по доменам
              </h3>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Домен</th>
                    <th className="border px-2 py-1">Первый запрос</th>
                    <th className="border px-2 py-1">Последний запрос</th>
                    <th className="border px-2 py-1">Количество запросов</th>
                    <th className="border px-2 py-1">Объем данных (байт)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.domainStats).map(
                    ([domain, stats]) => (
                      <tr key={domain}>
                        <td className="border px-2 py-1">{domain}</td>
                        <td className="border px-2 py-1">{stats.firstSeen}</td>
                        <td className="border px-2 py-1">{stats.lastSeen}</td>
                        <td className="border px-2 py-1">
                          {stats.requestCount}
                        </td>
                        <td className="border px-2 py-1">
                          {stats.dataTransferred}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              <h3 className="text-lg font-semibold mb-2">Общая статистика</h3>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Показатель</th>
                    <th className="border px-2 py-1">Значение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">
                      Количество уникальных устройств
                    </td>
                    <td className="border px-2 py-1">
                      {statistics.deviceStats.totalDevices}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">
                      Общий объем переданных данных
                    </td>
                    <td className="border px-2 py-1">
                      {statistics.deviceStats.totalDataTransferred} байт
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Время</th>
                  <th className="border px-2 py-1">IP-адрес</th>
                  <th className="border px-2 py-1">Домен</th>
                  <th className="border px-2 py-1">Протокол</th>
                  <th className="border px-2 py-1">Длина</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1">{log.time}</td>
                    <td className="border px-2 py-1">{log.ip}</td>
                    <td className="border px-2 py-1">{log.domain}</td>
                    <td className="border px-2 py-1">{log.protocol}</td>
                    <td className="border px-2 py-1">{log.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Пагинация */}
            <div className="flex justify-between items-center">
              <div>
                Страница {currentPage} из {totalPages} (всего записей:{" "}
                {filteredLogs.length})
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  &laquo;
                </button>

                {/* Отображаем номера страниц */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Логика для показа страниц вокруг текущей
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNum
                          ? "bg-blue-800 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
