declare function prompt(database: any, paths: any, reset?: boolean): Promise<void>;
declare function makeTypes(database: any, paths: any): Promise<void>;
declare function watch(database: any, paths: any): void;

export {
  prompt,
  makeTypes,
  watch
}
