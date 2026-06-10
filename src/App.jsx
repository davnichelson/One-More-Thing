import { useEffect, useMemo, useState } from "react";

const TASK_CATEGORIES = [
  "Home",
  "Work",
  "Health",
  "Money",
  "Family",
  "Quick Win"
];

const TASK_DURATIONS = [1, 5, 10];

const TASK_XP_BY_DURATION = {
  1: 10,
  5: 20,
  10: 35
};

const LEVELS = [
  { level: 1, requiredXp: 0 },
  { level: 2, requiredXp: 100 },
  { level: 3, requiredXp: 250 },
  { level: 4, requiredXp: 500 }
];

const DAILY_CHALLENGES = [
  {
    id: "complete-1",
    title: "Finish one more thing",
    description: "Complete any 1 task today.",
    target: 1,
    xpReward: 25
  },
  {
    id: "complete-2",
    title: "Two tiny wins",
    description: "Complete any 2 tasks today.",
    target: 2,
    xpReward: 50
  },
  {
    id: "quick-1",
    title: "Quick win spark",
    description: "Complete 1 Quick Win task today.",
    target: 1,
    xpReward: 35,
    category: "Quick Win"
  },
  {
    id: "short-2",
    title: "Minute maker",
    description: "Complete two 1-minute tasks today.",
    target: 2,
    xpReward: 60,
    duration: 1
  }
];

const PRO_FEATURES = [
  {
    name: "Built-in task suggestions",
    free: "Included",
    pro: "Included"
  },
  {
    name: "Custom tasks",
    free: "Included",
    pro: "Unlimited"
  },
  {
    name: "Daily Challenge",
    free: "Included",
    pro: "Advanced challenges later"
  },
  {
    name: "XP and leveling",
    free: "Basic levels",
    pro: "Bonus XP ideas later"
  },
  {
    name: "Smart task packs",
    free: "Not included",
    pro: "Planned"
  },
  {
    name: "Weekly insights",
    free: "Not included",
    pro: "Planned"
  }
];

const BUILT_IN_TASKS = [
  { id: "home-1", title: "Clear one small surface", category: "Home", duration: 1 },
  { id: "home-2", title: "Put away five things that are out of place", category: "Home", duration: 5 },
  { id: "home-3", title: "Start a load of laundry or fold one pile", category: "Home", duration: 10 },
  { id: "work-1", title: "Reply to one message you have been avoiding", category: "Work", duration: 5 },
  { id: "work-2", title: "Write tomorrow's first work task", category: "Work", duration: 1 },
  { id: "work-3", title: "Clean up one file, note, or browser tab", category: "Work", duration: 10 },
  { id: "health-1", title: "Drink a glass of water", category: "Health", duration: 1 },
  { id: "health-2", title: "Take a five-minute walk", category: "Health", duration: 5 },
  { id: "health-3", title: "Stretch your neck, shoulders, and back", category: "Health", duration: 10 },
  { id: "money-1", title: "Check one recent charge", category: "Money", duration: 1 },
  { id: "money-2", title: "Move one receipt or bill to the right place", category: "Money", duration: 5 },
  { id: "money-3", title: "Cancel or note one thing you do not need", category: "Money", duration: 10 },
  { id: "family-1", title: "Send a kind check-in text", category: "Family", duration: 1 },
  { id: "family-2", title: "Put one shared plan on the calendar", category: "Family", duration: 5 },
  { id: "family-3", title: "Do one tiny favor without announcing it", category: "Family", duration: 10 },
  { id: "quick-1", title: "Set a one-minute timer and tidy what you can", category: "Quick Win", duration: 1 },
  { id: "quick-2", title: "Delete or archive ten emails", category: "Quick Win", duration: 5 },
  { id: "quick-3", title: "Write down the next thing you need to remember", category: "Quick Win", duration: 1 }
];

const STORAGE_KEYS = {
  customTasks: "one-more-thing-custom-tasks",
  completedHistory: "one-more-thing-completed-history",
  dailyChallenge: "one-more-thing-daily-challenge",
  totalXp: "one-more-thing-total-xp",
  proStatus: "one-more-thing-pro-status",
  recommendationData: "one-more-thing-recommendation-data"
};

// Read saved data from the browser. If nothing is saved yet, use the fallback.
function loadSavedValue(key, fallbackValue) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function addDefaultDuration(task) {
  return {
    ...task,
    duration: task.duration || 5
  };
}

function getTaskXp(task) {
  return TASK_XP_BY_DURATION[task.duration] || 20;
}

function createDefaultRecommendationData() {
  return {
    categoryStats: TASK_CATEGORIES.reduce((stats, category) => {
      stats[category] = {
        completed: 0,
        skipped: 0,
        suggested: 0,
        lastSuggestedAt: null
      };
      return stats;
    }, {}),
    recentTaskIds: []
  };
}

function normalizeRecommendationData(savedData) {
  const defaultData = createDefaultRecommendationData();
  const savedCategoryStats = savedData?.categoryStats || {};

  return {
    categoryStats: TASK_CATEGORIES.reduce((stats, category) => {
      stats[category] = {
        ...defaultData.categoryStats[category],
        ...savedCategoryStats[category]
      };
      return stats;
    }, {}),
    recentTaskIds: Array.isArray(savedData?.recentTaskIds)
      ? savedData.recentTaskIds.slice(0, 6)
      : []
  };
}

function saveRecommendationData(nextData) {
  saveValue(STORAGE_KEYS.recommendationData, nextData);
}

function createDailyChallenge(dateKey) {
  const dateTotal = dateKey
    .split("-")
    .reduce((total, part) => total + Number(part), 0);
  const template = DAILY_CHALLENGES[dateTotal % DAILY_CHALLENGES.length];

  return {
    ...template,
    date: dateKey,
    isComplete: false
  };
}

function loadTodayChallenge(dateKey) {
  const savedChallenge = loadSavedValue(STORAGE_KEYS.dailyChallenge, null);

  if (savedChallenge?.date === dateKey) {
    return savedChallenge;
  }

  const todayChallenge = createDailyChallenge(dateKey);
  saveValue(STORAGE_KEYS.dailyChallenge, todayChallenge);
  return todayChallenge;
}

function getChallengeProgress(challenge, history, dateKey) {
  const matchingTasks = history.filter((task) => {
    const matchesDate = task.completedDate === dateKey;
    const matchesCategory = !challenge.category || task.category === challenge.category;
    const matchesDuration = !challenge.duration || task.duration === challenge.duration;

    return matchesDate && matchesCategory && matchesDuration;
  });

  return Math.min(matchingTasks.length, challenge.target);
}

function getLevelInfo(totalXp) {
  const currentLevel = [...LEVELS]
    .reverse()
    .find((level) => totalXp >= level.requiredXp);
  const nextLevel = LEVELS.find((level) => level.requiredXp > totalXp);
  const xpIntoLevel = totalXp - currentLevel.requiredXp;
  const xpNeededForNextLevel = nextLevel
    ? nextLevel.requiredXp - currentLevel.requiredXp
    : 0;
  const progressPercent = nextLevel
    ? Math.round((xpIntoLevel / xpNeededForNextLevel) * 100)
    : 100;

  return {
    currentLevel: currentLevel.level,
    nextLevel: nextLevel?.level,
    xpIntoLevel,
    xpNeededForNextLevel,
    progressPercent
  };
}

// Save data in the browser so it is still there after a refresh.
function saveValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Create a YYYY-MM-DD date string using the user's local date.
function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYesterdayKey(date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
}

// A streak is one or more days in a row with at least one completed task.
function calculateStreak(history) {
  const completedDates = new Set(history.map((item) => item.completedDate));
  let streak = 0;
  let dateToCheck = new Date();

  // Count backward from today while each day has at least one completed task.
  while (completedDates.has(getDateKey(dateToCheck))) {
    streak += 1;
    dateToCheck.setDate(dateToCheck.getDate() - 1);
  }

  return streak;
}

function chooseWeightedTask(tasks, recommendationData, currentTaskId) {
  if (tasks.length === 0) {
    return null;
  }

  const categoryStats = recommendationData.categoryStats;
  const recentTaskIds = recommendationData.recentTaskIds;
  const otherTasks = tasks.filter((task) => task.id !== currentTaskId);
  const choices = otherTasks.length > 0 ? otherTasks : tasks;
  const shouldExploreNeglectedCategory = Math.random() < 0.2;
  const categorySuggestedCounts = TASK_CATEGORIES.map((category) => ({
    category,
    suggested: categoryStats[category]?.suggested || 0
  }));
  const fewestSuggestions = Math.min(
    ...categorySuggestedCounts.map((item) => item.suggested)
  );
  const neglectedCategories = categorySuggestedCounts
    .filter((item) => item.suggested === fewestSuggestions)
    .map((item) => item.category);

  const weightedChoices = choices.map((task) => {
    const stats = categoryStats[task.category] || {};
    const completed = stats.completed || 0;
    const skipped = stats.skipped || 0;
    const suggested = stats.suggested || 0;
    const completionRate = (completed + 1) / (completed + skipped + 2);
    const completionBoost = 1 + completionRate * 3;
    const neglectedBoost =
      shouldExploreNeglectedCategory && neglectedCategories.includes(task.category)
        ? 3
        : 1;
    const varietyPenalty = recentTaskIds.includes(task.id) ? 0.3 : 1;
    const categoryFatiguePenalty = suggested > completed + skipped + 3 ? 0.7 : 1;

    return {
      task,
      weight:
        completionBoost * neglectedBoost * varietyPenalty * categoryFatiguePenalty
    };
  });
  const totalWeight = weightedChoices.reduce(
    (total, choice) => total + choice.weight,
    0
  );
  let winningNumber = Math.random() * totalWeight;

  for (const choice of weightedChoices) {
    winningNumber -= choice.weight;

    if (winningNumber <= 0) {
      return choice.task;
    }
  }

  return weightedChoices[weightedChoices.length - 1].task;
}

function recordTaskSuggested(recommendationData, task) {
  if (!task) {
    return recommendationData;
  }

  const categoryStats = {
    ...recommendationData.categoryStats,
    [task.category]: {
      ...recommendationData.categoryStats[task.category],
      suggested: recommendationData.categoryStats[task.category].suggested + 1,
      lastSuggestedAt: new Date().toISOString()
    }
  };

  return {
    categoryStats,
    recentTaskIds: [
      task.id,
      ...recommendationData.recentTaskIds.filter((taskId) => taskId !== task.id)
    ].slice(0, 6)
  };
}

function recordCategoryOutcome(recommendationData, category, outcome) {
  const currentStats = recommendationData.categoryStats[category];
  const nextCategoryStats = {
    ...recommendationData.categoryStats,
    [category]: {
      ...currentStats,
      [outcome]: currentStats[outcome] + 1
    }
  };

  return {
    ...recommendationData,
    categoryStats: nextCategoryStats
  };
}

export default function App() {
  const todayKey = getDateKey();

  // These two pieces of state start by loading anything saved in localStorage.
  const [customTasks, setCustomTasks] = useState(() =>
    loadSavedValue(STORAGE_KEYS.customTasks, []).map(addDefaultDuration)
  );
  const [completedHistory, setCompletedHistory] = useState(() =>
    loadSavedValue(STORAGE_KEYS.completedHistory, []).map(addDefaultDuration)
  );
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("Any");
  const [currentTask, setCurrentTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Quick Win");
  const [newTaskDuration, setNewTaskDuration] = useState(5);
  const [dailyChallenge, setDailyChallenge] = useState(() =>
    loadTodayChallenge(todayKey)
  );
  const [totalXp, setTotalXp] = useState(() =>
    loadSavedValue(STORAGE_KEYS.totalXp, 0)
  );
  const [currentPage, setCurrentPage] = useState("home");
  const [proStatus, setProStatus] = useState(() =>
    loadSavedValue(STORAGE_KEYS.proStatus, {
      isActive: false,
      plan: null,
      startedAt: null
    })
  );
  const [recommendationData, setRecommendationData] = useState(() =>
    normalizeRecommendationData(
      loadSavedValue(STORAGE_KEYS.recommendationData, null)
    )
  );

  // Built-in tasks and custom tasks are both eligible for random selection.
  const allTasks = useMemo(
    () => [...BUILT_IN_TASKS, ...customTasks],
    [customTasks]
  );

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchesCategory =
        selectedCategory === "All" || task.category === selectedCategory;
      const matchesDuration =
        selectedDuration === "Any" || task.duration === selectedDuration;

      return matchesCategory && matchesDuration;
    });
  }, [allTasks, selectedCategory, selectedDuration]);

  const filteredBuiltInTasks = useMemo(() => {
    return BUILT_IN_TASKS.filter((task) => {
      const matchesCategory =
        selectedCategory === "All" || task.category === selectedCategory;
      const matchesDuration =
        selectedDuration === "Any" || task.duration === selectedDuration;

      return matchesCategory && matchesDuration;
    });
  }, [selectedCategory, selectedDuration]);

  const todayCompletedCount = completedHistory.filter(
    (item) => item.completedDate === todayKey
  ).length;
  const streak = calculateStreak(completedHistory);
  const yesterdayKey = getYesterdayKey();
  const challengeProgress = getChallengeProgress(
    dailyChallenge,
    completedHistory,
    todayKey
  );
  const challengePercent = Math.round(
    (challengeProgress / dailyChallenge.target) * 100
  );
  const levelInfo = getLevelInfo(totalXp);
  const recommendationSummary = TASK_CATEGORIES.map((category) => {
    const stats = recommendationData.categoryStats[category];
    const totalOutcomes = stats.completed + stats.skipped;
    const completionRate =
      totalOutcomes > 0 ? Math.round((stats.completed / totalOutcomes) * 100) : 0;

    return {
      category,
      completionRate,
      completed: stats.completed,
      skipped: stats.skipped
    };
  });
  const learnedCompletions = recommendationSummary.reduce(
    (total, item) => total + item.completed,
    0
  );
  const learnedSkips = recommendationSummary.reduce(
    (total, item) => total + item.skipped,
    0
  );

  useEffect(() => {
    const challengeIsDone = challengeProgress >= dailyChallenge.target;

    if (!challengeIsDone || dailyChallenge.isComplete) {
      return;
    }

    const completedChallenge = {
      ...dailyChallenge,
      isComplete: true
    };
    const nextXp = totalXp + dailyChallenge.xpReward;

    setDailyChallenge(completedChallenge);
    setTotalXp(nextXp);
    saveValue(STORAGE_KEYS.dailyChallenge, completedChallenge);
    saveValue(STORAGE_KEYS.totalXp, nextXp);
  }, [challengeProgress, dailyChallenge, totalXp]);

  function updateRecommendationData(nextData) {
    setRecommendationData(nextData);
    saveRecommendationData(nextData);
  }

  function suggestRecommendedTask(data = recommendationData) {
    const nextTask = chooseWeightedTask(filteredTasks, data, currentTask?.id);
    const nextRecommendationData = recordTaskSuggested(data, nextTask);

    setCurrentTask(nextTask);
    updateRecommendationData(nextRecommendationData);
  }

  function handleGiveMeTask() {
    suggestRecommendedTask();
  }

  // Marking complete records the task in history and updates localStorage.
  function handleComplete() {
    if (!currentTask) {
      return;
    }

    const taskXp = getTaskXp(currentTask);
    const completedTask = {
      ...currentTask,
      historyId: `${currentTask.id}-${Date.now()}`,
      completedDate: todayKey,
      xpEarned: taskXp
    };
    const nextHistory = [completedTask, ...completedHistory];
    const nextXp = totalXp + taskXp;

    setCompletedHistory(nextHistory);
    setTotalXp(nextXp);
    saveValue(STORAGE_KEYS.completedHistory, nextHistory);
    saveValue(STORAGE_KEYS.totalXp, nextXp);
    updateRecommendationData(
      recordCategoryOutcome(recommendationData, currentTask.category, "completed")
    );
    setCurrentTask(null);
  }

  // Skipping teaches the recommendation engine, then picks another task.
  function handleSkip() {
    if (!currentTask) {
      suggestRecommendedTask();
      return;
    }

    const nextRecommendationData = recordCategoryOutcome(
      recommendationData,
      currentTask.category,
      "skipped"
    );

    suggestRecommendedTask(nextRecommendationData);
  }

  // Custom tasks are saved and immediately shown as the current task.
  function handleAddCustomTask(event) {
    event.preventDefault();

    const trimmedTitle = newTaskTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    const task = {
      id: `custom-${Date.now()}`,
      title: trimmedTitle,
      category: newTaskCategory,
      duration: newTaskDuration,
      isCustom: true
    };
    const nextCustomTasks = [task, ...customTasks];

    setCustomTasks(nextCustomTasks);
    saveValue(STORAGE_KEYS.customTasks, nextCustomTasks);
    setNewTaskTitle("");
    setCurrentTask(task);
  }

  function handleDeleteCustomTask(taskId) {
    const nextCustomTasks = customTasks.filter((task) => task.id !== taskId);

    setCustomTasks(nextCustomTasks);
    saveValue(STORAGE_KEYS.customTasks, nextCustomTasks);

    if (currentTask?.id === taskId) {
      setCurrentTask(null);
    }
  }

  // This is the future Stripe checkout spot.
  // Later, replace this localStorage simulation with a call to your checkout API.
  function handleUpgrade(plan) {
    const nextProStatus = {
      isActive: true,
      plan,
      startedAt: new Date().toISOString()
    };

    setProStatus(nextProStatus);
    saveValue(STORAGE_KEYS.proStatus, nextProStatus);
  }

  function handleCancelProSimulation() {
    const nextProStatus = {
      isActive: false,
      plan: null,
      startedAt: null
    };

    setProStatus(nextProStatus);
    saveValue(STORAGE_KEYS.proStatus, nextProStatus);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#ecfeff_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-lg border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Small wins add up
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                One More Thing
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-700">
                Pick one tiny task, finish it, and give your day a little extra momentum.
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
              {proStatus.isActive ? "Pro active" : "Free plan"}
            </span>
          </div>
          <nav className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <PageButton
              isSelected={currentPage === "home"}
              label="Home"
              onClick={() => setCurrentPage("home")}
            />
            <PageButton
              isSelected={currentPage === "pro"}
              label="Pro"
              onClick={() => setCurrentPage("pro")}
            />
          </nav>
        </header>

        {currentPage === "pro" ? (
          <ProPage
            onCancelProSimulation={handleCancelProSimulation}
            onUpgrade={handleUpgrade}
            proStatus={proStatus}
          />
        ) : (
          <>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Completed today" value={todayCompletedCount} />
          <StatCard label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
          <StatCard label="Custom tasks" value={customTasks.length} />
          <StatCard label="Yesterday" value={completedHistory.some((item) => item.completedDate === yesterdayKey) ? "Done" : "Open"} />
        </section>

        <section className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Daily challenge
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {dailyChallenge.title}
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                +{dailyChallenge.xpReward} XP
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {dailyChallenge.description}
            </p>
            <ProgressBar percent={challengePercent} />
            <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
              <span>
                {challengeProgress} of {dailyChallenge.target} complete
              </span>
              <span>{dailyChallenge.isComplete ? "XP awarded" : "In progress"}</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Level
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <h2 className="text-3xl font-bold text-slate-950">
                Level {levelInfo.currentLevel}
              </h2>
              <p className="text-sm font-bold text-slate-600">{totalXp} XP</p>
            </div>
            <ProgressBar percent={levelInfo.progressPercent} />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {levelInfo.nextLevel
                ? `${levelInfo.xpIntoLevel} of ${levelInfo.xpNeededForNextLevel} XP toward Level ${levelInfo.nextLevel}`
                : "Top level reached for this MVP."}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Tasks award XP every time. Daily Challenges add a bonus once per day.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label htmlFor="category" className="text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="category"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none ring-teal-600 transition focus:ring-2 sm:w-52"
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setCurrentTask(null);
                }}
              >
                <option>All</option>
                {TASK_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <button
              className="rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
              onClick={handleGiveMeTask}
              type="button"
            >
              Give me one more thing
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700">Duration</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DurationFilterButton
                isSelected={selectedDuration === "Any"}
                label="Any task"
                onClick={() => {
                  setSelectedDuration("Any");
                  setCurrentTask(null);
                }}
              />
              {TASK_DURATIONS.map((duration) => (
                <DurationFilterButton
                  isSelected={selectedDuration === duration}
                  key={duration}
                  label={`${duration}-minute task`}
                  onClick={() => {
                    setSelectedDuration(duration);
                    setCurrentTask(null);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {currentTask ? (
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                    {currentTask.category}
                  </span>
                  <DurationPill duration={currentTask.duration} />
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
                  {currentTask.title}
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    className="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                    onClick={handleComplete}
                    type="button"
                  >
                    Complete +{getTaskXp(currentTask)} XP
                  </button>
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    onClick={handleSkip}
                    type="button"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <h2 className="text-xl font-bold text-slate-950">
                  {filteredTasks.length > 0 ? "Ready when you are." : "No tasks match yet."}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  {filteredTasks.length > 0
                    ? "Choose a category and duration, then ask for one more thing."
                    : "Try Any task, another category, or add a custom task with this duration."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-950">
                Recommendation learning
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {learnedCompletions} completes, {learnedSkips} skips tracked
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {recommendationSummary.map((item) => (
                <div className="rounded-md bg-slate-50 px-3 py-2" key={item.category}>
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                    {item.category}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {item.completed + item.skipped > 0
                      ? `${item.completionRate}% complete rate`
                      : "Learning"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <h2 className="text-lg font-bold text-slate-950">Add a custom task</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_150px_auto]" onSubmit={handleAddCustomTask}>
            <input
              className="rounded-md border border-slate-300 px-3 py-3 outline-none ring-teal-600 transition placeholder:text-slate-400 focus:ring-2"
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Example: wipe the kitchen counter"
              type="text"
              value={newTaskTitle}
            />
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-3 outline-none ring-teal-600 transition focus:ring-2"
              onChange={(event) => setNewTaskCategory(event.target.value)}
              value={newTaskCategory}
            >
              {TASK_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-3 outline-none ring-teal-600 transition focus:ring-2"
              onChange={(event) => setNewTaskDuration(Number(event.target.value))}
              value={newTaskDuration}
            >
              {TASK_DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} minute{duration === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <button
              className="rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              type="submit"
            >
              Add task
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">Built-in suggestions</h2>
            <span className="text-sm font-semibold text-slate-500">
              {filteredBuiltInTasks.length} available
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {filteredBuiltInTasks.slice(0, 8).map((task) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                key={task.id}
              >
                <div>
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                      {task.category}
                    </p>
                    <DurationPill duration={task.duration} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {customTasks.length > 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <h2 className="text-lg font-bold text-slate-950">Your custom tasks</h2>
            <div className="mt-4 grid gap-2">
              {customTasks.slice(0, 6).map((task) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-cyan-50 px-3 py-3"
                  key={task.id}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-slate-600">{task.category}</p>
                      <DurationPill duration={task.duration} />
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${task.title}`}
                    className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    onClick={() => handleDeleteCustomTask(task.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <h2 className="text-lg font-bold text-slate-950">Recent completions</h2>
          {completedHistory.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {completedHistory.slice(0, 6).map((task) => (
                <div
                  className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-3"
                  key={task.historyId}
                >
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {task.category} - {task.duration} min - +{task.xpEarned || getTaskXp(task)} XP - {task.completedDate}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Completed tasks will appear here after your first win.
            </p>
          )}
        </section>
          </>
        )}
      </div>
    </main>
  );
}

function DurationFilterButton({ isSelected, label, onClick }) {
  return (
    <button
      className={`rounded-md border px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
        isSelected
          ? "border-teal-700 bg-teal-700 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PageButton({ isSelected, label, onClick }) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
        isSelected
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ProPage({ onCancelProSimulation, onUpgrade, proStatus }) {
  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              One More Thing Pro
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">
              A calm upgrade path for bigger momentum.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              This screen simulates a subscription today and leaves a clean place
              to connect Stripe Checkout later.
            </p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-teal-800">
              Subscription status
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {proStatus.isActive ? "Pro active" : "Free plan"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {proStatus.isActive
                ? `${proStatus.plan} is saved in localStorage for this MVP.`
                : "Upgrade buttons will save a simulated Pro status locally."}
            </p>
            {proStatus.isActive ? (
              <button
                className="mt-4 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                onClick={onCancelProSimulation}
                type="button"
              >
                Reset simulation
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <PlanCard
          buttonLabel="Current plan"
          features={[
            "Random task suggestions",
            "Custom tasks",
            "Daily Challenge",
            "Basic XP and levels"
          ]}
          isCurrent={!proStatus.isActive}
          name="Free"
          price="$0"
        />
        <PlanCard
          buttonLabel={proStatus.isActive ? "Pro active" : "Upgrade to Pro"}
          features={[
            "Everything in Free",
            "Planned smart task packs",
            "Planned weekly insights",
            "Stripe-ready checkout flow"
          ]}
          isCurrent={proStatus.isActive}
          name="Pro"
          onClick={() => onUpgrade("Pro monthly")}
          price="$5/mo"
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Free vs Pro</h2>
        <div className="mt-4 grid gap-2">
          {PRO_FEATURES.map((feature) => (
            <div
              className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_120px_160px] sm:items-center"
              key={feature.name}
            >
              <p className="font-semibold text-slate-900">{feature.name}</p>
              <p className="text-sm text-slate-600">Free: {feature.free}</p>
              <p className="text-sm font-semibold text-teal-800">
                Pro: {feature.pro}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Stripe-ready setup</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The Upgrade buttons currently call one local function. When payments are
          ready, that function can call a backend endpoint that creates a Stripe
          Checkout session and returns the checkout URL.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
            onClick={() => onUpgrade("Pro monthly")}
            type="button"
          >
            Upgrade monthly
          </button>
          <button
            className="rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            onClick={() => onUpgrade("Pro yearly")}
            type="button"
          >
            Upgrade yearly
          </button>
        </div>
      </section>
    </>
  );
}

function PlanCard({ buttonLabel, features, isCurrent, name, onClick, price }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{name}</h2>
          <p className="mt-1 text-3xl font-bold text-slate-950">{price}</p>
        </div>
        {isCurrent ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            Current
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2">
        {features.map((feature) => (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700" key={feature}>
            {feature}
          </p>
        ))}
      </div>
      <button
        className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isCurrent
            ? "border border-slate-300 bg-white text-slate-600 focus:ring-slate-400"
            : "bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-600"
        }`}
        disabled={isCurrent && name === "Pro"}
        onClick={onClick}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function DurationPill({ duration }) {
  return (
    <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-900">
      {duration} min
    </span>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-teal-700 transition-all"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
