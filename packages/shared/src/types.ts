import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Visual Analysis types
export const VisualAnalysisSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  imageUrl: z.string().url(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

export type VisualAnalysis = z.infer<typeof VisualAnalysisSchema>;

// Camera capture types
export interface CameraCapture {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
}
