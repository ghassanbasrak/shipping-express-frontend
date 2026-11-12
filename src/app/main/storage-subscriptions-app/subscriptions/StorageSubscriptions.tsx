import FusePageCarded from "@fuse/core/FusePageCarded";
import StorageGate from "../../storage-app/shared/StorageGate";
import StorageSubscriptionsHeader from "./StorageSubscriptionsHeader";
import StorageSubscriptionsTable from "./StorageSubscriptionsTable";
export default function StorageSubscriptions() {
  return (
    <StorageGate>
      <FusePageCarded
        header={<StorageSubscriptionsHeader />}
        content={<StorageSubscriptionsTable />}
        scroll="normal"
      />
    </StorageGate>
  );
}
