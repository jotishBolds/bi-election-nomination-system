// Time-based access control and election phase management
import "server-only";
import { db } from "@/lib/db";
import { redis, REDIS_KEYS } from "@/lib/redis";
import { ElectionPhase } from "@prisma/client";

interface TimeWindow {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  currentTime: string;
  message: string;
}

interface ElectionStatus {
  isActive: boolean;
  currentPhase: ElectionPhase;
  canSubmitNomination: boolean;
  canWithdraw: boolean;
  canScrutinize: boolean;
  daysUntilNominationEnd: number | null;
  message: string;
}

// Check if portal is within operating hours (9 AM - 3 PM IST)
export function checkPortalTimeWindow(): TimeWindow {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);

  const startTime = process.env.PORTAL_START_TIME || "09:00";
  const endTime = process.env.PORTAL_END_TIME || "15:00";

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const currentHour = istTime.getUTCHours();
  const currentMin = istTime.getUTCMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;

  const formatTime = (h: number, m: number) =>
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  return {
    isOpen,
    opensAt: startTime,
    closesAt: endTime,
    currentTime: formatTime(currentHour, currentMin),
    message: isOpen
      ? "Portal is open for submissions"
      : `Portal is closed. Operating hours: ${startTime} - ${endTime} IST`,
  };
}

// Get current election configuration (with caching)
export async function getActiveElectionConfig() {
  // Try cache first
  const cacheKey = `${REDIS_KEYS.ELECTION_CONFIG}active`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const config = await db.electionConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (config) {
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(config));
  }

  return config;
}

// Get current election status
export async function getElectionStatus(): Promise<ElectionStatus> {
  const config = await getActiveElectionConfig();

  if (!config) {
    return {
      isActive: false,
      currentPhase: ElectionPhase.PRE_NOTIFICATION,
      canSubmitNomination: false,
      canWithdraw: false,
      canScrutinize: false,
      daysUntilNominationEnd: null,
      message: "No active election configured",
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const nominationStart = new Date(config.nominationStartDate);
  const nominationEnd = new Date(config.nominationEndDate);
  const scrutinyDate = new Date(config.scrutinyDate);
  const withdrawalStart = new Date(config.withdrawalStartDate);
  const withdrawalEnd = new Date(config.withdrawalEndDate);

  // Determine current phase based on dates
  let currentPhase = config.currentPhase;
  let canSubmitNomination = false;
  let canWithdraw = false;
  let canScrutinize = false;

  if (todayStart >= nominationStart && todayStart <= nominationEnd) {
    canSubmitNomination = true;
    currentPhase = ElectionPhase.NOMINATION;
  } else if (todayStart.getTime() === scrutinyDate.getTime()) {
    canScrutinize = true;
    currentPhase = ElectionPhase.SCRUTINY;
  } else if (todayStart >= withdrawalStart && todayStart <= withdrawalEnd) {
    canWithdraw = true;
    currentPhase = ElectionPhase.WITHDRAWAL;
  }

  // Calculate days until nomination end
  let daysUntilNominationEnd: number | null = null;
  if (todayStart <= nominationEnd) {
    daysUntilNominationEnd = Math.ceil(
      (nominationEnd.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Also check time window
  const timeWindow = checkPortalTimeWindow();
  if (!timeWindow.isOpen) {
    canSubmitNomination = false;
    canWithdraw = false;
    // Scrutiny might be allowed outside hours for ROs
  }

  return {
    isActive: config.isActive,
    currentPhase,
    canSubmitNomination,
    canWithdraw,
    canScrutinize,
    daysUntilNominationEnd,
    message: generateStatusMessage(currentPhase, timeWindow, config),
  };
}

function generateStatusMessage(
  phase: ElectionPhase,
  timeWindow: TimeWindow,
  config: any,
): string {
  if (!timeWindow.isOpen) {
    return timeWindow.message;
  }

  switch (phase) {
    case ElectionPhase.PRE_NOTIFICATION:
      return "Election notification pending";
    case ElectionPhase.NOTIFICATION:
      return "Election notified. Nomination period will begin soon.";
    case ElectionPhase.NOMINATION:
      return "Nomination period is open. Submit your nomination.";
    case ElectionPhase.SCRUTINY:
      return "Scrutiny of nominations in progress";
    case ElectionPhase.WITHDRAWAL:
      return "Withdrawal period is open";
    case ElectionPhase.SYMBOL_ALLOTMENT:
      return "Symbol allotment in progress";
    case ElectionPhase.CAMPAIGN:
      return "Campaign period";
    case ElectionPhase.POLLING:
      return "Polling in progress";
    case ElectionPhase.COUNTING:
      return "Vote counting in progress";
    case ElectionPhase.RESULTS:
      return "Results declared";
    case ElectionPhase.COMPLETED:
      return "Election completed";
    default:
      return "Election status unavailable";
  }
}

// Check day-wise module availability
export async function getDayModuleConfig(date: Date = new Date()) {
  const config = await getActiveElectionConfig();
  if (!config) return null;

  const dayConfig = await db.dayModuleConfig.findFirst({
    where: {
      electionId: config.id,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
  });

  return dayConfig;
}

// Validate if action is allowed based on phase and time
export async function validateActionAllowed(
  action: "nomination" | "scrutiny" | "withdrawal" | "offline_entry",
): Promise<{ allowed: boolean; reason: string }> {
  const electionStatus = await getElectionStatus();
  const timeWindow = checkPortalTimeWindow();
  const dayConfig = await getDayModuleConfig();

  // Check time window first (except for scrutiny which might have different hours)
  if (action !== "scrutiny" && !timeWindow.isOpen) {
    return {
      allowed: false,
      reason: `Portal is closed. Operating hours: ${timeWindow.opensAt} - ${timeWindow.closesAt} IST`,
    };
  }

  // Check election phase
  if (!electionStatus.isActive) {
    return { allowed: false, reason: "No active election" };
  }

  // Check day-wise configuration if available
  if (dayConfig) {
    switch (action) {
      case "nomination":
        if (!dayConfig.nominationEnabled) {
          return { allowed: false, reason: "Nomination not enabled for today" };
        }
        break;
      case "scrutiny":
        if (!dayConfig.scrutinyEnabled) {
          return { allowed: false, reason: "Scrutiny not enabled for today" };
        }
        break;
      case "withdrawal":
        if (!dayConfig.withdrawalEnabled) {
          return { allowed: false, reason: "Withdrawal not enabled for today" };
        }
        break;
      case "offline_entry":
        if (!dayConfig.offlineEntryEnabled) {
          return {
            allowed: false,
            reason: "Offline entry not enabled for today",
          };
        }
        break;
    }
  } else {
    // Fall back to phase-based check
    switch (action) {
      case "nomination":
        if (!electionStatus.canSubmitNomination) {
          return { allowed: false, reason: "Nomination period is not active" };
        }
        break;
      case "scrutiny":
        if (!electionStatus.canScrutinize) {
          return { allowed: false, reason: "Scrutiny period is not active" };
        }
        break;
      case "withdrawal":
        if (!electionStatus.canWithdraw) {
          return { allowed: false, reason: "Withdrawal period is not active" };
        }
        break;
    }
  }

  return { allowed: true, reason: "Action allowed" };
}
