import { CountryRegion } from '@/components/ui/country-select';

export function filterCountries(
  countryRegionData: CountryRegion[],
  priorityOptions: string[],
  whitelist: string[],
  blacklist: string[],
): CountryRegion[] {
  let filteredCountries = countryRegionData;

  if (whitelist.length > 0) {
    filteredCountries = filteredCountries.filter((country) =>
      whitelist.includes(country.countryShortCode),
    );
  }

  if (blacklist.length > 0) {
    filteredCountries = filteredCountries.filter(
      (country) => !blacklist.includes(country.countryShortCode),
    );
  }

  if (priorityOptions.length > 0) {
    const priorityCountries = filteredCountries.filter((country) =>
      priorityOptions.includes(country.countryShortCode),
    );
    const nonPriorityCountries = filteredCountries.filter(
      (country) => !priorityOptions.includes(country.countryShortCode),
    );
    filteredCountries = [...priorityCountries, ...nonPriorityCountries];
  }

  return filteredCountries;
}

export function filterRegions(
  country: CountryRegion,
  priorityOptions: string[],
  whitelist: string[],
  blacklist: string[],
) {
  let filteredRegions = country.regions;

  if (priorityOptions.length > 0) {
    filteredRegions = filteredRegions.filter((region) =>
      priorityOptions.includes(region.shortCode),
    );
  }

  if (whitelist.length > 0) {
    filteredRegions = filteredRegions.filter((region) =>
      whitelist.includes(region.shortCode),
    );
  }

  if (blacklist.length > 0) {
    filteredRegions = filteredRegions.filter(
      (region) => !blacklist.includes(region.shortCode),
    );
  }

  return filteredRegions;
}
