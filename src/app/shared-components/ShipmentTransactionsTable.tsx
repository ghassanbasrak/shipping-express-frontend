import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import CustomTable from "./custom-table/CustomTable";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import ITransaction from "src/app/main/transactions-app/models/ITransaction";
import transactionFields from "src/app/main/transactions-app/shared-components/TransactionFields";
export default function ShipmentTransactionsTable({
  transactions = [],
  loading = false,
}: {
  transactions?: ITransaction[];
  loading?: boolean;
}) {
  const { t } = useTranslation("transactionsApp"),
    user = useAppSelector(selectUser);
  return (
    <CustomTable<ITransaction>
      fields={transactionFields(t, user, "all", "shipment")}
      data={transactions}
      total={transactions.length}
      page={0}
      pageSize={Math.max(transactions.length, 100)}
      paginationType="client"
      onChangePagination={() => {}}
      autoRowHeight
      status={loading ? FetchStatus.loading : FetchStatus.done}
      exportedFileName="Ashamco Shipment Transactions"
    />
  );
}
