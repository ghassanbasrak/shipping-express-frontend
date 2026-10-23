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
      return "bg-blue-500";
    case alertTypes.onlyImage:
      return "bg-purple-500";
  }
  return "bg-blue-500";
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
      return "bg-amber-500";
    case alertViewTypes.popup:
      return "bg-green-500";
  }
  return "bg-amber-500";
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
