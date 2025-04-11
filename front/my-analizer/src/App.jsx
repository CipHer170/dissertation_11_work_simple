// import "./App.css";
// import InterfaceSelector from "./components/InterfaceSelector";
// import AllData from "./components/AllData";
// import { useState } from "react";

// function App() {
//   const [showModal, setShowModal] = useState(true);

//   const stopCapture = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/stop", {
//         method: "POST",
//       });
//       if (res.ok) setShowModal(true);
//     } catch (err) {
//       console.error("Ошибка остановки захвата:", err);
//     }
//   };

//   return (
//     <>
//       {showModal ? (
//         <InterfaceSelector onStart={() => setShowModal(false)} />
//       ) : (
//         <>
//           <AllData />
//           <button
//             className="fixed bottom-4 right-4 bg-red-600 text-white py-2 px-4 rounded"
//             onClick={stopCapture}
//           >
//             Выбрать другой интерфейс
//           </button>
//         </>
//       )}
//     </>
//   );
// }

// export default App;

import "./App.css";
import InterfaceSelector from "./components/InterfaceSelector";
import AllData from "./components/AllData";
import { useState } from "react";

function App() {
  const [showModal, setShowModal] = useState(true);

  const stopCapture = async () => {
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
        <>
          <AllData />
          <button
            className="fixed bottom-4 right-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            onClick={stopCapture}
          >
            Сменить интерфейс
          </button>
        </>
      )}
    </>
  );
}

export default App;
