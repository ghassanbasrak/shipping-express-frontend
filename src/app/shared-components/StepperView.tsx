import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  Box,
  Button,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  stepConnectorClasses,
  styled,
  useTheme,
  Hidden,
  MobileStepper,
  Theme,
  ExtendButtonBase,
  ButtonTypeMap,
  ButtonProps,
  BadgeProps,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import Icon from "./Icon";
import clsx from "clsx";
import SwipeableViews from "react-swipeable-views";
import { Fragment, ReactNode, useEffect, useState } from "react";
import FusePageCarded from "@fuse/core/FusePageCarded";
import { useDeepCompareEffect, useThemeMediaQuery } from "@fuse/hooks";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { useAppDispatch } from "app/store/hooks";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { z } from "zod";
import { motion } from "framer-motion";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.background.default
        : "#eaeaf0",
    padding: 10,
    borderRadius: "50%",
  },
  active: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

function StepperIcon({ active, completed, className, icon }) {
  const classes = useStyles();
  const iconContent = typeof icon === "object" && icon.icon ? icon.icon : icon;
  const IconBadge =
    typeof icon === "object" && icon.icon ? icon.badge : Fragment;

  return (
    <IconBadge
      {...(typeof icon === "object" && icon.badgeProps ? icon.badgeProps : {})}
    >
      <div
        className={clsx(classes.root, {
          [classes.active]: active || completed,
        })}
      >
        {typeof iconContent === "string" ? (
          <Icon
            type={iconContent.split("-")[0]}
            name={iconContent.split("-")[1]}
            size="1.3em"
          />
        ) : (
          iconContent
        )}
      </div>
    </IconBadge>
  );
}
const StepperConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 5,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1,
  },
}));
function StepperView<T>({
  defaultActiveStep = 0,
  resetValues,
  steps,
  className = "",
  prefixHeader,
  suffixHeader,
  breadcrumbs,
  fireUpdateHeightItem,
  finishIcon,
  finishTitle,
  customErrorMessage,
  detailedErrorMessage = true,
  handleSubmit,
  onFinish,
  loadingSubmit = false,
  slideMaxWidth = "sm:max-w-5xl",
}: {
  defaultActiveStep?: number;
  resetValues?: any[];
  steps: {
    icon:
      | string
      | ReactNode
      | {
          icon: string | ReactNode;
          badge: (props) => JSX.Element;
          badgeProps: BadgeProps;
        };
    label: ReactNode;
    schema?: z.ZodObject<{}>;
    getFieldErrorMessage?: (
      path: (string | number)[],
      message: string,
      errorMessageProps: any
    ) => string;
    errorMessageProps?: any;
    Slide?: (props: {
      updateSwipeableViewHeight: () => void;
      index?: number;
      activeStep?: number;
    }) => JSX.Element;
    previousButtonProps?: ButtonProps;
    previousButtonTitle?: string;
    nextButtonProps?: LoadingButtonProps;
    nextButtonTitle?: string;
    submitable?: boolean;
    onSubmit?: (values: Partial<T>) => Promise<void>;
    loadingSubmit?: boolean;
    otherActions?: {
      node: ExtendButtonBase<ButtonTypeMap<{}, "button">>;
      props?: object;
      onClick?: (
        index: number,
        values: Partial<T>,
        handleNext: () => void
      ) => void;
      position?: "before" | "after";
    }[];
    otherActionsMobile?: {
      node: ExtendButtonBase<ButtonTypeMap<{}, "button">>;
      props?: object;
      onClick?: (
        index: number,
        values: Partial<T>,
        handleNext: () => void
      ) => void;
      position?: "before" | "after";
    }[];
    props?: object;
  }[];
  className?: string;
  prefixHeader?: ReactNode;
  suffixHeader?: ReactNode;
  breadcrumbs?: ReactNode;
  fireUpdateHeightItem?: any;
  finishIcon?: string;
  finishTitle?: string;
  customErrorMessage?: string;
  detailedErrorMessage?: boolean;
  handleSubmit?: (values: Partial<T>) => void;
  onFinish?: () => void;
  loadingSubmit?: boolean;
  slideMaxWidth?: string;
}) {
  const { t } = useTranslation("public");
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const methods = useFormContext<T>();
  const { control, formState, getFieldState, getValues, setValue, watch } =
    methods;
  const [activeStep, setActiveStep] = useState(defaultActiveStep);
  const [swipeableActions, setSwipeableActions] = useState(null);
  const [currentSchema, setCurrentSchema] = useState<z.ZodObject<{}>>(
    steps[defaultActiveStep].schema
  );
  const updateSwipeableViewHeight = () => {
    if (swipeableActions) {
      swipeableActions.updateHeight();
    }
  };
  useEffect(() => {
    updateSwipeableViewHeight();
  }, [swipeableActions, activeStep, fireUpdateHeightItem]);

  useDeepCompareEffect(() => {
    setActiveStep(defaultActiveStep);
    setCurrentSchema(steps[defaultActiveStep].schema);
  }, [resetValues]);

  //   updateSwipeableViewHeight();
  function handleNextChange() {
    setCurrentSchema(steps[activeStep + 1].schema);
    setActiveStep(activeStep + 1);
  }
  function handleNext() {
    if (activeStep + 1 < steps.length) {
      if (currentSchema) {
        const result = currentSchema.safeParse(getValues());
        if (result.success) {
          if (steps[activeStep].submitable && steps[activeStep].onSubmit) {
            steps[activeStep]
              .onSubmit({ ...getValues() })
              .then(handleNextChange)
              .catch(() => {});
          } else {
            handleNextChange();
          }
        } else if (result.success === false) {
          dispatch(
            showMessage({
              message:
                customErrorMessage ??
                (detailedErrorMessage &&
                result.error?.issues &&
                result.error.issues.length > 0 ? (
                  <>
                    <div>{t("CANT_MOVE_TO_NEXT_FORM_STEP")}</div>
                    <ul className="mt-16 list-disc px-20">
                      {result.error.issues.map((error, index) => (
                        <li key={index}>
                          {steps[activeStep].getFieldErrorMessage
                            ? steps[activeStep].getFieldErrorMessage(
                                error.path,
                                error.message,
                                steps[activeStep].errorMessageProps
                              )
                            : `${error.path.join(", ")}: ${error.message}`}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  t("PLEASE_FILL_ALL_REQUIRED_FIELDS")
                )),
              variant: "error",
              autoHideDuration:
                detailedErrorMessage &&
                result.error?.issues &&
                result.error.issues.length > 0
                  ? 5000
                  : 2000,
              anchorOrigin: {
                vertical: "top",
                horizontal: "right",
              },
            })
          );
        }
      } else {
        setCurrentSchema(steps[activeStep + 1].schema);
        setActiveStep(activeStep + 1);
      }
    }
  }
  function handleFinish() {
    if (currentSchema) {
      const result = currentSchema.safeParse(getValues());
      if (result.success) {
        if (steps[activeStep].submitable && steps[activeStep].onSubmit) {
          steps[activeStep]
            .onSubmit({ ...getValues() })
            .then(onFinish)
            .catch(() => {});
        } else {
          onFinish?.();
        }
      } else if (result.success === false) {
        dispatch(
          showMessage({
            message:
              customErrorMessage ??
              (detailedErrorMessage &&
              result.error?.issues &&
              result.error.issues.length > 0 ? (
                <>
                  <div>{t("CANT_MOVE_TO_NEXT_FORM_STEP")}</div>
                  <ul className="mt-16 list-disc px-20">
                    {result.error.issues.map((error, index) => (
                      <li key={index}>
                        {steps[activeStep].getFieldErrorMessage
                          ? steps[activeStep].getFieldErrorMessage(
                              error.path,
                              error.message,
                              steps[activeStep].errorMessageProps
                            )
                          : `${error.path.join(", ")}: ${error.message}`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                t("PLEASE_FILL_ALL_REQUIRED_FIELDS")
              )),
            variant: "error",
            autoHideDuration:
              detailedErrorMessage &&
              result.error?.issues &&
              result.error.issues.length > 0
                ? 5000
                : 2000,
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
          })
        );
      }
    } else {
      onFinish();
    }
  }
  function handlePrevious() {
    if (activeStep - 1 >= 0) {
      setCurrentSchema(steps[activeStep - 1].schema);
      setActiveStep(activeStep - 1);
    }
  }
  return (
    <FusePageCarded
      header={
        <div className="flex flex-col w-full space-y-24 py-16 px-16">
          {breadcrumbs}
          <Hidden smUp>
            <MobileStepper
              steps={steps.length}
              position="static"
              activeStep={activeStep}
              className="border-1 rounded-md w-full"
              nextButton={
                <div className="flex items-center space-x-4">
                  {steps[activeStep].otherActionsMobile
                    ?.filter((action) => action.position === "before")
                    ?.map(({ node: Action, props, onClick }, index) => (
                      <Action
                        key={index}
                        {...(props ?? {})}
                        onClick={(e) =>
                          onClick?.(
                            activeStep,
                            { ...getValues() },
                            handleNextChange
                          )
                        }
                      />
                    ))}
                  <LoadingButton
                    className="whitespace-nowrap px-4"
                    variant="contained"
                    color="primary"
                    onClick={(event) => {
                      if (activeStep + 1 === steps.length) {
                        if (handleSubmit) {
                          handleSubmit({ ...getValues() });
                        } else {
                          handleFinish();
                        }
                      } else {
                        handleNext();
                      }
                    }}
                    endIcon={
                      <FuseSvgIcon size={22}>
                        {activeStep + 1 === steps.length
                          ? finishIcon ?? "material-solid:file_download_done"
                          : theme.direction === "ltr"
                            ? "material-outline:navigate_next"
                            : "material-outline:navigate_before"}
                      </FuseSvgIcon>
                    }
                    loading={loadingSubmit}
                    loadingPosition="end"
                    {...(steps[activeStep].nextButtonProps ?? {})}
                  >
                    <span>
                      {steps[activeStep].nextButtonTitle ??
                        t(
                          activeStep + 1 === steps.length
                            ? finishTitle ?? "FINISH"
                            : "NEXT"
                        )}
                    </span>
                  </LoadingButton>
                  {steps[activeStep].otherActionsMobile
                    ?.filter((action) => action.position === "after")
                    ?.map(({ node: Action, props, onClick }, index) => (
                      <Action
                        key={index}
                        {...(props ?? {})}
                        onClick={(e) =>
                          onClick?.(
                            activeStep,
                            { ...getValues() },
                            handleNextChange
                          )
                        }
                      />
                    ))}
                </div>
              }
              backButton={
                <Button
                  className="whitespace-nowrap px-4"
                  variant="contained"
                  color="primary"
                  onClick={(event) => {
                    handlePrevious();
                  }}
                  startIcon={
                    <FuseSvgIcon size={22}>
                      {theme.direction === "rtl"
                        ? "material-outline:navigate_next"
                        : "material-outline:navigate_before"}
                    </FuseSvgIcon>
                  }
                  disabled={!(activeStep - 1 >= 0)}
                >
                  {t("PREVIOUS")}
                </Button>
              }
            />
          </Hidden>
          <Hidden smDown>
            <div className="w-full flex items-center justify-round self-center px-48">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
              >
                <Button
                  className="whitespace-nowrap"
                  variant="contained"
                  color="primary"
                  onClick={(event) => {
                    handlePrevious();
                  }}
                  startIcon={
                    <FuseSvgIcon size={22}>
                      {theme.direction === "rtl"
                        ? "material-outline:navigate_next"
                        : "material-outline:navigate_before"}
                    </FuseSvgIcon>
                  }
                  disabled={!(activeStep - 1 >= 0)}
                  {...(steps[activeStep].previousButtonProps ?? {})}
                >
                  {steps[activeStep].previousButtonTitle ?? t("PREVIOUS")}
                </Button>
              </motion.div>
              <Stepper
                className="w-full"
                activeStep={activeStep}
                alternativeLabel
                connector={<StepperConnector />}
              >
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      icon={step.icon as any}
                      StepIconComponent={StepperIcon}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
              <div className="flex items-center space-x-8">
                {steps[activeStep].otherActions
                  ?.filter((action) => action.position === "before")
                  ?.map(({ node: Action, props, onClick }, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                    >
                      <Action
                        {...(props ?? {})}
                        onClick={(e) =>
                          onClick?.(
                            activeStep,
                            { ...getValues() },
                            handleNextChange
                          )
                        }
                      />
                    </motion.div>
                  ))}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                >
                  <LoadingButton
                    className="whitespace-nowrap"
                    variant="contained"
                    color="primary"
                    onClick={(event) => {
                      if (activeStep + 1 === steps.length) {
                        if (handleSubmit) {
                          handleSubmit({ ...getValues() });
                        } else {
                          handleFinish();
                        }
                      } else {
                        handleNext();
                      }
                    }}
                    endIcon={
                      <FuseSvgIcon size={22}>
                        {activeStep + 1 === steps.length
                          ? finishIcon ?? "material-solid:file_download_done"
                          : theme.direction === "ltr"
                            ? "material-outline:navigate_next"
                            : "material-outline:navigate_before"}
                      </FuseSvgIcon>
                    }
                    loading={loadingSubmit}
                    loadingPosition="end"
                    {...(steps[activeStep].nextButtonProps ?? {})}
                  >
                    <span>
                      {steps[activeStep].nextButtonTitle ??
                        t(
                          activeStep + 1 === steps.length
                            ? finishTitle ?? "FINISH"
                            : "NEXT"
                        )}
                    </span>
                  </LoadingButton>
                </motion.div>
                {steps[activeStep].otherActions
                  ?.filter((action) => action.position === "after")
                  ?.map(({ node: Action, props, onClick }, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                    >
                      <Action
                        {...(props ?? {})}
                        onClick={(e) =>
                          onClick?.(
                            activeStep,
                            { ...getValues() },
                            handleNextChange
                          )
                        }
                      />
                    </motion.div>
                  ))}
              </div>
            </div>
          </Hidden>
        </div>
      }
      content={
        <div className={clsx("flex flex-col items-center w-full", className)}>
          <Box
            component="div"
            sx={{
              "& .nextSlide": {
                position: "fixed",
                top: 235,
                right: 0,
                zIndex: 11,
              },
              "& .previousSlide": {
                position: "fixed",
                top: 235,
                left: 0,
                zIndex: 11,
              },
            }}
            className={clsx("relative p-16 max-w-full w-full", slideMaxWidth)}
          >
            <SwipeableViews
              axis={theme.direction === "rtl" ? "x-reverse" : "x"}
              index={activeStep}
              className="min-h-full"
              enableMouseEvents={false}
              onChangeIndex={updateSwipeableViewHeight}
              action={(actions) => setSwipeableActions(actions)}
              animateHeight
            >
              {steps.map((step, index) => {
                const Slide = step.Slide;
                return (
                  <Slide
                    key={index}
                    updateSwipeableViewHeight={updateSwipeableViewHeight}
                    activeStep={activeStep}
                    index={index}
                    {...(step.props ?? {})}
                  />
                );
              })}
            </SwipeableViews>
          </Box>
        </div>
      }
      scroll={"content"}
    />
  );
}

export default StepperView;
