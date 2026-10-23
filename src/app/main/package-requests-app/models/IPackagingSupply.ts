import { LocaleString } from "../../utils/commonTypes";
// Read-only catalog consumed by packaging requests, not the removed products application.
export default interface IPackagingSupply {
  id: string;
  _id?: string;
  name: string | LocaleString;
  description?: string | LocaleString;
  imageUrl?: string;
  price: number;
  count?: number;
}
