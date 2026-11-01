import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import DocumentationButton from './DocumentationButton';
import PurchaseButton from './PurchaseButton';

/**
 * The demo layout footer content.
 */
function DemoLayoutFooterContent() {
	const theme = useTheme();
	return (
		<>
			<div className="flex grow shrink-0">
				<PurchaseButton className="mx-4" />
				<DocumentationButton className="mx-4" />
			</div>

			<div className="flex grow shrink-0 px-12 justify-end">
				<Link to="/home" aria-label="Ashamco Express home">
					<img
						src={`/assets/images/logo/logo-text${theme.palette.mode === 'dark' ? '-dark' : ''}.png`}
						alt="Ashamco Express"
						className="block h-32 w-auto max-w-128 object-contain"
					/>
				</Link>
			</div>
		</>
	);
}

export default DemoLayoutFooterContent;
