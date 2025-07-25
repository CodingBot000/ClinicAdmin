import type { Logger } from '@/utils/logger';

declare global {
  var log: Logger;
  interface Window {
    log: Logger;
  }
}