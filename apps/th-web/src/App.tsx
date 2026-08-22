import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.js";
import { LoginPage } from "./auth/LoginPage.js";
import { RegisterPage } from "./auth/RegisterPage.js";
import { NavShell } from "./app/NavShell.js";
import { HomePage } from "./app/HomePage.js";
import { ChallengeBoardPage } from "./board/ChallengeBoardPage.js";
import { ChallengePage } from "./board/ChallengePage.js";
import { ProfilePage } from "./profile/ProfilePage.js";
import { LeaderboardPage } from "./leaderboard/LeaderboardPage.js";
import { CommunityPage } from "./community/CommunityPage.js";
import { SelfHostPage } from "./app/SelfHostPage.js";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/challenges" element={<ChallengeBoardPage />} />
            <Route path="/challenges/:id" element={<ChallengePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/self-host" element={<SelfHostPage />} />
          </Routes>
        </NavShell>
      </AuthProvider>
    </BrowserRouter>
  );
}
