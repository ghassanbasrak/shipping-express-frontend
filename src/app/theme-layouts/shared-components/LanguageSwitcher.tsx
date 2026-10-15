import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  changeLanguage,
  LanguageType,
  selectCurrentLanguage,
  selectLanguages,
} from "app/store/i18nSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { IconButton } from "@mui/material";
import { useThemeMediaQuery } from "@fuse/hooks";

/**
 * The language switcher.
 */
function LanguageSwitcher({
  color,
  withoutIcon = false,
}: {
  color?: string;
  withoutIcon?: boolean;
}) {
  const currentLanguage = useAppSelector(selectCurrentLanguage);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("md"));
  const languages = useAppSelector(selectLanguages);
  const [menu, setMenu] = useState<null | HTMLElement>(null);
  const dispatch = useAppDispatch();

  const langMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenu(event.currentTarget);
  };

  const langMenuClose = () => {
    setMenu(null);
  };

  function handleLanguageChange(lng: LanguageType) {
    dispatch(changeLanguage(lng.id));

    langMenuClose();
    window.location.reload();
  }

  return (
    <>
      {isMobile ? (
        <IconButton
          onClick={langMenuClick}
          sx={{ color: color ?? ((theme) => theme.palette.action.active) }}
          className="min-w-32 md:min-w-64 w-32 md:w-64 px-4"
        >
          <FuseSvgIcon size={20}>material-outline:language</FuseSvgIcon>
        </IconButton>
      ) : (
        <Button
          // className="h-40 min-w-24 md:min-w-40 w-24 md:w-40"
          className="h-40 min-w-40 md:min-w-64 w-40 md:w-64 px-4"
          onClick={langMenuClick}
          sx={{ color: color ?? ((theme) => theme.palette.action.active) }}
          startIcon={
            !withoutIcon && (
              <FuseSvgIcon size={20} color={!color ? "action" : undefined}>
                material-outline:language
              </FuseSvgIcon>
            )
          }
        >
          {/* <img
          className="mx-4 min-w-20"
          src={`assets/images/flags/${currentLanguage.flag}.svg`}
          alt={currentLanguage.title}
        /> */}

          <Typography className="font-semibold uppercase">
            {currentLanguage.id}
          </Typography>
        </Button>
      )}
      {/* <Button
				className="h-40 w-64"
				onClick={langMenuClick}
			>
				<img
					className="mx-4 min-w-20"
					src={`assets/images/flags/${currentLanguage.flag}.svg`}
					alt={currentLanguage.title}
				/>

				<Typography
					className="mx-4 font-semibold uppercase"
					color="text.secondary"
				>
					{currentLanguage.id}
				</Typography>
			</Button> */}

      <Popover
        open={Boolean(menu)}
        anchorEl={menu}
        onClose={langMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        classes={{
          paper: "py-8",
        }}
      >
        {languages.map((lng) => (
          <MenuItem key={lng.id} onClick={() => handleLanguageChange(lng)}>
            {/* <ListItemIcon className="min-w-40">
              <img
                className="min-w-20"
                src={`assets/images/flags/${lng.flag}.svg`}
                alt={lng.title}
              />
            </ListItemIcon> */}
            <ListItemText primary={lng.title} />
          </MenuItem>
        ))}

        {/* <MenuItem
					component={Link}
					to="/documentation/configuration/multi-language"
					onClick={langMenuClose}
					role="button"
				>
					<ListItemText primary="Learn More" />
				</MenuItem> */}
      </Popover>
    </>
  );
}

export default LanguageSwitcher;
