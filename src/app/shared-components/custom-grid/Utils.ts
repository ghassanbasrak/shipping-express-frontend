import { ReactNode } from "react";
import { FetchStatus } from "src/app/main/utils/dataStatus";

export interface CustomGridProps<T> {
  data?: (T & { id: string })[];
  status?: FetchStatus;
  error?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  gridColumns?: number;
  gridSmColumns?: number;
  gridMdColumns?: number;
  gridLgColumns?: number;
  gap?: number;
  noDataMessage?: string;
  onChangePagination?: (pagination: { page: number; pageSize: number }) => void;
  renderGridItem: (item: T & { id: string }, index: number) => ReactNode;
  affectedMemoVars?: any[];
  hidePagination?: boolean;
  className?: string;
}

export interface NoGridItemsOverlayProps {
  title?: string;
}
