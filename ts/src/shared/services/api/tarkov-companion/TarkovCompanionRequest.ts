export default function TarkovCompanionRequest(
  endpoint: string,
  searchParams?: { [key: string]: string | undefined } | null,
  ...pathParams: string[]
): string {
  const url = new URL(endpoint);
  pathParams.forEach((pathParam) => {
    url.pathname += pathParam;
  });

  if (searchParams) {
    Object.keys(searchParams).forEach((key) => {
      const value = searchParams[key];
      if (value) {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}
