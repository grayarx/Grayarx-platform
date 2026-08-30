export {
  GRAYARX_OS_PACKAGES,
  OS_MODULES,
  liveModules,
  packageById,
  pricingEconomicsSummary,
  type GrayArxPackage,
  type OsModule,
  type OsModuleId,
} from "@nalaOs/os/pricing";

export {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
  type PriceRow,
} from "@nalaOs/os/competitor-prices";

export { handleOsMessage, detectOsIntent, type OsTurnResult } from "@nalaOs/os/router";
export {
  listParts,
  listPartsEnquiries,
  quotePart,
  holdPart,
  bookOutPart,
} from "@nalaOs/os/parts";
export {
  bookService,
  createServiceJob,
  listServiceBookings,
  listOpenServiceJobs,
  getServiceJob,
  getServiceCalendar,
} from "@nalaOs/os/service";
export { captureTradeIn, listTradeIns } from "@nalaOs/os/tradein";
