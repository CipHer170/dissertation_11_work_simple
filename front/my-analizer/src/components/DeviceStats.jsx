import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Bar } from 'react-chartjs-2';

export default function DeviceStats() {
  const { t } = useLanguage();
  const [deviceStats, setDeviceStats] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceStats();
    const interval = setInterval(fetchDeviceStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeviceStats = async () => {
    try {
      const response = await fetch('/device-stats');
      if (!response.ok) throw new Error('Failed to fetch device stats');
      const data = await response.json();
      setDeviceStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching device stats:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getProtocolChartData = (protocols) => {
    return {
      labels: Object.keys(protocols),
      datasets: [{
        label: t('statistics.protocolUsage'),
        data: Object.values(protocols),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  };

  return (
    <div className="device-stats-container">
      <h2>{t('statistics.deviceTraffic')}</h2>
      
      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : (
        <div className="device-stats-grid">
          {Object.entries(deviceStats).map(([ip, stats]) => (
            <div 
              key={ip} 
              className={`device-card ${selectedDevice === ip ? 'selected' : ''}`}
              onClick={() => setSelectedDevice(ip)}
            >
              <h3>{ip}</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.totalDataReceived')}</span>
                  <span className="stat-value">{formatBytes(stats.total_bytes_received)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.totalDataSent')}</span>
                  <span className="stat-value">{formatBytes(stats.total_bytes_sent)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.packetsReceived')}</span>
                  <span className="stat-value">{stats.packets_received}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.packetsSent')}</span>
                  <span className="stat-value">{stats.packets_sent}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.activeConnections')}</span>
                  <span className="stat-value">{stats.active_connections}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.firstSeen')}</span>
                  <span className="stat-value">{new Date(stats.first_seen).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('statistics.lastSeen')}</span>
                  <span className="stat-value">{new Date(stats.last_seen).toLocaleString()}</span>
                </div>
              </div>
              
              {selectedDevice === ip && (
                <div className="protocol-chart">
                  <Bar 
                    data={getProtocolChartData(stats.protocols)}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: t('statistics.protocolDistribution')
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 