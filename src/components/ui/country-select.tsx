import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { filterCountries } from "@/lib/address-helpers";
// import countryRegionData from "country-region-data/dist/data-umd";
// import { useEffect, useState } from "react";

export interface Region {
  name: string;
  shortCode: string;
}

export interface CountryRegion {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

interface CountrySelectProps {
  priorityOptions?: string[];
  whitelist?: string[];
  blacklist?: string[];
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  defaultCountry?: string;
}

function CountrySelect({
  priorityOptions = [],
  whitelist = [],
  blacklist = [],
  onChange = () => {},
  className,
  placeholder = 'Country',
}: CountrySelectProps) {
  // const [countries, setCountries] = useState<CountryRegion[]>([]);

  // useEffect(() => {
  //   setCountries(
  //     // filterCountries(countryRegionData, priorityOptions, whitelist, blacklist),
  //   );
  // }, []);

  return (
    <Select
      onValueChange={(value: string) => {
        onChange(value);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* {countries.map(({ countryName, countryShortCode }) => (
            <SelectItem key={countryShortCode} value={countryShortCode}>
              {countryName}
            </SelectItem>
          ))} */}
      </SelectContent>
    </Select>
  );
}

export { CountrySelect };
