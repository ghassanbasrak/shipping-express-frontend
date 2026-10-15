import { useRef, useState, useEffect, useCallback, ReactNode, FC } from "react";
import { Box, Fade, useTheme } from "@mui/material";
import clsx from "clsx";
import Icon from "./Icon";

interface ScrollableHorizontalContainerProps {
  children: ReactNode;
  hideScrollButtons?: boolean;
  fadeColor?: string;
  className?: string;
}

const ScrollableHorizontalContainer: FC<ScrollableHorizontalContainerProps> = ({
  children,
  hideScrollButtons = false,
  fadeColor = "#f6f7f9",
  className = "gap-8 sm:gap-16 px-4",
}) => {
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;

    // For RTL, we need to adjust the logic
    if (isRtl) {
      // In RTL, scrollLeft is negative when not at start
      const isAtStart = scrollLeft >= 0;
      const isAtEnd = scrollLeft <= clientWidth - scrollWidth;

      // For RTL: left fade shows when NOT at start, right fade shows when NOT at end
      setShowLeftFade(!isAtStart);
      setShowRightFade(!isAtEnd);
      setCanScrollLeft(!isAtStart);
      setCanScrollRight(!isAtEnd);
    } else {
      // For LTR
      const isAtStart = scrollLeft <= 0;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1; // -1 for floating point precision

      setShowLeftFade(!isAtStart);
      setShowRightFade(!isAtEnd);
      setCanScrollLeft(!isAtStart);
      setCanScrollRight(!isAtEnd);
    }
  }, [isRtl]);

  useEffect(() => {
    checkScrollPosition();

    const container = containerRef.current;
    if (!container) return;

    // Add resize observer
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    // Add mutation observer to detect when children change
    const mutationObserver = new MutationObserver(checkScrollPosition);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkScrollPosition, children]);

  const handleScroll = () => {
    checkScrollPosition();
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      // In RTL, scrolling "left" means moving positive (towards the start)
      // In LTR, scrolling "left" means moving negative
      const scrollAmount = isRtl ? 300 : -300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      // In RTL, scrolling "right" means moving negative (towards the end)
      // In LTR, scrolling "right" means moving positive
      const scrollAmount = isRtl ? -300 : 300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fadeStartColor = hexToRgba(fadeColor, 1);
  const fadeEndColor = hexToRgba(fadeColor, 0);

  return (
    <Box className={`relative w-full ${className}`}>
      {/* Left fade overlay - position based on RTL */}
      <Fade
        in={showLeftFade}
        style={{ transitionDelay: showLeftFade ? "0ms" : "300ms" }}
      >
        <Box
          className="absolute top-0 h-full w-32 pointer-events-none z-10"
          sx={{
            left: 0,
            right: "auto",
            background: isRtl
              ? `linear-gradient(270deg, ${fadeStartColor} 0%, ${fadeEndColor} 100%)`
              : `linear-gradient(90deg, ${fadeStartColor} 0%, ${fadeEndColor} 100%)`,
          }}
        />
      </Fade>

      {/* Right fade overlay - position based on RTL */}
      <Fade
        in={showRightFade}
        style={{ transitionDelay: showRightFade ? "0ms" : "300ms" }}
      >
        <Box
          className="absolute top-0 h-full w-32 pointer-events-none z-10"
          sx={{
            left: "auto",
            right: 0,
            background: isRtl
              ? `linear-gradient(90deg, ${fadeStartColor} 0%, ${fadeEndColor} 100%)`
              : `linear-gradient(270deg, ${fadeStartColor} 0%, ${fadeEndColor} 100%)`,
          }}
        />
      </Fade>

      {/* Scroll buttons (optional) */}
      {!hideScrollButtons && (
        <>
          <Fade in={canScrollLeft}>
            <button
              onClick={scrollLeft}
              className="absolute top-1/2 transform -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-8 hover:bg-gray-50 transition-colors"
              style={{
                left: isRtl ? "auto" : 8,
                right: isRtl ? 8 : "auto",
              }}
              aria-label="Scroll left"
            >
              <Icon
                type="fa6"
                name={isRtl ? "FaChevronRight" : "FaChevronLeft"}
                size="0.9em"
              />
            </button>
          </Fade>
          <Fade in={canScrollRight}>
            <button
              onClick={scrollRight}
              className="absolute top-1/2 transform -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-8 hover:bg-gray-50 transition-colors"
              style={{
                left: isRtl ? 8 : "auto",
                right: isRtl ? "auto" : 8,
              }}
              aria-label="Scroll right"
            >
              <Icon
                type="fa6"
                name={isRtl ? "FaChevronLeft" : "FaChevronRight"}
                size="0.9em"
              />
            </button>
          </Fade>
        </>
      )}

      {/* Scrollable container */}
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        className={clsx("overflow-x-auto flex flex-nowrap", className)}
        sx={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          // direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ScrollableHorizontalContainer;
