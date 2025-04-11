import "./App.css";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import { useState } from "react";

function App() {
  const [showModal, setShowModal] = useState(true);
  return (
    <>
      {showModal ? (
        <InterfaceSelector onStart={() => setShowModal(false)} />
      ) : (
        <AllData />
      )}
    </>
  );
}

export default App;
