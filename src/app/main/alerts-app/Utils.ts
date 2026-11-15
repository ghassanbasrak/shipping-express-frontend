import type IAlert from "./models/IAlert";
export const alertTypes = {
  normal: "normal",
  onlyImage: "onlyImage",
};

export const alertViewTypes = {
  alert: "alert",
  popup: "popup",
};

export const toAlertTypeTitle = (type: string) => {
  switch (type) {
    case alertTypes.normal:
      return "NORMAL";
    case alertTypes.onlyImage:
      return "ONLY_IMAGE";
  }
  return "NORMAL";
};
export const toAlertTypeColor = (type: string) => {
  switch (type) {
    case alertTypes.normal:
      return "bg-status-info-bg text-status-info-fg";
    case alertTypes.onlyImage:
      return "bg-status-neutral-bg text-status-neutral-fg";
  }
  return "bg-status-info-bg text-status-info-fg";
};

export const toAlertViewTypeTitle = (viewType: string) => {
  switch (viewType) {
    case alertViewTypes.alert:
      return "ALERT";
    case alertViewTypes.popup:
      return "POPUP";
  }
  return "ALERT";
};
export const toAlertViewTypeColor = (viewType: string) => {
  switch (viewType) {
    case alertViewTypes.alert:
      return "bg-status-warning-bg text-status-warning-fg";
    case alertViewTypes.popup:
      return "bg-status-success-bg text-status-success-fg";
  }
  return "bg-status-warning-bg text-status-warning-fg";
};

export function toAlertSaveValues(value: IAlert): IAlert {
  const result: IAlert = {
    id: value.id,
    type: value.type,
    viewType: value.viewType,
  };
  if (value.type === alertTypes.normal) {
    result.title = value.title;
    result.content = value.content;
  }
  if (value.viewType === alertViewTypes.popup && value.imageUrl)
    result.imageUrl = value.imageUrl;
  return result;
}
