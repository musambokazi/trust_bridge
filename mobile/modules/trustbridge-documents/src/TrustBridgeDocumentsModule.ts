import { requireOptionalNativeModule } from "expo";
export type ReadResult = { text: string; pages: number };
export default requireOptionalNativeModule<{
  read(uri: string, pdf: boolean): Promise<ReadResult>;
  cancel(): void;
}>("TrustBridgeDocuments");
