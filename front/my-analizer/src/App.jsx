import "./App.scss";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import { useState } from "react";

function App() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleStopCapture = async () => {
    try {
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      if (res.ok) setIsCapturing(false);
    } catch (err) {
      console.error("Ошибка остановки захвата:", err);
    }
  };

  return (
    <div className="container bb mxauto p-4">
      <div className="mb-4">
        <InterfaceSelector onStart={() => setIsCapturing(true)} />
      </div>
      {isCapturing && (
        <div className="mt-4">
          <AllData onStopCapture={handleStopCapture} />
        </div>
      )}
    </div>
  );
}

export default App;
