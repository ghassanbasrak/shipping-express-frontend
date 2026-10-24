import NamingConfigSection from "../sections/NamingConfigSection";
import CountrySection from "../sections/CountrySection";
function BasicInfoTab() {
  return (
    <div>
      <NamingConfigSection />
      <CountrySection />
    </div>
  );
}
export default BasicInfoTab;
