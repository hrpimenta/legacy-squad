import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FileSystemPort, FileWriterPort } from '@legacy-squad/core';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'vendor',
  '__pycache__', '.gradle', 'bin', 'obj', 'coverage', '.legacy-squad',
]);

export class NodeFileSystem implements FileSystemPort, FileWriterPort {
  async readDir(dirPath: string): Promise<string[]> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => !IGNORED_DIRS.has(e.name))
      .map((e) => path.join(dirPath, e.name));
  }

  async readFile(filePath: string): Promise<string> {
    return readFile(filePath, 'utf-8');
  }

  async stat(filePath: string): Promise<{ size: number; isDirectory: boolean }> {
    const s = await stat(filePath);
    return { size: s.size, isDirectory: s.isDirectory() };
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async glob(rootPath: string, pattern: string): Promise<string[]> {
    const results: string[] = [];
    await this.walkForGlob(rootPath, pattern, results);
    return results;
  }

  /**
   * Garante a existência do diretório criando todos os intermediários.
   * Idempotente — não lança se o diretório já existir.
   */
  async mkdir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  /**
   * Escreve (sobrescrevendo) o arquivo com `content` em UTF-8.
   * Pré-condição: o diretório-pai deve existir — chame `mkdir` antes.
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8');
  }

  private async walkForGlob(
    dir: string,
    pattern: string,
    results: string[],
  ): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walkForGlob(fullPath, pattern, results);
      } else if (entry.name.match(pattern)) {
        results.push(fullPath);
      }
    }
  }
}
