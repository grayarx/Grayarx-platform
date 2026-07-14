/**
 * Platform bank details from env (Railway Variables).
 * Never log the full account number in production diagnostics.
 */
import {
  resolveGrayArxBankDetails,
  type GrayArxBankDetails,
} from "../../shared/bankDetails";

export function getGrayArxBankDetailsFromEnv(): GrayArxBankDetails {
  return resolveGrayArxBankDetails({
    BANK_NAME: process.env.BANK_NAME,
    BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
    BANK_BRANCH_CODE: process.env.BANK_BRANCH_CODE,
    BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
  });
}
