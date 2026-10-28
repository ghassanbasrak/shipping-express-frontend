import { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import LanguageSwitcher from "app/theme-layouts/shared-components/LanguageSwitcher";

export default function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Box
      className="flex flex-1 min-h-full items-center justify-center p-16 sm:p-32"
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
      }}
    >
      <Paper className="w-full max-w-640 p-24 sm:p-40 rounded-16">
        <div className="flex justify-between items-center mb-24">
          <Link to="/">
            <img
              src={`/assets/images/logo/logo-text${theme.palette.mode === "dark" ? "-dark" : ""}.png`}
              alt="Ashamco Express"
              className="max-w-200 h-auto"
            />
          </Link>
          <LanguageSwitcher />
        </div>
        <Typography component="h1" variant="h5" className="mb-24 font-bold">
          {title}
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}
