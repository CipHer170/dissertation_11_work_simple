import React, { useState, useEffect } from "react";
import io from "socket.io-client";

export default function DomainList({ selectedDomains, allDomains, onSelectionChange, onSaveSelection }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [domains, setDomains] = useState([]);

  // Initialize domains from props
  useEffect(() => {
    setDomains(allDomains);
    setLoading(false);
  }, [allDomains]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const socket = io("http://localhost:5000");
    
    socket.on("new_log", (newLog) => {
      // Check if this is a new domain
      if (!domains.includes(newLog.domain)) {
        // Add the new domain to the list
        const updatedDomains = [...domains, newLog.domain];
        setDomains(updatedDomains);
        
        // Update selected state for the new domain
        onSelectionChange({
          ...selectedDomains,
          [newLog.domain]: false
        });
      }
    });

    // Set up automatic refresh interval
    const refreshInterval = setInterval(() => {
      fetchDomains();
    }, 10000); // 10 seconds

    return () => {
      socket.disconnect();
      clearInterval(refreshInterval); // Clean up interval on component unmount
    };
  }, [domains, selectedDomains, onSelectionChange]);

  const fetchDomains = async () => {
    try {
      const res = await fetch("http://localhost:5000/logs");
      const data = await res.json();
      
      // Extract unique domains
      const uniqueDomains = [...new Set(data.map(log => log.domain))];
      
      // Only update if there are new domains
      if (uniqueDomains.length !== domains.length) {
        setDomains(uniqueDomains);
        
        // Update selected state for new domains
        const updatedSelected = { ...selectedDomains };
        uniqueDomains.forEach(domain => {
          if (!(domain in updatedSelected)) {
            updatedSelected[domain] = false;
          }
        });
        onSelectionChange(updatedSelected);
      }
    } catch (err) {
      console.error("Ошибка загрузки доменов:", err);
    }
  };

  const handleCheckboxChange = (domain) => {
    const updatedSelected = {
      ...selectedDomains,
      [domain]: !selectedDomains[domain]
    };
    onSelectionChange(updatedSelected);
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedDomains).every(value => value);
    
    const updatedSelected = {};
    domains.forEach(domain => {
      updatedSelected[domain] = !allSelected;
    });
    
    onSelectionChange(updatedSelected);
  };

  const handleSaveSelection = () => {
    onSaveSelection();
  };

  const filteredDomains = domains.filter(domain => 
    domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="component-header">
        <h2 className="component-title">Список доменов</h2>
        <div className="component-actions">
          <input
            type="text"
            placeholder="Поиск доменов..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleSelectAll}
            className="button button-blue"
          >
            {Object.values(selectedDomains).every(value => value) 
              ? "Снять выделение" 
              : "Выбрать все"}
          </button>
          <button
            onClick={handleSaveSelection}
            className="button button-green"
          >
            Сохранить выбор
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Загрузка доменов...</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th className="w-10">Выбрать</th>
                <th>Домен</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((domain, index) => (
                <tr key={domain}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedDomains[domain] || false}
                      onChange={() => handleCheckboxChange(domain)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td>{domain}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDomains.length === 0 && (
            <p className="empty-state">Домены не найдены</p>
          )}
          
          <div className="pagination-info">
            Выбрано: {Object.values(selectedDomains).filter(Boolean).length} из {domains.length} доменов
          </div>
        </div>
      )}
    </div>
  );
} 