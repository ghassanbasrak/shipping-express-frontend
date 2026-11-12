import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DocumentationButton from './DocumentationButton';
import PurchaseButton from './PurchaseButton';

/**
 * The demo layout footer content.
 */
function DemoLayoutFooterContent() {
	const { i18n } = useTranslation();
	return (
		<>
			<div className="flex grow shrink-0">
				<PurchaseButton className="mx-4" />
				<DocumentationButton className="mx-4" />
			</div>

			<div className="flex grow shrink-0 px-12 justify-end">
				<Link to="/home" aria-label="Ashamco Express home">
					<img
						src={`/brand/logos/ashamco-${i18n.language.startsWith('ar') ? 'ar' : 'en'}-on-purple.svg`}
						alt="Ashamco Express"
						className="block h-32 w-auto max-w-128 object-contain"
					/>
				</Link>
			</div>
		</>
	);
}

export default DemoLayoutFooterContent;
