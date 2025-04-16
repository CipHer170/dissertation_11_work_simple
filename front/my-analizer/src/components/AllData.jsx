import React, { useEffect, useState, useMemo } from "react";
import io from "socket.io-client";
// Commenting out Chart.js imports
/*
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
*/

export default function AllData({ onStopCapture }) {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCapturing, setIsCapturing] = useState(true);
  const logsPerPage = 20; // Количество записей на странице

  // Calculate statistics using useMemo to avoid unnecessary recalculations
  const statistics = useMemo(() => {
    const domainStats = {};
    const deviceStats = {
      totalDevices: new Set(),
      totalDataTransferred: 0,
    };

    logs.forEach((log) => {
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
        domainStats[log.domain].requestCount += 1;
      }
      domainStats[log.domain].dataTransferred += parseInt(log.length) || 0;

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
  }, [logs]);

  // Commenting out chart data preparation
  /*
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
  */

  useEffect(() => {
    // Загружаем старые логи при старте
    fetch("http://localhost:5000/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error("Ошибка загрузки логов:", err));

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

  // Расчет пагинации
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  // Изменение страницы
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Данные DNS трафика</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleStopCapture}
            className={`px-4 py-2 rounded ${
              isCapturing ? "bg-red-600 hover:bg-red-700" : "bg-gray-400"
            } text-white`}
            disabled={!isCapturing}
          >
            Остановить захват
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p>Данные пока не поступают...</p>
      ) : (
        <>
          {/* Combined Statistics and Logs Table */}
          <div className="mb-6  all-data">
            <h3 className="text-lg font-semibold mb-2">
              Статистика и логи DNS трафика
            </h3>
            <div className="overflow-x-auto table-data">
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Домен</th>
                    <th className="border px-2 py-1">IP-адрес</th>
                    <th className="border px-2 py-1">Время</th>
                    <th className="border px-2 py-1">Протокол</th>
                    <th className="border px-2 py-1">Длина (байт)</th>
                    <th className="border px-2 py-1">Количество запросов</th>
                    <th className="border px-2 py-1">Первый запрос</th>
                    <th className="border px-2 py-1">Последний запрос</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.domainStats).map(
                    ([domain, stats]) => {
                      // Find all logs for this domain
                      const domainLogs = logs.filter(
                        (log) => log.domain === domain
                      );

                      return domainLogs.map((log, index) => (
                        <tr
                          key={`${domain}-${index}`}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="border px-2 py-1">{domain}</td>
                          <td className="border px-2 py-1">{log.ip}</td>
                          <td className="border px-2 py-1">
                            {new Date(log.time).toLocaleDateString()}
                          </td>
                          <td className="border px-2 py-1">{log.protocol}</td>
                          <td className="border px-2 py-1">{log.length}</td>
                          <td className="border px-2 py-1">
                            {stats.requestCount}
                          </td>
                          <td className="border px-2 py-1">
                            {stats.firstSeen.slice(10, 19)}
                          </td>
                          <td className="border px-2 py-1">
                            {stats.lastSeen.slice(10, 19)}
                          </td>
                        </tr>
                      ));
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            <div className="flex justify-between items-center">
              <div>
                Страница {currentPage} из {totalPages} (всего записей:{" "}
                {logs.length})
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
          </div>
          {/* Commenting out Interactive Charts */}
          {/* <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <Pie data={chartData.domainActivityData} options={pieOptions} />
            </div>
            <div className="bg-white p-4 rounded shadow">
              <Bar data={chartData.dataTransferData} options={barOptions} />
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}
