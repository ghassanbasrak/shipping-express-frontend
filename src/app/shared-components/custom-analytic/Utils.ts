import { ReactNode } from "react";
import { FetchStatus } from "src/app/main/utils/dataStatus";

export enum AnalyticDataTypes {
  normal,
  money,
  weight,
  percentage,
  moneyOrPercentage,
  date,
  bool,
}

export interface CustomAnalyticProps<T> {
  yKey?: string;
  xKey?: string;
  zKey?: string;
  data?: T[];
  zGetter?: (item: T) => any;
  zRender?: (value: number) => string;
  zLabel?: string;
  status?: FetchStatus;
  pointLabel?: string;
  error?: string;
  total?: number;
  pageSizeOptions?: number[];
  page?: number;
  pageSize?: number;
  label?: string;
  fields?: string[];
  dataType?: AnalyticDataTypes;
  onChangePagination?: (params: { page: number; pageSize: number }) => void;
  hideToolbar?: boolean;
  noCard?: boolean;
  header?: boolean;
  headerValue?: string | number;
  headerTitle?: string;
  headerSuffix?: ReactNode;
  moneyChangesLabel?: boolean;
  moneyChangesLabelGetter?: (value: number) => string;
  placeholder?: string;
  isMoneyGetter?: (value: any) => boolean;
  locale?: boolean;
}
