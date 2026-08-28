export {
  GRAYARX_OS_PACKAGES,
  OS_MODULES,
  liveModules,
  packageById,
  pricingEconomicsSummary,
  type GrayArxPackage,
  type OsModule,
  type OsModuleId,
} from "@/lib/os/pricing";

export {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
  type PriceRow,
} from "@/lib/os/competitor-prices";

export { handleOsMessage, detectOsIntent, type OsTurnResult } from "@/lib/os/router";
export {
  listParts,
  listPartsEnquiries,
  quotePart,
  holdPart,
} from "@/lib/os/parts";
export { bookService, listServiceBookings } from "@/lib/os/service";
export { captureTradeIn, listTradeIns } from "@/lib/os/tradein";
