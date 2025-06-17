export interface TypeOptions {
  db: any;
  paths: any;
  sample?: boolean;
  testMode?: boolean;
}

export function prompt(database: any, paths: any, reset?: boolean): Promise<void>;
export function makeTypes(options: TypeOptions): Promise<void>;
export function watch(database: any, paths: any): void;
