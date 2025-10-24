import { Video } from "./video";

export interface Course {
  id: number;
  _id?: string; // Backward compatibility
  title: string;
  description?: string;
  price: number;
  videos: Video[];
  createdAt: string;
  updatedAt: string;
}
