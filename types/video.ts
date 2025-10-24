export interface Video {
  id: number;
  _id?: string; // Backward compatibility
  title: string;
  description?: string;
  url: string;
  filename?: string; // Fayl nomi
  duration?: number;
  createdAt: string;
  updatedAt: string;
}
