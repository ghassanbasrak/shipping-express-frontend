export interface CircleAnalyticProps {
  title: string;
  series: { label: string; value: number }[];
  color: string;
  textColor?: string;
  className?: string;
}
