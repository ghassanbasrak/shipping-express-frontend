export interface BarAnalyticProps {
  title: string;
  series: { label: string; value: number }[];
  color: string;
  textColor?: string;
  plotTitle?: string;
  maxColumns?: number;
  className?: string;
}
