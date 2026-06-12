import { Routes, Route, Navigate } from "react-router-dom";
import WizardLayout from "./components/WizardLayout";
import Step1Location from "./pages/Step1Location";
import Step2Requirements from "./pages/Step2Requirements";
import Step3Analysis from "./pages/Step3Analysis";
import Step4Style from "./pages/Step4Style";
import Step5Prototype from "./pages/Step5Prototype";
import Step6Consult from "./pages/Step6Consult";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/wizard" element={<WizardLayout />}>
        <Route index element={<Navigate to="step1" replace />} />
        <Route path="step1" element={<Step1Location />} />
        <Route path="step2" element={<Step2Requirements />} />
        <Route path="step3" element={<Step3Analysis />} />
        <Route path="step4" element={<Step4Style />} />
        <Route path="step5" element={<Step5Prototype />} />
        <Route path="step6" element={<Step6Consult />} />
      </Route>
    </Routes>
  );
}
