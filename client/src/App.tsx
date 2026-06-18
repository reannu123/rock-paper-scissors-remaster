import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import PlayMenu from "./pages/PlayMenu";
import Match from "./pages/Match";
import VsAI from "./pages/VsAI";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60">
        Loading…
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/play" element={<PlayMenu />} />
          <Route path="/play/casual" element={<Match mode="casual" />} />
          <Route path="/play/ranked" element={<Match mode="ranked" />} />
          <Route path="/play/ai" element={<VsAI />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
