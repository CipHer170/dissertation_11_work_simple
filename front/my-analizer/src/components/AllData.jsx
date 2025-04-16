import React, { useEffect, useState, useMemo, useCallback } from "react";
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

export default function AllData({ onStopCapture, selectedDomains, allDomains }) {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCapturing, setIsCapturing] = useState(true);
  const logsPerPage = 20; // Количество записей на странице
  const [loading, setLoading] = useState(true);
  const [showAllData, setShowAllData] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null); // State for selected IP

  // Filter logs to show all domains except those that are selected
  const filteredLogs = useMemo(() => {
    return showAllData 
      ? logs 
      : logs.filter(log => {
          // If no domains are selected, show all logs
          const anySelected = Object.values(selectedDomains).some(value => value);
          if (!anySelected) return true;
          
          // Otherwise, show logs for domains that are NOT selected
          return selectedDomains[log.domain] !== true;
        });
  }, [logs, selectedDomains, showAllData]);

  // Filter by selected IP if one is selected
  const ipFilteredLogs = useMemo(() => {
    return selectedIp
      ? filteredLogs.filter(log => log.ip === selectedIp)
      : filteredLogs;
  }, [filteredLogs, selectedIp]);

  // Calculate statistics using useMemo to avoid unnecessary recalculations
  const statistics = useMemo(() => {
    const domainStats = {};
    const uniqueIPs = new Set(); // Track unique IPs

    // Use filteredLogs instead of logs for statistics
    ipFilteredLogs.forEach((log) => {
      // Add IP to unique IPs set
      uniqueIPs.add(log.ip);

      // Domain statistics
      if (!domainStats[log.domain]) {
        domainStats[log.domain] = {
          firstSeen: log.time,
          lastSeen: log.time,
          dataTransferred: 0,
          requestCount: 0,
          latestLog: log, // Store the latest log for this domain
        };
      } else {
        // Update last seen time if this log is more recent
        if (new Date(log.time) > new Date(domainStats[log.domain].lastSeen)) {
          domainStats[log.domain].lastSeen = log.time;
          domainStats[log.domain].latestLog = log; // Update the latest log
        }
        domainStats[log.domain].requestCount += 1;
      }
      domainStats[log.domain].dataTransferred += parseInt(log.length) || 0;
    });

    // Get top 10 domains
    const top10Domains = Object.entries(domainStats)
      .sort(([, a], [, b]) => b.requestCount - a.requestCount)
      .slice(0, 10);

    // Calculate statistics for top 10 only
    const top10Stats = {
      totalRequests: top10Domains.reduce((acc, [, stats]) => acc + stats.requestCount, 0),
      totalDataTransferred: top10Domains.reduce((acc, [, stats]) => acc + stats.dataTransferred, 0),
      uniqueIPs: new Set(top10Domains.map(([, stats]) => stats.latestLog.ip)).size
    };

    return {
      domainStats,
      deviceStats: {
        totalDevices: uniqueIPs.size,
        totalDataTransferred: Object.values(domainStats).reduce((acc, curr) => acc + curr.dataTransferred, 0),
      },
      top10Stats
    };
  }, [ipFilteredLogs]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Get top 10 domains by request count
    const topDomains = Object.entries(statistics.domainStats)
      .sort(([, a], [, b]) => b.requestCount - a.requestCount)
      .slice(0, 10);

    // Data for domain activity duration chart (top 10)
    const domainActivityData = {
      labels: topDomains.map(([domain]) => domain),
      datasets: [
        {
          label: "Количество запросов",
          data: topDomains.map(([, stats]) => stats.requestCount),
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
  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 12
          },
          boxWidth: 15,
          padding: 15
        }
      },
      title: {
        display: true,
        text: "Топ-10 доменов по количеству запросов",
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value * 100) / total);
            const domainStats = statistics.domainStats[label];
            const dataLength = domainStats ? domainStats.dataTransferred : 0;
            const dataLengthKB = (dataLength / 1024).toFixed(2);
            return [
              `${label}:`,
              `Запросов: ${value} (${percentage}%)`,
              `Объем данных: ${dataLengthKB} KB`
            ];
          }
        },
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 12
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  }), [statistics.domainStats]);

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

  // Generate a consistent color for an IP address with memoized colors array
  const ipColors = useMemo(() => [
    '#FFB6B6', // Light Red
    '#C4EDEA', // Light Teal
    '#B6E2F0', // Light Blue
    '#C5E8D5', // Light Green
    '#FFF4CC', // Light Yellow
    '#F0D6D6', // Light Pink
    '#E1D2F0', // Light Purple
    '#BDE5FF', // Light Sky Blue
    '#FFDEBF', // Light Orange
    '#C6F4D4', // Light Mint
    '#BEE9E4', // Light Aqua
    '#FFEAA8', // Light Mustard
    '#FFCACA', // Light Coral
    '#C5D1E1', // Light Slate
    '#C1E7D9', // Light Seafoam
    '#C9EBD0', // Light Sage
    '#C9E3F5', // Light Azure
    '#E8D6F0', // Light Lavender
    '#FFE2B8', // Light Peach
    '#F8D8C0', // Light Salmon
  ], []);

  const getIpColor = useCallback((ip) => {
    // Simple hash function to generate a consistent index
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ip.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use absolute value to ensure positive index
    const index = Math.abs(hash) % ipColors.length;
    return ipColors[index];
  }, [ipColors]);

  // Track unique IPs for coloring
  const uniqueIpColors = useMemo(() => {
    const ipColorMap = {};
    const processedIps = new Set();
    
    ipFilteredLogs.forEach(log => {
      if (!processedIps.has(log.ip)) {
        ipColorMap[log.ip] = getIpColor(log.ip);
        processedIps.add(log.ip);
      }
    });
    return ipColorMap;
  }, [ipFilteredLogs, getIpColor]);

  // Handle IP selection with debounce
  const handleIpClick = useCallback((ip) => {
    if (selectedIp === ip) {
      setSelectedIp(null); // Deselect if already selected
    } else {
      setSelectedIp(ip);
      setCurrentPage(1); // Reset to first page when filtering
    }
  }, [selectedIp]);

  // Memoize the IP legend component to prevent unnecessary rerenders
  const IpLegend = useMemo(() => {
    const ipEntries = Object.entries(uniqueIpColors)
      .sort(([ipA], [ipB]) => ipA.localeCompare(ipB));
      
    return (
      <div className="ip-legend">
        <div className="ip-legend-header">IP-адреса:</div>
        {ipEntries.map(([ip, color]) => (
          <div 
            key={ip} 
            className={`ip-legend-item ${selectedIp === ip ? 'ip-legend-item-selected' : ''}`}
            onClick={() => handleIpClick(ip)}
          >
            <div 
              className="ip-legend-color" 
              style={{ backgroundColor: color }}
            ></div>
            <div className="ip-legend-text">{ip}</div>
          </div>
        ))}
      </div>
    );
  }, [uniqueIpColors, selectedIp, handleIpClick]);

  useEffect(() => {
    // Загружаем старые логи при старте
    fetchLogs();

    // Подключаемся к WebSocket
    const socket = io("http://localhost:5000");

    // Слушаем новые логи
    socket.on("new_log", (newLog) => {
      setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 999)]); // Add new log at the beginning
    });

    // Set up automatic refresh interval
    const refreshInterval = setInterval(() => {
      fetchLogs();
    }, 10000); // 10 seconds

    return () => {
      socket.disconnect();
      clearInterval(refreshInterval); // Clean up interval on component unmount
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/logs");
      const data = await res.json();
      // Sort logs by time in descending order (newest first)
      const sortedData = data.sort((a, b) => new Date(b.time) - new Date(a.time));
      setLogs(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки логов:", err);
      setLoading(false);
    }
  };

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

  const handleUpdate = () => {
    setShowAllData(true);
    fetchLogs();
  };

  // Расчет пагинации
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  
  // Get unique domains with their latest data and request counts
  const uniqueDomains = Object.entries(statistics.domainStats)
    .map(([domain, stats]) => ({
      domain,
      ...stats,
      log: stats.latestLog // Use the latest log for this domain
    }))
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)); // Sort by last seen time (newest first)
  
  const currentDomains = uniqueDomains.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(uniqueDomains.length / logsPerPage);

  // Изменение страницы
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div>
      <div className="component-header">
        <h2 className="component-title">Данные DNS трафика</h2>
        <div className="component-actions">
          <button
            onClick={handleUpdate}
            className="button button-blue"
          >
            Обновить данные
          </button>
          <button
            onClick={handleStopCapture}
            className={`button ${isCapturing ? "button-red" : "button-gray"}`}
            disabled={!isCapturing}
          >
            Остановить захват
          </button>
          {selectedIp && (
            <button
              onClick={() => setSelectedIp(null)}
              className="button button-gray"
            >
              Сбросить фильтр IP
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="loading">Загрузка данных...</p>
      ) : (
        <>
         <div className="stats-container">
            <div className="stat-card">
              <div className="stat-title">Всего доменов</div>
              <div className="stat-value">{Object.keys(statistics.domainStats).length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Всего устройств</div>
              <div className="stat-value">{statistics.deviceStats.totalDevices}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Общий объем данных</div>
              <div className="stat-value">{(statistics.deviceStats.totalDataTransferred / 1024).toFixed(2)} KB</div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Домен</th>
                  <th>IP-адрес</th>
                  <th>Время</th>
                  <th>Протокол</th>
                  <th>Длина (байт)</th>
                  <th>Количество запросов</th>
                  <th>Первый запрос</th>
                  <th>Последний запрос</th>
                </tr>
              </thead>
              <tbody>
                {currentDomains.map((domainData) => (
                  <tr 
                    key={domainData.domain}
                    className={`ip-row ${selectedIp === domainData.log.ip ? 'ip-row-selected' : ''}`}
                    style={{
                      borderLeft: `4px solid ${uniqueIpColors[domainData.log.ip] || '#e5e7eb'}`,
                      boxShadow: selectedIp === domainData.log.ip ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <td>{domainData.domain}</td>
                    <td 
                      className="ip-cell" 
                      style={{ 
                        backgroundColor: uniqueIpColors[domainData.log.ip] || '#f9fafb',
                        borderColor: selectedIp === domainData.log.ip ? '#3b82f6' : 'rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleIpClick(domainData.log.ip)}
                    >
                      {domainData.log.ip}
                    </td>
                    <td>{new Date(domainData.log.time).toLocaleDateString()}</td>
                    <td>{domainData.log.protocol}</td>
                    <td>{domainData.log.length}</td>
                    <td>{domainData.requestCount}</td>
                    <td>{domainData.firstSeen.slice(10, 19)}</td>
                    <td>{domainData.lastSeen.slice(10, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* IP Legend */}
            {IpLegend}
          </div>

          {/* Пагинация */}
          <div className="pagination">
            <div className="pagination-info">
              Страница {currentPage} из {totalPages} (всего записей:{" "}
              {uniqueDomains.length})
            </div>
            <div className="pagination-buttons">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`pagination-button ${currentPage === 1 ? "pagination-button-disabled" : ""}`}
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
                    className={`pagination-button ${currentPage === pageNum ? "pagination-button-active" : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`pagination-button ${currentPage === totalPages ? "pagination-button-disabled" : ""}`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </>
      )}

          {/* Charts */}
          <div className="charts-container">
            <div className="chart-wrapper">
              {loading ? (
                <div className="chart-loading">
                  <div className="loading-spinner"></div>
                  <p>Загрузка данных для графика...</p>
                </div>
              ) : chartData.domainActivityData.datasets[0].data.length === 0 ? (
                <div className="chart-empty">
                  <p>Нет данных для отображения</p>
                </div>
              ) : (
                <Pie 
                  data={chartData.domainActivityData} 
                  options={pieOptions}
                  redraw={false}
                />
              )}
            </div>
            <div className="chart-extraInfo">
              <div className="chart-stats-header">
                <h3>Статистика по топ-10 доменам</h3>
                <div className="chart-stats-refresh">
                  <span className="refresh-time">Обновлено: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div className="chart-stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Всего запросов</div>
                    <div className="stat-value">{statistics.top10Stats.totalRequests}</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon">💾</div>
                  <div className="stat-content">
                    <div className="stat-label">Общий объем данных</div>
                    <div className="stat-value">{(statistics.top10Stats.totalDataTransferred / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon">🌐</div>
                  <div className="stat-content">
                    <div className="stat-label">Уникальных IP</div>
                    <div className="stat-value">{statistics.top10Stats.uniqueIPs}</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-label">Средний размер запроса</div>
                    <div className="stat-value">
                      {(statistics.top10Stats.totalDataTransferred / 
                        (statistics.top10Stats.totalRequests || 1)).toFixed(2)} байт
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="chart-stats-details">
                <h4>Топ-3 домена по запросам:</h4>
                <div className="top-domains-list">
                  {Object.entries(statistics.domainStats)
                    .sort(([, a], [, b]) => b.requestCount - a.requestCount)
                    .slice(0, 3)
                    .map(([domain, stats], index) => (
                      <div key={domain} className="top-domain-item">
                        <div className="domain-rank">#{index + 1}</div>
                        <div className="domain-info">
                          <div className="domain-name">{domain}</div>
                          <div className="domain-stats">
                            <span>{stats.requestCount} запросов</span>
                            <span>•</span>
                            <span>{(stats.dataTransferred / 1024).toFixed(2)} KB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

      {showAllData && (
        <div className="notification notification-yellow">
          <p>
            Отображаются все данные
          </p>
        </div>
      )}
    </div>
  );
}
