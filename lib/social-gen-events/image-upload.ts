export type InspirationPhotoInput = {
  file: File;
  name: string;
};

export type UploadedInspirationPhoto = {
  name: string;
  size: number;
  type: string;
  url?: string;
  publicId?: string;
  uploadStatus: "uploaded" | "not_configured";
};

type UploadResult = {
  configured: boolean;
  photos: UploadedInspirationPhoto[];
  urls: string[];
};

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadInspirationPhotos(images: InspirationPhotoInput[]): Promise<UploadResult> {
  if (images.length === 0) {
    return { configured: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET), photos: [], urls: [] };
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return {
      configured: false,
      photos: images.map(({ file, name }) => ({
        name,
        size: file.size,
        type: file.type,
        uploadStatus: "not_configured",
      })),
      urls: [],
    };
  }

  const photos = await Promise.all(
    images.map(async ({ file, name }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "social-gen-events/inspiration");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = (await response.json()) as { secure_url: string; public_id: string };

      return {
        name,
        size: file.size,
        type: file.type,
        url: data.secure_url,
        publicId: data.public_id,
        uploadStatus: "uploaded" as const,
      };
    }),
  );

  return {
    configured: true,
    photos,
    urls: photos.map((photo) => photo.url).filter((url): url is string => Boolean(url)),
  };
}
