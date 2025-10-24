import api from "../lib/api";
import { Video } from "../types/video";

// Client-side DTOs for type safety
export interface CreateVideoDto {
  title: string;
  description?: string;
  duration?: number;
}

export interface UpdateVideoDto {
  title?: string;
  description?: string;
  duration?: number;
}

class VideoService {
  async create(file: File, createVideoDto: CreateVideoDto): Promise<Video> {
    // Real video upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', createVideoDto.title);
    if (createVideoDto.description) {
      formData.append('description', createVideoDto.description);
    }
    if (createVideoDto.duration) {
      formData.append('duration', createVideoDto.duration.toString());
    }

    const response = await api.post("/upload/video", formData);
    return response.data;
  }

  async findAll(): Promise<Video[]> {
    const response = await api.get("/videos");
    return response.data;
  }

  async findOne(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  }

  async findByFilename(filename: string): Promise<Video> {
    const response = await api.get(`/videos/by-filename/${filename}`);
    return response.data;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const response = await api.patch(`/videos/${id}`, updateVideoDto);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  }
}

export default new VideoService();
