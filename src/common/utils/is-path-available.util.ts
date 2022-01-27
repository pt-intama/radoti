import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export const isPathAvailable = (path: string, withCreateDir?: boolean) => {
  const dir = dirname(path);
  if (withCreateDir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(path)) {
    return false;
  }
  return true;
};
