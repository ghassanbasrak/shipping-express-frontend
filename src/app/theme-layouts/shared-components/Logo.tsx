import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const Root = styled('div')(({ theme }) => ({
  '& > .logo-icon': {
    transition: theme.transitions.create(['width', 'height'], {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
}));

function Logo() {
  const { i18n } = useTranslation();

  return (
    <Root className="flex items-center">
      <img
        className="logo-icon h-40 w-auto object-contain"
        src={`/brand/logos/ashamco-${i18n.language.startsWith('ar') ? 'ar' : 'en'}-on-purple.svg`}
        alt={i18n.language.startsWith('ar') ? 'اشامكو إكسبريس' : 'Ashamco Express'}
      />
    </Root>
  );
}

export default Logo;
