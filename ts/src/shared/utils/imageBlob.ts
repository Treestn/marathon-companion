import { FileUtils } from "../../escape-from-tarkov/utils/FileUtils";

type ImageBlobResult = {
  blob: Blob;
  url: string;
};

export const createImageBlobFromFile = async (
  path: string,
  mimeType = "image/png",
): Promise<ImageBlobResult> => {
  const fileBinary = await FileUtils.getFileBinaryArray(path);
  if (!fileBinary.success || !fileBinary.content) {
    throw new Error("Image could not be loaded");
  }

  const byteArray = new Uint8Array(fileBinary.content);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

export const revokeObjectUrl = (url: string | null | undefined) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};
