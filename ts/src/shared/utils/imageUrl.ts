export const buildRenderableImageSrc = (path?: string | null): string => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path) || /^data:/i.test(path) || /^blob:/i.test(path)) {
    return path;
  }

  if (/^file:\/\//i.test(path)) {
    const withoutScheme = path.replace(/^file:\/\//i, '');
    return `file:///${encodeURI(withoutScheme.split("\\").join("/"))}`;
  }

  return `file:///${encodeURI(path.split("\\").join("/"))}`;
};
