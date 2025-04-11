import React, { useEffect, useState } from "react";
import io from "socket.io-client";

export default function AllData({ onStopCapture }) {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCapturing, setIsCapturing] = useState(true);
  const logsPerPage = 20; // Количество записей на странице

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
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
            <button
              onClick={onStopCapture}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Сменить интерфейс
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p>Данные пока не поступают...</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
