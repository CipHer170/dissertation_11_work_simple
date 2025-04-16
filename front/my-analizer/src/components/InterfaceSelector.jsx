import React, { useState, useEffect, useCallback, useMemo } from "react";

export default function InterfaceSelector({ onStart, isCapturing, activeInterface }) {
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(isCapturing);

  // Update scanning state when isCapturing prop changes
  useEffect(() => {
    setIsScanning(isCapturing);
  }, [isCapturing]);

  useEffect(() => {
    // Fetch available network interfaces
    fetchInterfaces();
  }, []);

  const fetchInterfaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/interfaces");
      if (!res.ok) {
        throw new Error("Ошибка загрузки интерфейсов");
      }
      const data = await res.json();
      setInterfaces(data);
      setError(null);
    } catch (err) {
      console.error("Ошибка загрузки интерфейсов:", err);
      setError("Не удалось загрузить список интерфейсов");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInterfaceSelect = useCallback(async (interfaceName) => {
    // If already scanning with this interface, do nothing
    if (isScanning && activeInterface === interfaceName) {
      return;
    }

    // If scanning with a different interface, stop the current scan first
    if (isScanning) {
      try {
        const res = await fetch("http://localhost:5000/stop", {
          method: "POST",
        });
        
        if (!res.ok) {
          throw new Error("Ошибка остановки текущего захвата");
        }
        
        setIsScanning(false);
      } catch (err) {
        console.error("Ошибка остановки захвата:", err);
        setError("Ошибка остановки текущего захвата");
        return;
      }
    }

    // Start scanning with the new interface
    setIsScanning(true);
    
    try {
      const res = await fetch("http://localhost:5000/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interface: interfaceName }),
      });

      if (res.ok) {
        setError(null);
        onStart(interfaceName);
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка запуска захвата");
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Ошибка запуска захвата:", err);
      setError("Ошибка подключения к серверу");
      setIsScanning(false);
    }
  }, [isScanning, activeInterface, onStart]);

  const handleStopScanning = useCallback(async () => {
    if (!isScanning) return;
    
    try {
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      
      if (res.ok) {
        setIsScanning(false);
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка остановки захвата");
      }
    } catch (err) {
      console.error("Ошибка остановки захвата:", err);
      setError("Ошибка подключения к серверу");
    }
  }, [isScanning]);

  const handleRefreshInterfaces = useCallback(() => {
    fetchInterfaces();
  }, [fetchInterfaces]);

  // Memoize the interface buttons to prevent unnecessary re-renders
  const interfaceButtons = useMemo(() => {
    return interfaces.map((iface) => (
      <button
        key={iface.name}
        onClick={() => handleInterfaceSelect(iface.name)}
        className={`interface-button ${activeInterface === iface.name ? 'interface-button-active' : ''} ${isScanning && activeInterface === iface.name ? 'interface-button-scanning' : ''}`}
        disabled={isScanning && activeInterface !== iface.name}
      >
        <div className="interface-name">{iface.name}</div>
        <div className="interface-description">{iface.description || "Нет описания"}</div>
        {isScanning && activeInterface === iface.name && (
          <div className="interface-scanning-indicator">
            <span className="scanning-dot"></span>
            <span>Сканирование</span>
          </div>
        )}
      </button>
    ));
  }, [interfaces, activeInterface, isScanning, handleInterfaceSelect]);

  // Memoize the scanning status component
  const scanningStatus = useMemo(() => {
    if (!isScanning) return null;
    
    return (
      <div className="scanning-status">
        <span className="scanning-indicator"></span>
        <span>Сканирование активно</span>
        <button 
          onClick={handleStopScanning}
          className="button button-red"
        >
          Остановить
        </button>
      </div>
    );
  }, [isScanning, handleStopScanning]);

  // Memoize the stats cards
  const statsCards = useMemo(() => {
    return (
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-title">Доступно интерфейсов</div>
          <div className="stat-value">{interfaces.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Статус</div>
          <div className="stat-value">
            {isScanning ? "Активно" : "Неактивно"}
          </div>
        </div>
      </div>
    );
  }, [interfaces.length, isScanning]);

  return (
    <div>
      <div className="component-header">
        <h2 className="component-title">Выбор сетевого интерфейса</h2>
        <div className="component-actions">
          <button 
            onClick={handleRefreshInterfaces}
            className="button button-gray"
            disabled={loading}
          >
            Обновить
          </button>
          {scanningStatus}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading">Загрузка интерфейсов...</p>
        </div>
      ) : (
        <div>
          {error && (
            <div className="notification notification-yellow">
              <p>{error}</p>
            </div>
          )}

          {statsCards}

          <div className="interface-buttons">
            {interfaceButtons}
          </div>

          {interfaces.length === 0 && (
            <p className="empty-state">Интерфейсы не найдены</p>
          )}
        </div>
      )}
    </div>
  );
}
