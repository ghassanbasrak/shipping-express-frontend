export default interface IAlert {
  id: string;
  _id?: string;
  type: string;
  viewType: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
