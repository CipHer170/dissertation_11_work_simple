import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from '../contexts/LanguageContext';

export default function InterfaceSelector({ onStart, isCapturing, activeInterface }) {
  const { t } = useLanguage();
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
        throw new Error(t('messages.interfaceError'));
      }
      const data = await res.json();
      setInterfaces(data);
      setError(null);
    } catch (err) {
      console.error("Ошибка загрузки интерфейсов:", err);
      setError(t('messages.interfaceError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
          throw new Error(t('messages.errorStopCapture'));
        }
        
        setIsScanning(false);
      } catch (err) {
        console.error("Ошибка остановки захвата:", err);
        setError(t('messages.errorStopCapture'));
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
        setError(data.error || t('messages.errorCapture'));
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Ошибка запуска захвата:", err);
      setError(t('messages.errorCapture'));
      setIsScanning(false);
    }
  }, [isScanning, activeInterface, onStart, t]);

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
        setError(data.error || t('messages.errorStopCapture'));
      }
    } catch (err) {
      console.error("Ошибка остановки захвата:", err);
      setError(t('messages.errorStopCapture'));
    }
  }, [isScanning, t]);

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
        <div className="interface-description">{iface.description || t('messages.nodescription')}</div>
        {isScanning && activeInterface === iface.name && (
          <div className="interface-scanning-indicator">
            <span className="scanning-dot"></span>
            <span>{t('messages.scanning')}</span>
          </div>
        )}
      </button>
    ));
  }, [interfaces, activeInterface, isScanning, handleInterfaceSelect, t]);

  // Memoize the scanning status component
  const scanningStatus = useMemo(() => {
    if (!isScanning) return null;
    
    return (
      <div className="scanning-status">
        <span className="scanning-indicator"></span>
        <span>{t('messages.scanningActive')}</span>
        <button 
          onClick={handleStopScanning}
          className="button button-red"
        >
          {t('buttons.stop')}
        </button>
      </div>
    );
  }, [isScanning, handleStopScanning, t]);

  // Memoize the stats cards
  const statsCards = useMemo(() => {
    return (
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-title">{t('headers.interface')}</div>
          <div className="stat-value">{interfaces.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">{t('headers.status')}</div>
          <div className="stat-value">
            {isScanning ? t('messages.active') : t('messages.inactive')}
          </div>
        </div>
      </div>
    );
  }, [interfaces.length, isScanning, t]);

  if (loading) {
    return <div className="loading">{t('messages.loadingInterfaces')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (interfaces.length === 0) {
    return <div className="no-data">{t('messages.noInterface')}</div>;
  }

  return (
    <div>
      <div className="component-header">
        <h2 className="component-title">{t('titles.interfaces')}</h2>
        <div className="component-actions">
          <button 
            onClick={handleRefreshInterfaces}
            className="button button-gray"
            disabled={loading}
          >
            {t('buttons.refresh')}
          </button>
          {scanningStatus}
        </div>
      </div>

      {statsCards}

      <div className="interface-buttons">
        {interfaceButtons}
      </div>
    </div>
  );
}
