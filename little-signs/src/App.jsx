import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav.jsx";
import OnboardingFlow from "./components/OnboardingFlow.jsx";
import TodayScreen from "./components/TodayScreen.jsx";
import LearnLibrary from "./components/LearnLibrary.jsx";
import SignDetail from "./components/SignDetail.jsx";
import PracticeSession from "./components/PracticeSession.jsx";
import RoutineLesson from "./components/RoutineLesson.jsx";
import ProgressDashboard from "./components/ProgressDashboard.jsx";
import { signs } from "./data/signs.js";
import { lessonDetails } from "./data/lessonDetails.js";
import { routines } from "./data/routines.js";
import {
  defaultProgress,
  loadLocal,
  saveLocal,
  STORAGE_KEYS,
  todayString,
  updateStreak
} from "./utils/localStorage.js";

function mergeSigns(progressSigns) {
  return signs.map((sign) => ({
    ...sign,
    ...(lessonDetails[sign.id] || {}),
    ...(progressSigns[sign.id] || {})
  }));
}

function buildRecommendations(profile, mergedSigns) {
  const selectedInterests = new Set(profile?.interests || []);
  const expecting = profile?.babyStage === "expecting" || Boolean(profile?.dueDate);

  return [...mergedSigns].sort((a, b) => {
    const aInterest = selectedInterests.has(a.category) ? 2 : 0;
    const bInterest = selectedInterests.has(b.category) ? 2 : 0;
    const aBaby = expecting && ["baby", "all"].includes(a.age_relevance) ? 2 : 0;
    const bBaby = expecting && ["baby", "all"].includes(b.age_relevance) ? 2 : 0;
    const aPractice = a.in_daily_practice ? 3 : 0;
    const bPractice = b.in_daily_practice ? 3 : 0;
    const aLearned = a.learned ? -1 : 0;
    const bLearned = b.learned ? -1 : 0;
    return bInterest + bBaby + bPractice + bLearned - (aInterest + aBaby + aPractice + aLearned);
  });
}

export default function App() {
  const [profile, setProfile] = useState(() => loadLocal(STORAGE_KEYS.profile, null));
  const [progress, setProgress] = useState(() => loadLocal(STORAGE_KEYS.progress, defaultProgress));
  const location = useLocation();

  useEffect(() => {
    saveLocal(STORAGE_KEYS.profile, profile);
  }, [profile]);

  useEffect(() => {
    saveLocal(STORAGE_KEYS.progress, progress);
  }, [progress]);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (main) main.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const mergedSigns = useMemo(() => mergeSigns(progress.signs || {}), [progress.signs]);
  const recommendedSigns = useMemo(
    () => buildRecommendations(profile, mergedSigns),
    [profile, mergedSigns]
  );

  const updateSign = (signId, patch) => {
    setProgress((current) => ({
      ...current,
      signs: {
        ...current.signs,
        [signId]: {
          ...(current.signs?.[signId] || {}),
          ...patch
        }
      }
    }));
  };

  const markPracticed = (signId, confidence = "getting-it") => {
    const currentSign = progress.signs?.[signId] || {};
    updateSign(signId, {
      times_practiced: (currentSign.times_practiced || 0) + 1,
      last_practiced: todayString(),
      confidence,
      practiced: true,
      learned: confidence === "confident" ? true : currentSign.learned || false,
      in_daily_practice: confidence === "not-yet" ? true : currentSign.in_daily_practice || false
    });

    setProgress((current) => ({
      ...current,
      streak: updateStreak(current.streak)
    }));
  };

  const addCustomWord = (word) => {
    setProgress((current) => ({
      ...current,
      customWords: [
        {
          id: crypto.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}`,
          createdAt: new Date().toISOString(),
          verification_status: "needs video source",
          ...word
        },
        ...(current.customWords || [])
      ]
    }));
  };

  const completeRoutine = (routineId) => {
    setProgress((current) => ({
      ...current,
      routinesCompleted: {
        ...current.routinesCompleted,
        [routineId]: {
          completedAt: new Date().toISOString()
        }
      },
      streak: updateStreak(current.streak)
    }));
  };

  const resetDemo = () => {
    setProfile(null);
    setProgress(defaultProgress);
    window.localStorage.removeItem(STORAGE_KEYS.profile);
    window.localStorage.removeItem(STORAGE_KEYS.progress);
  };

  const isOnboarding = location.pathname === "/onboarding" || !profile;

  return (
    <div className="app-shell">
      <main className={isOnboarding ? "app-main onboarding-main" : "app-main"}>
        <Routes>
          <Route
            path="/onboarding"
            element={<OnboardingFlow onComplete={setProfile} />}
          />
          {!profile ? (
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          ) : (
            <>
              <Route
                path="/today"
                element={
                  <TodayScreen
                    profile={profile}
                    signs={recommendedSigns}
                    routines={routines}
                    onUpdateSign={updateSign}
                  />
                }
              />
              <Route
                path="/learn"
                element={
                  <LearnLibrary
                    signs={mergedSigns}
                    customWords={progress.customWords || []}
                    onUpdateSign={updateSign}
                    onAddCustomWord={addCustomWord}
                  />
                }
              />
              <Route
                path="/learn/:signId"
                element={
                  <SignDetail
                    signs={mergedSigns}
                    onUpdateSign={updateSign}
                    onPractice={markPracticed}
                  />
                }
              />
              <Route
                path="/practice"
                element={
                  <PracticeSession signs={recommendedSigns} onPractice={markPracticed} onUpdateSign={updateSign} />
                }
              />
              <Route
                path="/routines"
                element={
                  <RoutineLesson
                    routines={routines}
                    signs={mergedSigns}
                    completed={progress.routinesCompleted || {}}
                    onCompleteRoutine={completeRoutine}
                    onUpdateSign={updateSign}
                  />
                }
              />
              <Route
                path="/progress"
                element={
                  <ProgressDashboard
                    profile={profile}
                    signs={mergedSigns}
                    progress={progress}
                    routines={routines}
                    onReset={resetDemo}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </>
          )}
        </Routes>
      </main>
      {!isOnboarding && <BottomNav />}
    </div>
  );
}
