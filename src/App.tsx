import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from "./layout/AppLayout";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";

// Other Pages
import NotFound from "./pages/OtherPage/NotFound";

// Dashboard Pages
import Home from "./pages/Dashboard/Home";
import TeacherAccounts from "./pages/Dashboard/TeacherAccounts";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";

// Form Pages
import FormElements from "./pages/Classposts/Announcements";
import TeacherRegistration from "./pages/Classposts/Assignments";
import InputTemp from "./pages/Classposts/uFormTemplates";
// Table Pages
import BasicTables from "./pages/Tables/BasicTables";

// UI Elements
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";

// Charts
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/Signup" element={<SignUp />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* Protected Layout and Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="Teacher">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="Dashboard" element={<Home />} />
            <Route path="TeacherAccounts" element={<TeacherAccounts />} />
            <Route path="profile" element={<UserProfiles />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="blank" element={<Blank />} />

            {/* Forms */}
            <Route path="form-elements" element={<FormElements />} />
            <Route path="teacher-registration" element={<TeacherRegistration />} />
            <Route path="Input-Temp" element={<InputTemp />} />

            {/* Tables */}
            <Route path="basic-tables" element={<BasicTables />} />

            {/* UI Elements */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />

            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
