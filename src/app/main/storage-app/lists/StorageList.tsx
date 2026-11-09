import { Navigate } from "react-router-dom";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import FusePageCarded from "@fuse/core/FusePageCarded";
import StorageGate from "../shared/StorageGate";
import StorageListHeader, { type StorageListKind } from "./StorageListHeader";
import StorageListTable from "./StorageListTable";
export default function StorageList({ kind }: { kind: StorageListKind }) {
  const user = useAppSelector(selectUser);
  if (kind === "products" && user.role !== "user")
    return <Navigate to="/error/401" replace />;
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
