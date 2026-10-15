import BarAnalytic from "./BarAnalytic";
import CircleAnalytic from "./CircleAnalytic";
export const cardAnalyticTypes = {
  linearChart: "linearChart",
  linearDoubleChart: "linearDoubleChart",
  barChart: "barChart",
  linearBarChart: "linearBarChart",
  circleChart: "circleChart",
};

export const analyticDataTypes = {
  normal: "normal",
  money: "money",
  weight: "weight",
  percentage: "percentage",
  moneyOrPercentage: "moneyOrPercentage",
  date: "date",
  bool: "bool",
};

export const toCardAnalyticTypeComponent = (type) => {
  switch (type) {
    case cardAnalyticTypes.barChart:
      return BarAnalytic;
    case cardAnalyticTypes.circleChart:
      return CircleAnalytic;
  }
  return BarAnalytic;
};
