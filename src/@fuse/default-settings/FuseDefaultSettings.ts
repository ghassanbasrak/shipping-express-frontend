import { fuseDark } from '@fuse/colors';
import { lightBlue, red } from '@mui/material/colors';
import { tokens } from '../../brand/tokens';
import { createTheme } from '@mui/material/styles';
import qs from 'qs';
import { ThemeOptions } from '@mui/material/styles/createTheme';
import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';

const { purple, status, neutral, semantic } = tokens.color;

/**
 * The defaultTheme object defines the default color palette for the application.
 */
const defaultTheme = {
	palette: {
		mode: 'light',
		text: {
			primary: neutral.ink,
			secondary: neutral.gray,
			disabled: '#A79BB8'
		},
		common: {
			black: neutral.ink,
			white: 'rgb(255, 255, 255)'
		},
		primary: {
			light: purple['600'],
			main: purple['700'],
			dark: purple['800'],
			contrastDefaultColor: 'light'
		},
		secondary: {
			light: purple['500'],
			main: purple['600'],
			dark: purple['700']
		},
		background: {
			paper: '#FFFFFF',
			default: semantic.light.background
		},
		error: {
			light: '#D6685D',
			main: status.error,
			dark: tokens.color.tone.error.fg
		}
	}
};

/**
 * The defaultSettings object defines the default settings for the Fuse application.
 */
export const defaultSettings = {
	customScrollbars: true,
	direction: 'ltr',
	theme: {
		main: defaultTheme,
		navbar: defaultTheme,
		toolbar: defaultTheme,
		footer: defaultTheme
	}
};

/**
 * The getParsedQuerySettings function parses the query string to retrieve the default settings for the Fuse application.
 * It returns a FuseSettingsConfigType object that can be used to configure the application.
 */
export function getParsedQuerySettings() {
	const parsedQueryString = qs.parse(window.location.search, { ignoreQueryPrefix: true });

	const { defaultSettings = {} } = parsedQueryString;

	if (typeof defaultSettings === 'string') {
		// Handle the case when defaultSettings is a string
		return JSON.parse(defaultSettings) as FuseSettingsConfigType;
	}

	return {};

	// Generating route params from settings
	/* const settings = qs.stringify({
        defaultSettings: JSON.stringify(defaultSettings, {strictNullHandling: true})
    });
    console.info(settings); */
}

/**
 * The defaultThemeOptions object defines the default options for the MUI theme.
 */
export const defaultThemeOptions = {
	typography: {
		fontFamily: tokens.font.stack.sans,
		fontWeightLight: 300,
		fontWeightRegular: 400,
		fontWeightMedium: 500,
		fontWeightBold: 700,
		// Brand type scale (tokens.type): display 32, h1 28, h2 22, h3 18, bodyLg 16, label 14, caption 12, overline 11
		h1: { fontSize: '3.2rem', fontWeight: 700, lineHeight: 1.25 },
		h2: { fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.29 },
		h3: { fontSize: '2.2rem', fontWeight: 600, lineHeight: 1.36 },
		h4: { fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.44 },
		h5: { fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.5 },
		h6: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.5 },
		subtitle1: { fontSize: '1.6rem', fontWeight: 500, lineHeight: 1.6 },
		subtitle2: { fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.45 },
		button: { fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.4 },
		caption: { fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.5 },
		overline: { fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.45 }
	},
	components: {
		MuiAppBar: {
			defaultProps: {
				enableColorOnDark: true
			},
			styleOverrides: {
				root: {
					backgroundImage: 'none'
				}
			}
		},
		MuiPickersPopper: {
			styleOverrides: {
				root: {
					zIndex: 99999
				}
			}
		},
		MuiAutocomplete: {
			styleOverrides: {
				popper: {
					zIndex: 99999
				}
			}
		},
		MuiButtonBase: {
			defaultProps: {
				disableRipple: true
			}
		},
		MuiButton: {
			defaultProps: {
				variant: 'text',
				color: 'inherit'
			},
			styleOverrides: {
				root: {
					textTransform: 'none'

					// lineHeight: 1,
				},
				sizeMedium: {
					borderRadius: 10,
					height: 40,
					minHeight: 40,
					maxHeight: 40,
				  },
				  sizeSmall: {
					borderRadius: "10px",
				  },
				  sizeLarge: {
					borderRadius: "10px",
				  },
				contained: {
					boxShadow: 'none',
					'&:hover, &:focus': {
						boxShadow: '0 8px 18px -8px rgba(58, 31, 93, .45)'
					}
				}
			}
		},
		MuiButtonGroup: {
			defaultProps: {
			  color: "primary",
			},
			styleOverrides: {
			  contained: {
				borderRadius: 10,
			  },
			},
		  },
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: 'none'
				}
			}
		},
		MuiDialog: {
			styleOverrides: {
			  paper: {
				borderRadius: 20,
				boxShadow: '0 30px 60px -20px rgba(21, 11, 34, .35)',
			  },
			},
		  },
		  MuiPaginationItem: {
			styleOverrides: {
			  root: {
				borderRadius: 10,
			  },
			},
		  },
		  MuiPaper: {
			styleOverrides: {
			  root: {
				backgroundImage: "none",
			  },
			  rounded: {
				borderRadius: 16,
			  },
			},
		  },
		  MuiPopover: {
			styleOverrides: {
			  paper: {
				borderRadius: 14,
			  },
			},
		  },
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 20,
					fontWeight: 600
				}
			}
		},
		MuiTextField: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiInputLabel: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiSelect: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiOutlinedInput: {
			defaultProps: {
				color: 'primary'
			},
			styleOverrides: {
				root: {
					borderRadius: 10
				}
			}
		},
		MuiInputBase: {
			styleOverrides: {
				root: {
					minHeight: 40,
					lineHeight: 1
				}
			}
		},
		MuiFilledInput: {
			styleOverrides: {
				root: {
					borderRadius: 4,
					'&:before, &:after': {
						display: 'none'
					}
				}
			}
		},
		MuiSlider: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiCheckbox: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiRadio: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiSwitch: {
			defaultProps: {
				color: 'primary'
			}
		},
		MuiTypography: {
			variants: [
				{
					props: { color: 'text.secondary' },
					style: {
						color: 'text.secondary'
					}
				}
			]
		}
	}
};

/**
 * The mustHaveThemeOptions object defines the options that must be present in the MUI theme.
 */
export const mustHaveThemeOptions = {
	typography: {
		htmlFontSize: 10,
		fontSize: 14,
		body1: {
			fontSize: '1.4rem'
		},
		body2: {
			fontSize: '1.4rem'
		}
	}
};

/**
 * The defaultThemes object defines the default themes for the application.
 */
export const defaultThemes = {
	default: {
		palette: {
			mode: 'light',
			primary: fuseDark,
			secondary: {
				light: lightBlue[400],
				main: lightBlue[600],
				dark: lightBlue[700]
			},
			error: red
		},
		status: {
			danger: 'orange'
		}
	},
	defaultDark: {
		palette: {
			mode: 'dark',
			primary: fuseDark,
			secondary: {
				light: lightBlue[400],
				main: lightBlue[600],
				dark: lightBlue[700]
			},
			error: red
		},
		status: {
			danger: 'orange'
		}
	}
};

/**
 * The extendThemeWithMixins function extends the theme with mixins.
 */
export function extendThemeWithMixins(obj: ThemeOptions) {
	const theme = createTheme(obj);
	return {
		border: (width = 1) => ({
			borderWidth: width,
			borderStyle: 'solid',
			borderColor: theme.palette.divider
		}),
		borderLeft: (width = 1) => ({
			borderLeftWidth: width,
			borderStyle: 'solid',
			borderColor: theme.palette.divider
		}),
		borderRight: (width = 1) => ({
			borderRightWidth: width,
			borderStyle: 'solid',
			borderColor: theme.palette.divider
		}),
		borderTop: (width = 1) => ({
			borderTopWidth: width,
			borderStyle: 'solid',
			borderColor: theme.palette.divider
		}),
		borderBottom: (width = 1) => ({
			borderBottomWidth: width,
			borderStyle: 'solid',
			borderColor: theme.palette.divider
		})
	};
}
