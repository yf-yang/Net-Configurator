import { FrontendDataInterface } from './frontend-data-interface';
import { BackendDumpData } from './backend-dump-data';

export interface FileDataInterface {
  be: BackendDumpData;
  fe: FrontendDataInterface;
}
