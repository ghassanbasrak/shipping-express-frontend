import { Rating, Tooltip, Typography } from "@mui/material";
import Icon from "./Icon";

function RatingView({
  ratings,
  ratingsCount,
  onClick,
  size = "small",
  precision = 0.5,
  tooltipPlacement = "bottom",
  onChange,
  hideTooltip = false,
  hideRatingsCount = false,
  className = "",
}: {
  ratings: { value: number }[] | number;
  ratingsCount?: number;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  precision?: number;
  tooltipPlacement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "bottom-end"
    | "bottom-start"
    | "left-end"
    | "left-start"
    | "right-end"
    | "right-start"
    | "top-end"
    | "top-start";
  hideTooltip?: boolean;
  hideRatingsCount?: boolean;
  onChange?: (newValue: number) => void;
  className?: string;
}) {
  function calcRating() {
    var r = 0.0;
    if (ratings) {
      if (typeof ratings === "number") return ratings;
      for (var i = 0; i < ratings.length; i++) {
        if (ratings[i].value) {
          r += ratings[i].value;
        }
      }
      return r / (ratings.length === 0 ? 1 : ratings.length);
    }
    return 0;
  }
  const isThereRating = true;
  // const isThereRating = ratings && ratings.length > 0;
  const rating = calcRating();
  return isThereRating ? (
    <Tooltip
      arrow
      title={!hideTooltip && rating.toFixed(1)}
      placement={tooltipPlacement}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -5],
              },
            },
          ],
        },
      }}
      className="flex items-center"
    >
      <div className="flex items-center space-x-8">
        <Rating
          className={className}
          onClick={onClick}
          size={size}
          precision={precision}
          value={rating}
          onChange={(e, newValue) => onChange?.(newValue)}
          readOnly={!onChange}
        />
        {!hideRatingsCount &&
          ratingsCount !== undefined &&
          ratingsCount !== null && (
            <Typography
              className="flex items-center space-x-8 text-14"
              color="text.disabled"
            >
              <Icon type="fa6" name="FaRegCommentDots" size="1em" />
              <span className="mt-2">{ratingsCount}</span>
            </Typography>
          )}
      </div>
    </Tooltip>
  ) : (
    <div></div>
  );
}

export default RatingView;
