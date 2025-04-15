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

  const handleInterfaceClick = async (interfaceName) => {
    setSelected(interfaceName);
    try {
      const res = await fetch("http://localhost:5000/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: interfaceName }),
      });
      if (res.ok) onStart();
      else console.error("Ошибка запуска захвата");
    } catch (err) {
      console.error("Ошибка подключения к API:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Сетевой интерфейс</h2>
        <div className="flex gap-2">
          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interfaces.map((intf, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selected === intf.name
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => handleInterfaceClick(intf.name)}
                >
                  {intf.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
