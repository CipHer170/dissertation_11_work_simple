import React, { useEffect, useState } from "react";
import io from "socket.io-client";

export default function AllData() {
  const [logs, setLogs] = useState([]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Данные DNS трафика</h2>
        {logs.length === 0 ? (
          <p>Данные пока не поступают...</p>
        ) : (
          <table className="w-full text-sm border-collapse">
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
              {logs.map((log, index) => (
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
        )}
      </div>
    </div>
  );
}
