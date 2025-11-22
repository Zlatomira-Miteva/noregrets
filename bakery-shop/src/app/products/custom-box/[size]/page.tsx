import { getCookieOptions, getProductBySlug } from "@/lib/products";
import CustomBoxClient from "./CustomBoxClient";

type PageProps = {
  params: {
    size?: string;
  };
};

const DEFAULT_SIZE = "6";

export default async function CustomBoxPage({ params }: PageProps) {
  const requestedSize = params?.size ?? DEFAULT_SIZE;
  const product = await getProductBySlug(`custom-box-${requestedSize}`);
  const cookieOptions = await getCookieOptions();

  return <CustomBoxClient requestedSize={requestedSize} initialProduct={product} cookieOptions={cookieOptions} />;
}
