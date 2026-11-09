// apps/admin/src/lib/uploadHelper.ts
import { api } from './api';

/**
 * 이미지 파일을 서버에 업로드하거나, 오프라인 시 Data URL로 안전하게 변환
 */
export async function uploadImageFile(file: File): Promise<string> {
  // 1. 브라우저 로컬 Data URL 준비 (즉각 미리보기 및 백업용)
  const localDataUrlPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const uploadedUrl = res.data?.url || res.data?.data?.url;
    if (uploadedUrl && typeof uploadedUrl === 'string') {
      return uploadedUrl;
    }
  } catch (err) {
    console.warn('[uploadImageFile] 서버 업로드 지연/실패, 로컬 DataURL로 안전하게 유지합니다:', err);
  }

  return await localDataUrlPromise;
}

/**
 * 여러 파일을 동시에 업로드 처리
 */
export async function uploadMultipleImageFiles(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  let completed = 0;

  for (const file of files) {
    const url = await uploadImageFile(file);
    results.push(url);
    completed += 1;
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return results;
}
