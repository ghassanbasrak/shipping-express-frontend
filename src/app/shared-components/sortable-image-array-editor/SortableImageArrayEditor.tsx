import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography, alpha, IconButton } from "@mui/material";
import FuseUtils from "@fuse/utils";
import { useCallback, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MediaInput from "app/shared-components/media-input/MediaInput";
import Icon from "app/shared-components/Icon";
import { useThemeMediaQuery } from "@fuse/hooks";
import clsx from "clsx";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

export const SortableImageItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

interface SortableImageArrayEditorProps {
  name: string;
  label: string;
  imageUrls?: string[];
}

function SortableImageArrayEditor({
  name,
  label,
  imageUrls = [],
}: SortableImageArrayEditorProps) {
  const { t } = useTranslation("generalPagesApp");
  const { watch, setValue, getFieldState, getValues } = useFormContext<any>();
  const values = (watch(name) || []) as string[];

  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("md"));

  const updateValues = (nextValues: string[]) => {
    setValue(name, nextValues, { shouldDirty: true });
  };

  const handleAddImage = useCallback(() => {
    updateValues([...(values || []), ""]);
  }, [values, updateValues]);

  useEffect(() => {
    // Ensure all items have __id for dragging
    const currentValues = getValues(name) || [];
    const updatedValues = currentValues.map(
      (value: string | { __id: string; url: string }, index: number) => {
        if (typeof value === "string") {
          return value;
        }
        return value;
      },
    );
    if (JSON.stringify(updatedValues) !== JSON.stringify(currentValues)) {
      updateValues(updatedValues);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = parseInt(active.id as string);
        const newIndex = parseInt(over?.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          const updatedFields = arrayMove(values, oldIndex, newIndex);
          updateValues(updatedFields);
        }
      }
    },
    [values, updateValues],
  );

  return (
    <div className="mt-8 mb-16">
      <Box
        component="div"
        className="py-8 ps-16 pe-8 mb-16 w-full rounded-lg flex justify-between"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}
      >
        <Typography className="text-15 font-bold">{label}</Typography>
        <Button
          className="whitespace-nowrap"
          variant="contained"
          color="primary"
          size="small"
          startIcon={<FuseSvgIcon size={17}>material-solid:add</FuseSvgIcon>}
          onClick={handleAddImage}
        >
          {t("ADD_IMAGE_URL")}
        </Button>
      </Box>

      {getFieldState(name)?.invalid ? (
        <Typography color="error" className="text-14 my-8" textAlign="center">
          {getFieldState(name)?.error?.message}
        </Typography>
      ) : null}

      {!values || values.length === 0 ? (
        <div className="flex flex-1 items-center justify-center mt-24 mb-24">
          <Typography color="text.secondary" variant="h6">
            {t("NO_IMAGES")}
          </Typography>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={values.map((_, index) => index.toString())}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-16 w-full mt-24 mb-16">
              {values.map((value, index) => (
                <div key={`${name}-${index}`}>
                  <SortableImageItem id={index.toString()}>
                    <Box
                      component="div"
                      className="relative"
                      sx={{
                        cursor: "grab",
                        "&:active": {
                          cursor: "grabbing",
                        },
                      }}
                    >
                      <IconButton
                        className={clsx(
                          "absolute z-50",
                          isMobile ? "top-4 right-2" : "top-4 right-8",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateValues(
                            values.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          );
                        }}
                        color="error"
                      >
                        <Icon
                          type="fa6"
                          name="FaRegTrashCan"
                          size={isMobile ? "0.6em" : "0.8em"}
                        />
                      </IconButton>
                      <MediaInput
                        label={`${t("IMAGE")} ${index + 1}`}
                        name={`${name}.${index}`}
                        size={isMobile ? "small" : "medium"}
                        className="w-full"
                        imageUrl={value || ""}
                      />
                    </Box>
                  </SortableImageItem>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default SortableImageArrayEditor;
