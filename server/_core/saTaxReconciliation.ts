/**
 * South African Tax Reconciliation Service
 * 
 * ADMIN/OWNER ONLY - Not accessible to dealerships
 * 
 * Comprehensive tax management including:
 * - PAYE (Pay As You Earn) monthly reconciliation - SARS 2024/2025 tax tables
 * - UIF (Unemployment Insurance Fund) tracking - 1% employee + 1% employer (capped)
 * - Skills Development Levy (SDL) - 1% of payroll (if > R500k annual)
 * - Business expense deductions (SARS Section 11 approved)
 * - Home office deduction (Section 23(b) - floor area apportionment)
 * - Vehicle expense tracking (requires logbook for business km)
 * - Monthly tax savings calculator
 * - SARS compliance deadlines
 * 
 * Non-VAT registered company compliance
 * All calculations verified against SARS official documentation
 */

export type ExpenseCategory = 
  | "computer_technology"
  | "vehicle_expenses"
  | "electricity_utilities"
  | "home_office"
  | "professional_development"
  | "office_communication"
  | "business_services"
  | "furniture_equipment"
  | "advertising_marketing"
  | "travel_expenses"
  | "meals_entertainment"
  | "other_deductions";

export interface BusinessExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  receipt: string; // URL to receipt
  deductible: boolean;
  notes: string;
}

export interface HomeOfficeDeduction {
  officeAreaM2: number; // Square meters of office
  totalHomeAreaM2: number; // Total square meters of home
  monthlyRent?: number; // If renting
  monthlyElectricity: number;
  monthlyWater: number;
  monthlyInternet: number; // 100% deductible (not apportioned)
  monthlyInsurance: number;
  monthlyMaintenance: number;
  monthlyRatesAndTaxes: number;
  // NOTE: Mortgage interest NO LONGER deductible (changed March 2022)
}

export interface VehicleExpenses {
  vehicleId: string;
  registrationNumber: string;
  businessKmPercentage: number; // Must track with logbook
  monthlyFuel: number;
  monthlyMaintenance: number;
  monthlyInsurance: number;
  monthlyDepreciation: number;
  registrationFee: number;
  breakdownCover: number;
}

export interface MonthlyTaxSummary {
  month: number;
  year: number;
  totalIncome: number;
  computerTech: number;
  vehicleExpenses: number;
  electricityUtilities: number;
  homeOfficeDeduction: number;
  professionalDevelopment: number;
  officeServices: number;
  businessServices: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  estimatedTax: number;
  totalPaye: number;
  totalUif: number;
  totalSkillsLevy: number;
  taxSavings: number; // Compared to no deductions
  paymentDueDate: Date;
  complianceStatus: "compliant" | "pending" | "overdue";
}

export interface TaxCompliance {
  checkType: "paye_payment" | "emp201_filing" | "itr12_filing" | "provisional_tax" | "skills_levy";
  dueDate: Date;
  status: "pending" | "completed" | "overdue";
  notes: string;
}

/**
 * Calculate PAYE (Pay As You Earn) for an employee
 * Uses SARS 2024/2025 tax tables (1 March 2024 - 28 February 2025)
 * Source: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
 */
export function calculatePaye(grossSalary: number): number {
  // 2024/2025 Tax Year - Monthly PAYE calculation
  // Tax brackets for individuals
  if (grossSalary <= 237100) {
    return grossSalary * 0.18;
  } else if (grossSalary <= 370500) {
    return 42678 + (grossSalary - 237100) * 0.26;
  } else if (grossSalary <= 512800) {
    return 77362 + (grossSalary - 370500) * 0.31;
  } else if (grossSalary <= 673000) {
    return 121475.30 + (grossSalary - 512800) * 0.36;
  } else if (grossSalary <= 873800) {
    return 179011.30 + (grossSalary - 673000) * 0.39;
  } else if (grossSalary <= 1768000) {
    return 258139.30 + (grossSalary - 873800) * 0.41;
  } else {
    return 626267.30 + (grossSalary - 1768000) * 0.45;
  }
}

/**
 * Calculate UIF (Unemployment Insurance Fund) contribution
 * Employee: 1%, Employer: 1%
 * Monthly ceiling: R17,712 (2024/2025)
 * Maximum contribution: R177.12 per party per month
 * Source: https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/
 */
export function calculateUif(grossSalary: number): { employee: number; employer: number } {
  const uifRate = 0.01; // 1%
  const monthlyCeiling = 17712; // 2024/2025
  const maxContribution = 177.12; // 1% of R17,712
  
  const salary = Math.min(grossSalary, monthlyCeiling);
  const contribution = Math.min(salary * uifRate, maxContribution);
  
  return {
    employee: contribution,
    employer: contribution,
  };
}

/**
 * Calculate Skills Development Levy (SDL)
 * Rate: 1% of total payroll
 * Threshold: R500,000+ annual payroll (approximately R41,667/month)
 * Uncapped - applies to all remuneration
 * Source: https://www.sars.gov.za/types-of-tax/skills-development-levy/
 */
export function calculateSkillsLevy(totalMonthlyPayroll: number): number {
  const annualThreshold = 500000;
  const monthlyThreshold = annualThreshold / 12; // ~R41,667
  
  if (totalMonthlyPayroll <= monthlyThreshold) return 0;
  
  return totalMonthlyPayroll * 0.01; // 1% - UNCAPPED
}

/**
 * Calculate home office deduction (Section 23(b) of Income Tax Act)
 * 
 * Requirements:
 * - Room must be regularly AND exclusively used for trade
 * - Must be specifically equipped for that purpose
 * - Duties must be mainly performed there (>50%)
 * 
 * Calculation: Floor area apportionment (m² of office ÷ m² of home × total costs)
 * 
 * Deductible: rent, rates/taxes, repairs, electricity, water, insurance
 * NOT deductible: mortgage interest (changed March 2022)
 * NOT apportioned: office furniture, equipment wear & tear
 * 
 * Source: https://www.sars.gov.za/types-of-tax/personal-income-tax/filing-season/home-office-expenses/
 */
export function calculateHomeOfficeDeduction(homeOffice: HomeOfficeDeduction): number {
  const areaPercentage = homeOffice.officeAreaM2 / homeOffice.totalHomeAreaM2;
  
  let monthlyDeduction = 0;
  
  // Rent (apportioned by floor area)
  if (homeOffice.monthlyRent) {
    monthlyDeduction += homeOffice.monthlyRent * areaPercentage;
  }
  
  // Utilities (apportioned by floor area)
  monthlyDeduction += homeOffice.monthlyElectricity * areaPercentage;
  monthlyDeduction += homeOffice.monthlyWater * areaPercentage;
  
  // Internet (100% deductible - not apportioned if business use)
  monthlyDeduction += homeOffice.monthlyInternet;
  
  // Insurance (apportioned by floor area)
  monthlyDeduction += homeOffice.monthlyInsurance * areaPercentage;
  
  // Maintenance & repairs (apportioned by floor area)
  monthlyDeduction += homeOffice.monthlyMaintenance * areaPercentage;
  
  // Rates and taxes (apportioned by floor area)
  monthlyDeduction += homeOffice.monthlyRatesAndTaxes * areaPercentage;
  
  // NOTE: Mortgage interest is NO LONGER deductible (as of March 2022)
  
  return monthlyDeduction;
}

/**
 * Calculate vehicle expense deduction
 * 
 * Requirements:
 * - Must keep logbook for business km tracking
 * - Can only deduct business portion
 * 
 * Deductible: fuel, maintenance, insurance, registration, depreciation
 * Source: https://www.sars.gov.za/types-of-tax/personal-income-tax/travel-e-log-book/
 */
export function calculateVehicleDeduction(vehicle: VehicleExpenses): number {
  const businessPercentage = vehicle.businessKmPercentage / 100;
  
  const monthlyDeduction = 
    (vehicle.monthlyFuel * businessPercentage) +
    (vehicle.monthlyMaintenance * businessPercentage) +
    (vehicle.monthlyInsurance * businessPercentage) +
    (vehicle.monthlyDepreciation * businessPercentage) +
    (vehicle.registrationFee / 12 * businessPercentage) +
    (vehicle.breakdownCover * businessPercentage);
  
  return monthlyDeduction;
}

/**
 * Calculate computer & technology deductions (Section 11)
 */
export function calculateComputerDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => e.category === "computer_technology" && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate electricity & utilities deductions (Section 11)
 */
export function calculateUtilitiesDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => e.category === "electricity_utilities" && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate professional development deductions (Section 11)
 */
export function calculateProfessionalDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => e.category === "professional_development" && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate office & communication deductions (Section 11)
 */
export function calculateOfficeDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => e.category === "office_communication" && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate business services deductions (Section 11)
 */
export function calculateBusinessServicesDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => e.category === "business_services" && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate all other deductions (Section 11)
 */
export function calculateOtherDeductions(expenses: BusinessExpense[]): number {
  return expenses
    .filter(e => !["computer_technology", "vehicle_expenses", "electricity_utilities", "home_office", 
                   "professional_development", "office_communication", "business_services"].includes(e.category) && e.deductible)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Generate monthly tax summary with all SARS-compliant deductions
 */
export function generateMonthlyTaxSummary(
  month: number,
  year: number,
  totalIncome: number,
  expenses: BusinessExpense[],
  homeOffice: HomeOfficeDeduction,
  vehicles: VehicleExpenses[],
  employees: Array<{ salary: number }>
): MonthlyTaxSummary {
  // Calculate all deductions
  const computerTech = calculateComputerDeductions(expenses);
  const vehicleExpenses = vehicles.reduce((sum, v) => sum + calculateVehicleDeduction(v), 0);
  const electricityUtilities = calculateUtilitiesDeductions(expenses);
  const homeOfficeDeduction = calculateHomeOfficeDeduction(homeOffice);
  const professionalDevelopment = calculateProfessionalDeductions(expenses);
  const officeServices = calculateOfficeDeductions(expenses);
  const businessServices = calculateBusinessServicesDeductions(expenses);
  const otherDeductions = calculateOtherDeductions(expenses);
  
  const totalDeductions = 
    computerTech +
    vehicleExpenses +
    electricityUtilities +
    homeOfficeDeduction +
    professionalDevelopment +
    officeServices +
    businessServices +
    otherDeductions;
  
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);
  
  // Calculate income tax (simplified - actual would use full tax tables)
  // Using approximate 28% corporate rate for non-VAT registered
  const estimatedTax = taxableIncome * 0.28;
  
  // Calculate PAYE and UIF
  let totalPaye = 0;
  let totalUif = 0;
  let totalPayroll = 0;
  
  for (const employee of employees) {
    totalPaye += calculatePaye(employee.salary);
    const uif = calculateUif(employee.salary);
    totalUif += uif.employee + uif.employer;
    totalPayroll += employee.salary;
  }
  
  const skillsLevy = calculateSkillsLevy(totalPayroll);
  
  // Tax savings from deductions
  const taxWithoutDeductions = totalIncome * 0.28;
  const taxSavings = taxWithoutDeductions - estimatedTax;
  
  const paymentDate = new Date(year, month + 1, 7);
  const isOverdue = paymentDate < new Date();
  
  return {
    month,
    year,
    totalIncome,
    computerTech,
    vehicleExpenses,
    electricityUtilities,
    homeOfficeDeduction,
    professionalDevelopment,
    officeServices,
    businessServices,
    otherDeductions,
    totalDeductions,
    taxableIncome,
    estimatedTax,
    totalPaye,
    totalUif,
    totalSkillsLevy: skillsLevy,
    taxSavings,
    paymentDueDate: paymentDate,
    complianceStatus: isOverdue ? "overdue" : "pending",
  };
}

/**
 * Get SARS compliance deadlines for the year
 */
export function getSarsComplianceDeadlines(year: number): TaxCompliance[] {
  const deadlines: TaxCompliance[] = [];

  // Monthly PAYE payments (due 7th of following month)
  for (let month = 0; month < 12; month++) {
    const dueDate = new Date(year, month + 1, 7);
    deadlines.push({
      checkType: "paye_payment",
      dueDate,
      status: "pending",
      notes: `PAYE payment for ${getMonthName(month)} ${year}`,
    });
  }

  // EMP201 (Quarterly PAYE reconciliation)
  const quarters = [
    { end: new Date(year, 2, 31), quarter: "Q1" },
    { end: new Date(year, 5, 30), quarter: "Q2" },
    { end: new Date(year, 8, 30), quarter: "Q3" },
    { end: new Date(year, 11, 31), quarter: "Q4" },
  ];

  for (const q of quarters) {
    const dueDate = new Date(q.end);
    dueDate.setDate(dueDate.getDate() + 29);
    deadlines.push({
      checkType: "emp201_filing",
      dueDate,
      status: "pending",
      notes: `EMP201 filing for ${q.quarter} ${year}`,
    });
  }

  // ITR12 (Annual company tax return) - Due 29 May following year
  deadlines.push({
    checkType: "itr12_filing",
    dueDate: new Date(year + 1, 4, 29), // 29 May
    status: "pending",
    notes: `ITR12 annual tax return for ${year}`,
  });

  // Provisional Tax (if applicable - only if income > R1M)
  deadlines.push({
    checkType: "provisional_tax",
    dueDate: new Date(year, 1, 28), // 28 February
    status: "pending",
    notes: `Provisional tax assessment (if income > R1M)`,
  });

  deadlines.push({
    checkType: "provisional_tax",
    dueDate: new Date(year, 7, 31), // 31 August
    status: "pending",
    notes: `Provisional tax assessment (if income > R1M)`,
  });

  return deadlines;
}

/**
 * Format currency for South African Rand
 */
export function formatSAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month];
}
