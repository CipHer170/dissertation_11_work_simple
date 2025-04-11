import React, { useState, useEffect } from "react";

export default function InterfaceSelector({ onStart }) {
  const [interfaces, setInterfaces] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/interfaces")
      .then((res) => res.json())
      .then((data) => {
        setInterfaces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки интерфейсов:", err);
        setLoading(false);
      });
  }, []);

  const handleStart = async () => {
    if (!selected) {
      console.error("Нет выбранного интерфейса");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selected }),
      });
      if (res.ok) onStart();
      else console.error("Ошибка запуска захвата");
    } catch (err) {
      console.error("Ошибка подключения к API:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">Выберите сетевой интерфейс</h2>
        {loading ? (
          <p>Загрузка интерфейсов...</p>
        ) : (
          <>
            <select
              className="w-full border p-2 rounded mb-4"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {interfaces.map((intf, i) => (
                <option key={i} value={intf.name}>
                  {intf.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleStart}
              disabled={!selected}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              🚀 Начать захват
            </button>
          </>
        )}
      </div>
    </div>
  );
}
