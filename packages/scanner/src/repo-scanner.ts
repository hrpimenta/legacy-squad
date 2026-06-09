import path from 'node:path';
import type {
  FileSystemPort,
  ScannerPort,
  RepoIndex,
  ModuleInfo,
  Entrypoint,
  Integration,
  Hotspot,
} from '@legacy-squad/core';
import { detectFromManifests, detectFromExtensions } from './stack-detector.js';
import type { ManifestResult } from './stack-detector.js';

/** Normaliza separadores para POSIX — consistência cross-platform */
function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

const SOURCE_EXTENSIONS = /\.(tsx?|jsx?|php|cs|java|py|dart|vue|svelte)$/;
const LARGE_FILE_THRESHOLD = 10_000;

interface ResolvedRoot {
  readonly effectiveRoot: string;
  readonly manifestResult: ManifestResult | null;
}

export class RepoScanner implements ScannerPort {
  constructor(private readonly fs: FileSystemPort) {}

  async scan(rootPath: string): Promise<RepoIndex> {
    const { effectiveRoot, manifestResult } = await this.resolveRoot(rootPath);

    let stack = manifestResult?.stack ?? [];
    if (stack.length === 0) {
      stack = await detectFromExtensions(effectiveRoot, this.fs);
    }

    const projectName = manifestResult?.projectName ?? path.basename(effectiveRoot);
    const projectType = manifestResult?.projectType ?? 'backend';
    const dependencies = manifestResult?.dependencies ?? [];

    const sourceFiles = await this.collectSourceFiles(effectiveRoot);
    const modules = this.detectModules(effectiveRoot, sourceFiles);
    const entrypoints = this.detectEntrypoints(effectiveRoot, sourceFiles, projectType);
    const integrations = await this.detectIntegrations(effectiveRoot, sourceFiles);
    const hotspots = await this.detectHotspots(effectiveRoot, sourceFiles);

    return {
      project: {
        name: projectName,
        type: projectType,
        rootPath: effectiveRoot,
        detectedAt: new Date().toISOString(),
      },
      stack,
      modules,
      entrypoints,
      dependencies,
      integrations,
      hotspots,
    };
  }

  /**
   * DT-004: Quando o usuário extrai um zip que cria pasta aninhada
   * (ex: `app-main/app-main/package.json`) e aponta para o wrapper,
   * descemos exatamente 1 nível se houver um único subdiretório com manifesto.
   * Ambiguidade (múltiplos subdirs com manifesto) mantém a raiz original
   * para não disfarçar monorepos como mono-projetos.
   */
  private async resolveRoot(rootPath: string): Promise<ResolvedRoot> {
    const rootManifest = await detectFromManifests(rootPath, this.fs);
    if (rootManifest) {
      return { effectiveRoot: rootPath, manifestResult: rootManifest };
    }

    const subdirs = await this.listSubdirectories(rootPath);
    const candidates: Array<{ dir: string; manifest: ManifestResult }> = [];
    for (const dir of subdirs) {
      const manifest = await detectFromManifests(dir, this.fs);
      if (manifest) candidates.push({ dir, manifest });
    }

    if (candidates.length === 1) {
      return { effectiveRoot: candidates[0].dir, manifestResult: candidates[0].manifest };
    }

    return { effectiveRoot: rootPath, manifestResult: null };
  }

  private async listSubdirectories(rootPath: string): Promise<string[]> {
    const entries = await this.fs.readDir(rootPath);
    const subdirs: string[] = [];
    for (const entry of entries) {
      try {
        const s = await this.fs.stat(entry);
        if (s.isDirectory) subdirs.push(entry);
      } catch {
        // Entry inacessível — ignora
      }
    }
    return subdirs;
  }

  private async collectSourceFiles(rootPath: string): Promise<string[]> {
    return this.fs.glob(rootPath, SOURCE_EXTENSIONS.source);
  }

  private detectModules(rootPath: string, files: string[]): ModuleInfo[] {
    const moduleMap = new Map<string, string[]>();

    for (const file of files) {
      const relative = toPosix(path.relative(rootPath, file));
      const parts = relative.split('/');

      if (parts.length >= 2) {
        const moduleKey = parts.slice(0, 2).join('/');
        const existing = moduleMap.get(moduleKey) ?? [];
        existing.push(file);
        moduleMap.set(moduleKey, existing);
      }
    }

    return Array.from(moduleMap.entries()).map(([modulePath, moduleFiles]) => ({
      name: path.basename(modulePath),
      path: modulePath,
      type: 'module' as const,
      filesCount: moduleFiles.length,
      summary: `Module with ${moduleFiles.length} source files`,
    }));
  }

  private detectEntrypoints(
    rootPath: string,
    files: string[],
    projectType: string,
  ): Entrypoint[] {
    const entrypoints: Entrypoint[] = [];

    if (projectType === 'mobile') {
      for (const file of files) {
        const relative = toPosix(path.relative(rootPath, file));
        if (relative.match(/src\/screens\/[^/]+\/index\.(tsx?|jsx?)$/)) {
          const screenName = relative.split('/').slice(-2, -1)[0];
          entrypoints.push({
            type: 'screen',
            name: screenName,
            path: relative,
            method: 'render',
          });
        }
      }
    }

    for (const file of files) {
      const relative = toPosix(path.relative(rootPath, file));
      if (relative.match(/^(index|main|App)\.(tsx?|jsx?|js)$/)) {
        entrypoints.push({
          type: 'component',
          name: path.basename(relative),
          path: relative,
          method: 'main',
        });
      }
    }

    return entrypoints;
  }

  private async detectIntegrations(
    rootPath: string,
    files: string[],
  ): Promise<Integration[]> {
    const integrations: Integration[] = [];
    const seen = new Set<string>();

    for (const file of files) {
      try {
        const content = await this.fs.readFile(file);
        const relative = toPosix(path.relative(rootPath, file));

        const urlMatches = content.matchAll(/https?:\/\/[^\s'"`,)]+/g);
        for (const match of urlMatches) {
          const url = match[0];
          try {
            const hostname = new URL(url).hostname;
            if (!seen.has(hostname) && !hostname.includes('google.com/viewer')) {
              seen.add(hostname);
              integrations.push({
                type: 'api',
                name: hostname,
                evidence: url.substring(0, 100),
                path: relative,
              });
            }
          } catch {
            // URL inválida — ignora
          }
        }

        if (content.includes('firebase') || content.includes('Firebase')) {
          if (!seen.has('firebase')) {
            seen.add('firebase');
            integrations.push({
              type: 'external_service',
              name: 'Firebase',
              evidence: 'Firebase SDK usage detected',
              path: relative,
            });
          }
        }
      } catch {
        // Arquivo ilegível — ignora
      }
    }

    return integrations;
  }

  private async detectHotspots(
    rootPath: string,
    files: string[],
  ): Promise<Hotspot[]> {
    const hotspots: Hotspot[] = [];

    for (const file of files) {
      try {
        const s = await this.fs.stat(file);
        const relative = toPosix(path.relative(rootPath, file));

        if (s.size > LARGE_FILE_THRESHOLD) {
          hotspots.push({
            path: relative,
            reason: 'large_file',
            score: Math.min(Math.round(s.size / 1000), 100),
          });
        }
      } catch {
        // Arquivo inacessível — ignora
      }
    }

    return hotspots.sort((a, b) => b.score - a.score).slice(0, 20);
  }
}
