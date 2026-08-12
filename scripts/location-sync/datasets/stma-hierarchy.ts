export const GHANA_REGIONS = [
  { code: 'GAR', name: 'Greater Accra' },
  { code: 'ASH', name: 'Ashanti' },
  { code: 'WES', name: 'Western' },
  { code: 'CEN', name: 'Central' },
  { code: 'EAS', name: 'Eastern' },
  { code: 'NOR', name: 'Northern' },
  { code: 'VOL', name: 'Volta' },
  { code: 'UPE', name: 'Upper East' },
  { code: 'UPW', name: 'Upper West' },
  { code: 'BON', name: 'Bono' },
  { code: 'BEA', name: 'Bono East' },
  { code: 'AHA', name: 'Ahafo' },
  { code: 'WNO', name: 'Western North' },
  { code: 'OTI', name: 'Oti' },
  { code: 'NEE', name: 'North East' },
  { code: 'SAV', name: 'Savannah' },
] as const;

export const STMA_DISTRICT_SOURCE_ID = 'imccod:243';

export const STMA_SUB_METROS = [
  {
    sourceId: 'stma:sub-metro:sekondi',
    name: 'Sekondi Sub-Metropolitan District Council',
    unitType: 'Sub-Metro Council' as const,
  },
  {
    sourceId: 'stma:sub-metro:takoradi',
    name: 'Takoradi Sub-Metropolitan District Council',
    unitType: 'Sub-Metro Council' as const,
  },
  {
    sourceId: 'stma:sub-metro:essikado-ketan',
    name: 'Essikado-Ketan Sub-Metropolitan District Council',
    unitType: 'Sub-Metro Council' as const,
  },
];

/** 36 STMA electoral areas from https://stma.gov.gh/assembly-members.php */
export const STMA_ELECTORAL_AREAS: Array<{
  sourceId: string;
  name: string;
  aliases?: string[];
  subMetro: 'sekondi' | 'takoradi' | 'essikado-ketan' | null;
}> = [
  { sourceId: 'stma:ea:yensuado', name: 'Yensuado', subMetro: null },
  { sourceId: 'stma:ea:cassava-farm', name: 'Cassava Farm', subMetro: null },
  { sourceId: 'stma:ea:old-adra', name: 'Old Adra', subMetro: null },
  { sourceId: 'stma:ea:anoe', name: 'Anoe', subMetro: 'essikado-ketan' },
  {
    sourceId: 'stma:ea:bakaekyir',
    name: 'Bakaekyir',
    aliases: ['Bakaeyile', 'Bakaekyir'],
    subMetro: 'sekondi',
  },
  { sourceId: 'stma:ea:nkontompo', name: 'Nkontompo', subMetro: 'sekondi' },
  { sourceId: 'stma:ea:essikafoambantem-1', name: 'Essikafoambantem No 1', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:kweikuma', name: 'Kweikuma', subMetro: 'sekondi' },
  { sourceId: 'stma:ea:amanful-west', name: 'Amanful-West', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:presby-takoradi', name: 'Presby, Takoradi', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:airport-ridge', name: 'Airport Ridge', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:essikafoambantem-2', name: 'Essikafoambantem No 2', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:kojokrom', name: 'Kojokrom', subMetro: 'essikado-ketan' },
  {
    sourceId: 'stma:ea:railway-harbour',
    name: 'Railway & Harbour',
    aliases: ['Railway & Habour', 'Railway and Harbour Area', 'Railway & Harbour Area'],
    subMetro: 'sekondi',
  },
  { sourceId: 'stma:ea:nketsiakrom', name: 'Nketsiakrom', subMetro: null },
  { sourceId: 'stma:ea:mpentemnsrew', name: 'Mpentemnsrew', subMetro: null },
  { sourceId: 'stma:ea:upper-new-takoradi', name: 'Upper New Takoradi', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:mempeasem', name: 'Mempeasem', aliases: ['Mempeasem'], subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:beach-road', name: 'Beach Road', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:chapel-hill', name: 'Chapel Hill', subMetro: 'takoradi' },
  {
    sourceId: 'stma:ea:ridge-ministries',
    name: 'Ridge/Ministries',
    aliases: ['Ridge/Ministies', 'Sekondi Ridge'],
    subMetro: 'sekondi',
  },
  { sourceId: 'stma:ea:asfo', name: 'Asfo', subMetro: null },
  { sourceId: 'stma:ea:asamansudu', name: 'Asamansudu', aliases: ['Asamansudo'], subMetro: 'sekondi' },
  { sourceId: 'stma:ea:zongo-estate', name: 'Zongo/Estate', aliases: ['Zongo', 'Estate'], subMetro: 'sekondi' },
  {
    sourceId: 'stma:ea:ekuasi-essaman',
    name: 'Ekuasi/Essaman',
    aliases: ['Ekuase', 'Essaman'],
    subMetro: 'sekondi',
  },
  { sourceId: 'stma:ea:adiembra', name: 'Adiembra', subMetro: 'sekondi' },
  { sourceId: 'stma:ea:essikado-east', name: 'Essikado East', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:essikado-west', name: 'Essikado West', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:mpintsin', name: 'Mpintsin', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:ketan', name: 'Ketan', aliases: ['Ketan Estate'], subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:kansaworado', name: 'Kansaworado', subMetro: 'essikado-ketan' },
  { sourceId: 'stma:ea:fijai', name: 'Fijai', subMetro: 'sekondi' },
  { sourceId: 'stma:ea:lower-new-takoradi', name: 'Lower New Takoradi', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:amanful-east', name: 'Amanful East', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:zenith', name: 'Zenith', subMetro: 'takoradi' },
  { sourceId: 'stma:ea:airforce-station', name: 'Airforce Station', subMetro: 'takoradi' },
];

/** Neighbourhoods named on STMA sub-metro pages that are not themselves electoral areas. */
export const STMA_COMMUNITIES: Array<{
  sourceId: string;
  name: string;
  aliases?: string[];
  electoralAreaSourceId?: string;
}> = [
  { sourceId: 'stma:community:bakado', name: 'Bakado', electoralAreaSourceId: 'stma:ea:adiembra' },
  { sourceId: 'stma:community:butumagyebu', name: 'Butumagyebu', electoralAreaSourceId: 'stma:ea:essikado-east' },
  { sourceId: 'stma:community:ahinkofikrom', name: 'Ahinkofikrom', electoralAreaSourceId: 'stma:ea:kojokrom' },
  { sourceId: 'stma:community:essipong', name: 'Essipong', electoralAreaSourceId: 'stma:ea:kojokrom' },
  { sourceId: 'stma:community:twabewu', name: 'Twabewu', electoralAreaSourceId: 'stma:ea:kojokrom' },
  { sourceId: 'stma:community:eshiem', name: 'Eshiem', electoralAreaSourceId: 'stma:ea:ketan' },
  { sourceId: 'stma:community:sofokrom', name: 'Sofokrom', electoralAreaSourceId: 'stma:ea:ketan' },
  { sourceId: 'stma:community:nkenya', name: 'Nkenya', electoralAreaSourceId: 'stma:ea:essikado-west' },
  { sourceId: 'stma:community:nkroful', name: 'Nkroful', electoralAreaSourceId: 'stma:ea:essikado-west' },
  { sourceId: 'stma:community:ngyiresia', name: 'Ngyiresia', electoralAreaSourceId: 'stma:ea:essikado-west' },
  { sourceId: 'stma:community:takoradi', name: 'Takoradi', electoralAreaSourceId: 'stma:ea:chapel-hill' },
  { sourceId: 'stma:community:new-takoradi', name: 'New Takoradi', electoralAreaSourceId: 'stma:ea:upper-new-takoradi' },
  { sourceId: 'stma:community:essikado', name: 'Essikado', electoralAreaSourceId: 'stma:ea:essikado-east' },
  /**
   * Verified on STMA official publications (2025 Annual Action Plan; STMA news clean-up coverage).
   * Source: https://www.stma.gov.gh/documents/2025_-AAP_STMA.pdf
   */
  {
    sourceId: 'stma:community:european-town',
    name: 'European Town',
    aliases: ['European town'],
    electoralAreaSourceId: 'stma:ea:ridge-ministries',
  },
  /**
   * Listed on Sekondi Sub-Metro electoral communities page.
   * Source: https://www.stma.gov.gh/sekondi-sub-metro.php
   */
  {
    sourceId: 'stma:community:essaman',
    name: 'Essaman',
    aliases: ['Essamang'],
    electoralAreaSourceId: 'stma:ea:ekuasi-essaman',
  },
  {
    sourceId: 'stma:community:sekondi',
    name: 'Sekondi',
    aliases: ['Sekondi Town'],
    electoralAreaSourceId: 'stma:ea:ridge-ministries',
  },
];
