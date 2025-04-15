import "./App.scss";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import { useState } from "react";

function App() {
  const [showModal, setShowModal] = useState(true);

  const handleStopCapture = async () => {
    try {
      const res = await fetch("http://localhost:5000/stop", {
        method: "POST",
      });
      if (res.ok) setShowModal(true);
    } catch (err) {
      console.error("Ошибка остановки захвата:", err);
    }
  };

  return (
    <>
      {showModal ? (
        <InterfaceSelector onStart={() => setShowModal(false)} />
      ) : (
        <AllData onStopCapture={handleStopCapture} />
      )}
    </>
  );
}

export default App;
