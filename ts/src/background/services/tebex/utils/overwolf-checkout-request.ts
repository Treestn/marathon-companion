import { APP_ID } from "../config/app";
import storeData from "../config/store-data";


export default function OverwolfCheckoutRequest(
  endpoint: string,
  searchParams?: { [key: string]: string | undefined },
  ...pathParams: string[]
) {
  const url = new URL(endpoint);
  url.pathname += `/${storeData.storePublicToken}`;
  pathParams.forEach((pathParam) => (url.pathname += pathParam));
  if (searchParams) {
    Object.keys(searchParams).forEach(
      (key) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        searchParams[key] && url.searchParams.append(key, searchParams[key]!),
    );
  }

  url.searchParams.append('extensionId', APP_ID);
  console.log("URL: " + url.toString());
  
  return url.toString();
}
