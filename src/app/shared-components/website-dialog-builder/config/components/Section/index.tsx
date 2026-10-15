import { CSSProperties, ReactNode } from "react";
import styles from "./styles.module.css";
import getClassNameFactory from "../../getClassNameFactory";

const getClassName = getClassNameFactory("Section", styles);

export type SectionProps = {
  className?: string;
  children: ReactNode;
  padding?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  maxWidth?: string;
  style?: CSSProperties;
};

export const Section = ({
  children,
  className,
  padding,
  paddingVertical,
  paddingHorizontal,
  maxWidth,
  style = {},
}: SectionProps) => {
  return (
    <div
      className={`${getClassName()}${className ? ` ${className}` : ""}`}
      style={{
        ...style,
        padding,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: paddingVertical,
        paddingBottom: paddingVertical,
      }}
    >
      <div className={getClassName("inner")} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
};
