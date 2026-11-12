import FusePageCarded from "@fuse/core/FusePageCarded";
import StorageGate from "../shared/StorageGate";
import StorageListHeader, { type StorageListKind } from "./StorageListHeader";
import StorageListTable from "./StorageListTable";
export default function StorageList({ kind }: { kind: StorageListKind }) {
  return (
    <StorageGate
      adminOnly={kind === "warehouses" || kind === "plans"}
      subscriptionRequired={kind === "products" || kind === "supplies"}
    >
      <FusePageCarded
        header={<StorageListHeader kind={kind} />}
        content={<StorageListTable kind={kind} />}
        scroll="normal"
      />
    </StorageGate>
  );
}
