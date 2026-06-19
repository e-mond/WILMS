/**
 * Repository data-source switch — alias of IDataProvider for backend readiness docs.
 * UI continues to import services from `@/services`; repositories resolve Mock vs API here.
 */
export {
  type IDataProvider as IDataSource,
  type DataProviderMode as DataSourceMode,
  mockDataProvider as mockDataSource,
  apiDataProvider as apiDataSource,
  isDemoMode,
  resolveDataProviderMode as resolveDataSourceMode,
  DEMO_MODE_MESSAGE,
} from '@/data-provider';
