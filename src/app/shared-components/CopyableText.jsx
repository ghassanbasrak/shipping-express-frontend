import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { useAppDispatch } from "app/store/hooks";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

function CopyableText({
  label,
  textLabel = "",
  text,
  textLink = false,
  secondText = null,
  secondTextLabel = null,
  secondTextLink = false,
  chip = null,
  className = "",
  double = false,
  dir,
}) {
  const { t } = useTranslation("public");
  const dispatch = useAppDispatch();
  const unsecuredCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Unable to copy to clipboard", err);
    }
    document.body.removeChild(textArea);
  };
  const handleClick = async () => {
    if (window.isSecureContext && navigator.clipboard) {
      unsecuredCopyToClipboard(text);
      await navigator.clipboard.writeText(text);
    } else {
      unsecuredCopyToClipboard(text);
    }
    dispatch(showMessage({ message: t("COPIED_TO_CLIPBOARD") }));
  };
  const handleClickSecond = () => {
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard.writeText(secondText);
    } else {
      unsecuredCopyToClipboard(secondText);
    }
    dispatch(showMessage({ message: t("COPIED_TO_CLIPBOARD") }));
  };
  return (
    <div
      style={{ backgroundColor: "#0f1924" }}
      className="flex flex-col rounded-md text-white p-24 shadow"
      dir={dir}
    >
      <div className="flex items-center justify-between pb-16">
        <div>{label}</div>
        {chip}
      </div>
      <div className="flex items-center justify-between">
        <Typography
          className={clsx("text-13 break-words", className)}
          style={{ width: "92%" }}
        >
          {textLabel && (
            <span className="font-semibold">
              {textLabel && `${textLabel} `}
            </span>
          )}
          {textLink ? (
            <a
              className="bg-white rounded-sm p-2 ms-8 font-semibold"
              style={{ color: "#0f1924" }}
              href={text}
            >
              {text}
            </a>
          ) : (
            <span
              className="bg-white rounded-sm p-2 ms-8 font-semibold"
              style={{ color: "#0f1924" }}
            >
              {text}
            </span>
          )}
        </Typography>
        <Tooltip title={t("COPY_TO_CLIPBOARD")} placement="bottom">
          <IconButton color="inherit" onClick={handleClick}>
            <FuseSvgIcon size={20}>material-solid:content_copy</FuseSvgIcon>
          </IconButton>
        </Tooltip>
      </div>
      {double && (
        <div className="flex items-center justify-between">
          <Typography
            className={clsx("text-13 break-words", className)}
            style={{ width: "92%" }}
          >
            <span className="font-semibold">
              {secondTextLabel && `${secondTextLabel} `}
            </span>
            {secondTextLink ? (
              <a
                className="bg-white rounded-sm p-2 ms-8 font-semibold"
                style={{ color: "#0f1924" }}
                href={secondText}
              >
                {secondText}
              </a>
            ) : (
              <span
                className="bg-white rounded-sm p-2 ms-8 font-semibold"
                style={{ color: "#0f1924" }}
              >
                {secondText}
              </span>
            )}
          </Typography>
          <Tooltip title={t("COPY_TO_CLIPBOARD")} placement="bottom">
            <IconButton color="inherit" onClick={handleClickSecond}>
              <FuseSvgIcon size={20}>material-solid:content_copy</FuseSvgIcon>
            </IconButton>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default CopyableText;
