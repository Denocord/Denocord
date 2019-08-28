declare module "jitson" {
  interface JitsonOptions {
    sampleInterval: number;
  }

  function jitsonParser(input: string | ArrayBuffer | Buffer): any;

  function jistonFactory(options?: JitsonOptions): typeof jitsonParser;

  export = jistonFactory;
}
