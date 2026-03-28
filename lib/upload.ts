export type UploadedFileMeta = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
};

export async function persistUploadedFile(): Promise<never> {
  throw new Error('Implemente upload real com S3, R2 ou Supabase Storage.');
}
