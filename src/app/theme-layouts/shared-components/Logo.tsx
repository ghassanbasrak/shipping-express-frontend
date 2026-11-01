import { styled, useTheme } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => ({
  '& > .logo-icon': {
    transition: theme.transitions.create(['width', 'height'], {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
}));

function Logo() {
  const theme = useTheme();

  return (
    <Root className="flex items-center">
      <img
        className="logo-icon h-32 w-32 object-contain"
        src={`/assets/images/logo/logo${theme.palette.mode === 'dark' ? '-dark' : ''}.png`}
        alt="Ashamco Express"
      />
    </Root>
  );
}

export default Logo;
