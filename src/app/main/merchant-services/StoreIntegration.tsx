import ServicePage from "./shared-components/ServicePage";
export default function StoreIntegration() {
  return (
    <ServicePage
      title="STORE_INTEGRATION"
      message="INTEGRATION_MESSAGE"
      comingSoon
    >
      <div className="flex flex-wrap items-center justify-center gap-24 w-full">
        <img
          src="/assets/images/zid.jpg"
          alt="Zid"
          className="max-w-full h-64 object-contain"
        />
        <img
          src="/assets/images/woocomerce.png"
          alt="WooCommerce"
          className="max-w-full max-h-64 object-contain"
        />
      </div>
    </ServicePage>
  );
}
