import "./App.scss";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import DomainList from "./components/DomainList";
import { useState, useEffect, useCallback, useMemo } from "react";

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPage, setCurrentPage] = useState("interface"); // "interface", "domains"
  const [selectedDomains, setSelectedDomains] = useState({});
  const [savedSelectedDomains, setSavedSelectedDomains] = useState({}); // New state for saved selection
  const [allDomains, setAllDomains] = useState([]);
  const [activeInterface, setActiveInterface] = useState("");
  const [notification, setNotification] = useState(null);

  // Memoize the fetchDomains function to prevent unnecessary re-renders
  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/logs");
      const data = await res.json();
      
      // Extract unique domains
      const uniqueDomains = [...new Set(data.map(log => log.domain))];
      setAllDomains(uniqueDomains);
      
      // Initialize selected state for all domains
      const initialSelected = {};
      uniqueDomains.forEach(domain => {
        initialSelected[domain] = false;
      });
      setSelectedDomains(initialSelected);
      setSavedSelectedDomains(initialSelected);
    } catch (err) {
      console.error("Ошибка загрузки доменов:", err);
      showNotification("Ошибка загрузки доменов", "error");
    }
  }, []);

  // Load domains when component mounts
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleStopCapture = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      if (res.ok) {
        setIsCapturing(false);
        setActiveInterface("");
        showNotification("Захват остановлен", "success");
      } else {
        showNotification("Ошибка остановки захвата", "error");
      }
    } catch (err) {
      console.error("Ошибка остановки захвата:", err);
      showNotification("Ошибка остановки захвата", "error");
    }
  }, [showNotification]);

  const handleDomainSelectionChange = useCallback((updatedSelected) => {
    setSelectedDomains(updatedSelected);
  }, []);

  const handleSaveSelection = useCallback(() => {
    setSavedSelectedDomains(selectedDomains);
    showNotification("Выбор доменов сохранен", "success");
  }, [selectedDomains, showNotification]);

  const handleStartCapture = useCallback((interfaceName) => {
    setIsCapturing(true);
    setActiveInterface(interfaceName);
    showNotification(`Захват запущен на интерфейсе ${interfaceName}`, "success");
  }, [showNotification]);

  // Memoize the page content to prevent unnecessary re-renders
  const pageContent = useMemo(() => {
    switch (currentPage) {
      case "interface":
        return (
          <div className="grid-container">
            <div className="component-container">
              <InterfaceSelector 
                onStart={handleStartCapture} 
                isCapturing={isCapturing}
                activeInterface={activeInterface}
              />
            </div>
            {isCapturing && (
              <div className="component-container">
                <AllData 
                  onStopCapture={handleStopCapture} 
                  selectedDomains={savedSelectedDomains}
                  allDomains={allDomains}
                  activeInterface={activeInterface}
                />
              </div>
            )}
          </div>
        );
      case "domains":
        return (
          <div className="component-container">
            <DomainList 
              selectedDomains={selectedDomains}
              allDomains={allDomains}
              onSelectionChange={handleDomainSelectionChange}
              onSaveSelection={handleSaveSelection}
              isCapturing={isCapturing}
            />
          </div>
        );
      default:
        return null;
    }
  }, [
    currentPage, 
    isCapturing, 
    activeInterface, 
    savedSelectedDomains, 
    allDomains, 
    selectedDomains,
    handleStartCapture,
    handleStopCapture,
    handleDomainSelectionChange,
    handleSaveSelection
  ]);

  return (
    <div className="app-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Navigation */}
      <div className="nav-container">
        <div className="nav-buttons">
          <button
            onClick={() => setCurrentPage("interface")}
            className={`nav-button ${currentPage === "interface" ? "nav-button-active" : "nav-button-inactive"}`}
          >
            Интерфейсы и данные
          </button>
          <button
            onClick={() => setCurrentPage("domains")}
            className={`nav-button ${currentPage === "domains" ? "nav-button-active" : "nav-button-inactive"}`}
          >
            Список доменов
          </button>
        </div>
      </div>

      {/* Page Content */}
      {pageContent}
    </div>
  );
}

export default App;
