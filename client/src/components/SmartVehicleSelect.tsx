import { useMemo } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import {
  VEHICLE_MAKES,
  resolveMake,
  resolveModel,
  searchMakes,
  searchModels,
  getModelsForMake,
  getMakeMatchHint,
} from "@shared/vehicleCatalog";

export function MakeSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={VEHICLE_MAKES}
      placeholder="Toyota, VW, BMW…"
      allowCustom
      resolveValue={resolveMake}
      searchOptions={(q) => searchMakes(q, 20)}
      matchHint={getMakeMatchHint}
      className={className}
    />
  );
}

export function ModelSelect({
  make,
  value,
  onChange,
  className,
}: {
  make: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const models = useMemo(() => getModelsForMake(make), [make]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={models.length > 0 ? models : []}
      placeholder={make ? "Golf GTI, Hilux, Polo…" : "Select make first"}
      allowCustom
      resolveValue={(raw) => resolveModel(make, raw)}
      searchOptions={(q) => (make ? searchModels(make, q, 15) : [])}
      className={className}
    />
  );
}
