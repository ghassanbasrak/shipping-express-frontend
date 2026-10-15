import { FetchStatus } from "src/app/main/utils/dataStatus";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Box, Pagination, Stack, useTheme } from "@mui/material";
import FuseLoading from "@fuse/core/FuseLoading";
import { useMemo } from "react";
import clsx from "clsx";
import NoGridItemsOverlay from "./shared-components/NoGridItemsOverlay";
import { CustomGridProps } from "./Utils";

function CustomGrid<T extends { id: string }>({
  data,
  status = FetchStatus.loading,
  error,
  total,
  page = 0,
  pageSize = 10,
  gridColumns = 1,
  gridSmColumns = 2,
  gridMdColumns = 2,
  gridLgColumns = 3,
  gap = 16,
  noDataMessage,
  onChangePagination,
  renderGridItem,
  affectedMemoVars = [],
  hidePagination = false,
  className = "p-16",
}: CustomGridProps<T>) {
  const { t } = useTranslation("public");
  const theme = useTheme();

  const containerMotion = useMemo(
    () => ({
      show: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    [],
  );

  const itemMotion = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: 20,
      },
      show: {
        opacity: 1,
        y: 0,
      },
    }),
    [],
  );

  return (
    <div className={clsx("flex flex-col flex-1 w-full mx-auto", className)}>
      {useMemo(() => {
        return status === FetchStatus.loading ? (
          <div className="flex items-center justify-center h-full py-128">
            <FuseLoading />
          </div>
        ) : data && data.length > 0 ? (
          <div className="w-full flex flex-col min-h-full">
            <motion.div
              className={clsx(
                `grid gap-${gap}`,
                `grid-cols-${gridColumns}`,
                `sm:grid-cols-${gridSmColumns}`,
                `md:grid-cols-${gridMdColumns}`,
                `lg:grid-cols-${gridLgColumns}`,
              )}
              variants={containerMotion}
              initial="hidden"
              animate="show"
            >
              {data.map((item, index) => (
                <motion.div variants={itemMotion} key={item.id}>
                  {renderGridItem(item, index)}
                </motion.div>
              ))}
            </motion.div>
            {!hidePagination && (
              <Stack spacing={2} alignItems="center" className="mt-32">
                <Pagination
                  count={Math.ceil(total! / pageSize!)}
                  page={page + 1}
                  color="primary"
                  onChange={(event, value) =>
                    onChangePagination &&
                    onChangePagination({ page: value - 1, pageSize })
                  }
                />
              </Stack>
            )}
          </div>
        ) : (
          <NoGridItemsOverlay title={noDataMessage ?? t("NO_ITEMS")} />
        );
      }, [
        data,
        status,
        theme,
        gap,
        gridColumns,
        gridSmColumns,
        gridMdColumns,
        gridLgColumns,
        total,
        pageSize,
        onChangePagination,
        ...affectedMemoVars,
      ])}
    </div>
  );
}

export default CustomGrid;
