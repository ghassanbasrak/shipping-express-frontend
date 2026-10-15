type TimeUnit =
  | "SECONDS"
  | "MINUTES"
  | "MINUTE"
  | "HOURS"
  | "HOUR"
  | "DAYS"
  | "DAY";

interface Duration {
  primary: string;
  primaryLabel: TimeUnit;
  secondary?: string;
  secondaryLabel?: TimeUnit;
}

function toDurationDiffernce(firstDate: Date, secondDate: Date): Duration {
  const duration: Duration = {
    primary: "",
    primaryLabel: "MINUTES",
  };
  const diffInMs = secondDate.getTime() - firstDate.getTime();
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1440) {
    // Less than 24 hours
    if (minutes < 60) {
      if (seconds < 60) {
        duration.primary = `${seconds}`;
        duration.primaryLabel = "SECONDS";
      } else {
        duration.primary = `${minutes}`;
        duration.primaryLabel = minutes > 1 ? "MINUTES" : "MINUTE";
      }
    } else {
      duration.primary = `${Math.floor(minutes / 60)}`;
      duration.primaryLabel = +duration.primary > 1 ? "HOURS" : "HOUR";
      if (minutes % 60 > 0) {
        duration.secondary = `${Math.floor(minutes % 60)}`;
        duration.secondaryLabel = "MINUTES";
      }
    }
  } else {
    duration.primary = `${Math.floor(minutes / 60 / 24)}`;
    duration.primaryLabel = +duration.primary > 1 ? "DAYS" : "DAY";
    if ((minutes / 60) % 24 > 0) {
      duration.secondary = `${Math.floor((minutes / 60) % 24)}`;
      duration.secondaryLabel = +duration.secondary > 1 ? "HOURS" : "HOUR";
    }
  }

  return duration;
}

export default toDurationDiffernce;
