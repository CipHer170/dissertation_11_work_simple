import "./App.scss";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import DomainList from "./components/DomainList";
import { useState, useEffect, useCallback, useMemo } from "react";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";

// Main App component wrapper
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

// Main content component
function AppContent() {
  const { t, currentLang, changeLanguage } = useLanguage();
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPage, setCurrentPage] = useState("interface"); // "interface", "domains"
  const [selectedDomains, setSelectedDomains] = useState({});
  const [savedSelectedDomains, setSavedSelectedDomains] = useState({}); // New state for saved selection
  const [allDomains, setAllDomains] = useState([]);
  const [activeInterface, setActiveInterface] = useState("");
  const [notification, setNotification] = useState(null);

  // Define showNotification first
  const showNotification = useCallback((messageKey, type = "info") => {
    const message = type === 'success' 
      ? t(`notifications.success.${messageKey}`)
      : t(`alerts.${messageKey}`);
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, [t]);

  // Then define fetchDomains
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
      console.error("Error loading domains:", err);
      showNotification('loadError', 'error');
    }
  }, [showNotification]);

  // Load domains when component mounts
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleStopCapture = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      if (res.ok) {
        setIsCapturing(false);
        setActiveInterface("");
        showNotification('captureStopped', 'success');
      } else {
        showNotification('stopError', 'error');
      }
    } catch (err) {
      console.error("Error stopping capture:", err);
      showNotification('stopError', 'error');
    }
  }, [showNotification]);

  const handleStartCapture = useCallback((interfaceName) => {
    setIsCapturing(true);
    setActiveInterface(interfaceName);
    showNotification('captureStarted', 'success');
  }, [showNotification]);

  const handleSaveSelection = useCallback(() => {
    setSavedSelectedDomains(selectedDomains);
    showNotification('saved', 'success');
  }, [selectedDomains, showNotification]);

  const handleDomainSelectionChange = useCallback((updatedSelected) => {
    setSelectedDomains(updatedSelected);
  }, []);

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
      {/* Language Selector */}
 

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
            {t('titles.interfaces')}
          </button>
          <button
            onClick={() => setCurrentPage("domains")}
            className={`nav-button ${currentPage === "domains" ? "nav-button-active" : "nav-button-inactive"}`}
          >
            {t('titles.domains')}
          </button>
        </div>

        <div className="language-selector">
        <select
          value={currentLang}
          onChange={(e) => changeLanguage(e.target.value)}
          className="language-select"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="kk">Қарақалпақ</option>
          <option value="uz">O'zbek</option>
        </select>
      </div>
      </div>

      {/* Page Content */}
      {pageContent}
    </div>
  );
}

export default App;
