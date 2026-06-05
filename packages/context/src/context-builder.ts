import path from 'node:path';
import type {
  ContextManagerPort,
  FileSystemPort,
  RepoIndex,
  ContextPack,
} from '@legacy-squad/core';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

const TOKENS_PER_CHAR = 0.25;

export class ContextBuilder implements ContextManagerPort {
  constructor(private readonly fs: FileSystemPort) {}

  async buildPacks(rootPath: string, repoIndex: RepoIndex): Promise<ContextPack[]> {
    const packs: ContextPack[] = [];

    for (const mod of repoIndex.modules) {
      const pack = await this.buildModulePack(rootPath, mod.name, mod.path, repoIndex);
      packs.push(pack);
    }

    return packs;
  }

  private async buildModulePack(
    rootPath: string,
    moduleName: string,
    modulePath: string,
    repoIndex: RepoIndex,
  ): Promise<ContextPack> {
    const fullModulePath = path.join(rootPath, modulePath);
    let keyFiles: string[] = [];
    let totalSize = 0;

    try {
      const files = await this.fs.glob(fullModulePath, '\\.(tsx?|jsx?|php|cs|java)$');
      keyFiles = files.map((f) => toPosix(path.relative(rootPath, f))).slice(0, 10);

      for (const file of files.slice(0, 10)) {
        try {
          const stat = await this.fs.stat(file);
          totalSize += stat.size;
        } catch {
          // Ignora arquivos inacessíveis
        }
      }
    } catch {
      // Módulo inacessível
    }

    const moduleEntrypoints = repoIndex.entrypoints
      .filter((e) => e.path.startsWith(modulePath))
      .map((e) => `${e.type}: ${e.name}`);

    const moduleDeps = repoIndex.dependencies
      .slice(0, 5)
      .map((d) => d.name);

    return {
      id: `${moduleName}.context`,
      module: moduleName,
      summary: `Module ${moduleName} with ${keyFiles.length} key files.`,
      keyFiles,
      entrypoints: moduleEntrypoints,
      dependencies: moduleDeps,
      risks: [],
      tokenEstimate: Math.round(totalSize * TOKENS_PER_CHAR),
    };
  }
}
