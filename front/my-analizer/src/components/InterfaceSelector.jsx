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
    setSelected(interfaceName); // Устанавливаем выбранный интерфейс
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
    <div className="interfaces ">
      <h2 className="interfaces__title">Выберите сетевой интерфейс</h2>
      <div className="interfaces__list ">
        {loading ? (
          <p className="interfces__loading">Загрузка интерфейсов...</p>
        ) : (
          <>
            {/* Список ссылок без кнопки */}
            {interfaces.map((intf, i) => (
              <button
                id={i}
                className={`interfaces__id ${
                  selected === intf.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => handleInterfaceClick(intf.name)}
              >
                {intf.name}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
