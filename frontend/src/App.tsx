import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentView } from './components/student/StudentView';
import { Landing } from './components/Landing';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
