import ts from 'typescript';

// Nest dependency injection needs TypeScript's legacy decorator metadata.
// Keep tests on the same decorator semantics as the production tsc build.
export function nestTypescript() {
  return {
    name: 'nest-typescript-metadata',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('.ts') || id.includes('node_modules')) return;
      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2023,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          sourceMap: true,
        },
      });
      return { code: result.outputText, map: result.sourceMapText };
    },
  };
}
