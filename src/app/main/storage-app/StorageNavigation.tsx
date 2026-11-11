import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  appendNavigationItem,
  removeNavigationItem,
} from "app/theme-layouts/shared-components/navigation/store/navigationSlice";
import { useGetStorageSubscriptionQuery } from "./StorageApi";
import { hasActiveStorageSubscription } from "./Utils";
import { storageEnabled } from "./storageConfig";
export default function StorageNavigation() {
  const user = useAppSelector(selectUser),
    dispatch = useAppDispatch(),
    [now, setNow] = useState(Date.now());
  const subscription = useGetStorageSubscriptionQuery(user?.id, {
    skip: !storageEnabled || user?.role !== "user",
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const active =
    storageEnabled &&
    !subscription.isError &&
    user?.role === "user" &&
    hasActiveStorageSubscription(
      subscription.currentData,
      user.id,
      Math.max(now, Date.now()),
    );
  useEffect(() => {
    const items = [
      {
        id: "storage-products-merchant",
        title: "Stored products",
        translate: "STORAGE_PRODUCTS",
        type: "item",
        icon: "heroicons-outline:cube",
        url: "/storage/products",
        auth: ["user"],
      },
      {
        id: "storage-supplies-merchant",
        title: "Supply requests",
        translate: "STORAGE_SUPPLIES",
        type: "item",
        icon: "heroicons-outline:inbox-in",
        url: "/storage/supply-requests",
        auth: ["user"],
      },
    ];
    for (const item of items) {
      if (active) void dispatch(appendNavigationItem(item, "group-storage"));
      else void dispatch(removeNavigationItem(item.id));
    }
    return () => {
      items.forEach((item) => {
        void dispatch(removeNavigationItem(item.id));
      });
    };
  }, [active, user?.id, dispatch]);
  return null;
}
