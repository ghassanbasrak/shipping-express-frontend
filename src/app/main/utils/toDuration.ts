type TimeUnit = "MINUTES" | "MINUTE" | "HOURS" | "HOUR";

interface Duration {
  primary: string;
  primaryLabel: TimeUnit;
  secondary?: string;
  secondaryLabel?: TimeUnit;
}

function toDuration(d: number): Duration {
  const duration: Duration = {
    primary: "",
    primaryLabel: "MINUTES",
  };
  if (d < 60) {
    duration.primary = `${d}`;
    duration.primaryLabel = "MINUTES";
  } else {
    duration.primary = `${Math.floor(d / 60)}`;
    duration.primaryLabel = duration.primary === "1" ? "HOUR" : "HOURS";
    if (d % 60 > 0) {
      duration.secondary = `${d % 60}`;
      duration.secondaryLabel = "MINUTES";
    }
  }
  return duration;
}

export default toDuration;
