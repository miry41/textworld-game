import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ManualPlay from './pages/ManualPlay';
import AutoPlay from './pages/AutoPlay';
import Instructions from './pages/Instructions';

function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play/manual" element={<ManualPlay />} />
          <Route path="/play/auto" element={<AutoPlay />} />
          <Route path="/instructions" element={<Instructions />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
