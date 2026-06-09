import { describe, it, expect } from 'vitest';
import path from 'node:path';
import type { FileSystemPort } from '@legacy-squad/core';
import { detectFromManifests, detectFromExtensions } from '../src/stack-detector.js';
import { RepoScanner } from '../src/repo-scanner.js';

/** Normaliza separadores para comparação cross-platform */
function norm(p: string): string {
  return p.replace(/[\\/]+/g, '/');
}

function createMockFs(files: Record<string, string>): FileSystemPort {
  const normFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) {
    normFiles[norm(k)] = v;
  }

  return {
    readDir: async (dir: string) => {
      const d = norm(dir);
      return Object.keys(normFiles)
        .filter((f) => f.startsWith(d) && f !== d)
        .map((f) => f.split('/').slice(0, d.split('/').length + 1).join('/'))
        .filter((v, i, a) => a.indexOf(v) === i);
    },
    readFile: async (filePath: string) => {
      const key = norm(filePath);
      if (normFiles[key] !== undefined) return normFiles[key];
      throw new Error(`File not found: ${filePath}`);
    },
    stat: async (filePath: string) => {
      const key = norm(filePath);
      if (normFiles[key] !== undefined) {
        return { size: normFiles[key].length, isDirectory: false };
      }
      const isDir = Object.keys(normFiles).some((f) => f.startsWith(key + '/'));
      if (isDir) return { size: 0, isDirectory: true };
      throw new Error(`Not found: ${filePath}`);
    },
    exists: async (filePath: string) => {
      const key = norm(filePath);
      return normFiles[key] !== undefined ||
        Object.keys(normFiles).some((f) => f.startsWith(key + '/'));
    },
    glob: async (_root: string, pattern: string) => {
      const regex = new RegExp(pattern);
      return Object.keys(normFiles).filter((f) => regex.test(f));
    },
  };
}

describe('Stack Detector — Layer 1: Manifests', () => {
  it('deve detectar React Native + Expo + TypeScript a partir de package.json', async () => {
    const fs = createMockFs({
      '/repo/package.json': JSON.stringify({
        name: 'appcooperado',
        dependencies: {
          'react-native': '0.79.5',
          expo: '~53.0.20',
          react: '19.0.0',
          mobx: '6.7.0',
          axios: '1.3.4',
        },
        devDependencies: {
          typescript: '~5.8.3',
        },
      }),
    });

    const result = await detectFromManifests('/repo', fs);

    expect(result).not.toBeNull();
    expect(result!.projectType).toBe('mobile');
    expect(result!.projectName).toBe('appcooperado');

    const stackNames = result!.stack.map((s) => s.name);
    expect(stackNames).toContain('react-native');
    expect(stackNames).toContain('expo');
    expect(stackNames).toContain('typescript');
    expect(stackNames).toContain('mobx');
  });

  it('deve detectar PHP/Laravel a partir de composer.json', async () => {
    const fs = createMockFs({
      '/repo/composer.json': JSON.stringify({
        name: 'my-app',
        require: { php: '^8.2', 'laravel/framework': '^11.0' },
      }),
    });

    const result = await detectFromManifests('/repo', fs);

    expect(result).not.toBeNull();
    expect(result!.projectType).toBe('backend');
    const stackNames = result!.stack.map((s) => s.name);
    expect(stackNames).toContain('php');
    expect(stackNames).toContain('laravel');
  });

  it('deve retornar null quando não há manifesto', async () => {
    const fs = createMockFs({ '/repo/README.md': '# Hello' });
    const result = await detectFromManifests('/repo', fs);
    expect(result).toBeNull();
  });
});

describe('Stack Detector — Layer 2: Extensions', () => {
  it('deve detectar TypeScript por extensão de arquivo', async () => {
    const fs = createMockFs({
      '/repo/src/index.ts': 'export const x = 1;',
      '/repo/src/App.tsx': '<View />',
    });

    const detected = await detectFromExtensions('/repo', fs);
    const names = detected.map((s) => s.name);
    expect(names).toContain('typescript');
  });
});

describe('RepoScanner — geração de RepoIndex', () => {
  it('deve gerar RepoIndex completo para projeto React Native', async () => {
    const fs = createMockFs({
      '/repo/package.json': JSON.stringify({
        name: 'test-app',
        dependencies: { 'react-native': '0.79.5', expo: '~53.0.0' },
        devDependencies: { typescript: '~5.8.0' },
      }),
      '/repo/index.tsx': 'export default App;',
      '/repo/src/screens/login/index.tsx': 'export default LoginScreen;',
      '/repo/src/screens/home/index.tsx': 'export default HomeScreen;',
      '/repo/src/stores/Auth.ts': "password: 'secret123'",
    });

    const scanner = new RepoScanner(fs);
    const index = await scanner.scan('/repo');

    expect(index.project.name).toBe('test-app');
    expect(index.project.type).toBe('mobile');
    expect(index.stack.length).toBeGreaterThan(0);
    expect(index.dependencies.length).toBeGreaterThan(0);

    const screenNames = index.entrypoints
      .filter((e) => e.type === 'screen')
      .map((e) => e.name);
    expect(screenNames).toContain('login');
    expect(screenNames).toContain('home');
  });
});

describe('RepoScanner — DT-004: resolução de raiz aninhada', () => {
  it('deve descer um nível quando o manifesto está em subdiretório único', async () => {
    // Cenário típico: usuário extrai foo-main.zip → cria foo-main/foo-main/
    // e roda `legacy-squad install -p foo-main/`. O scanner deve detectar
    // o projeto real um nível abaixo.
    const fs = createMockFs({
      '/repo/inner/package.json': JSON.stringify({
        name: 'inner-app',
        dependencies: { 'react-native': '0.79.5' },
      }),
      '/repo/inner/src/index.ts': 'export default {};',
    });

    const scanner = new RepoScanner(fs);
    const index = await scanner.scan('/repo');

    expect(index.project.name).toBe('inner-app');
    expect(index.project.type).toBe('mobile');
    expect(norm(index.project.rootPath)).toBe('/repo/inner');
    expect(index.stack.map((s) => s.name)).toContain('react-native');
  });

  it('deve manter raiz original quando o manifesto está direto na raiz', async () => {
    // Caso comum (não aninhado): comportamento atual permanece igual.
    const fs = createMockFs({
      '/repo/package.json': JSON.stringify({
        name: 'root-app',
        dependencies: { express: '^4.0.0' },
      }),
    });

    const scanner = new RepoScanner(fs);
    const index = await scanner.scan('/repo');

    expect(index.project.name).toBe('root-app');
    expect(norm(index.project.rootPath)).toBe('/repo');
  });

  it('não deve descer quando há múltiplos subdiretórios candidatos', async () => {
    // Ambiguidade: vários subdirs com manifestos = monorepo. Não tentamos
    // adivinhar qual é o "real" — mantém a raiz original.
    const fs = createMockFs({
      '/repo/api/package.json': JSON.stringify({ name: 'api' }),
      '/repo/web/package.json': JSON.stringify({ name: 'web' }),
    });

    const scanner = new RepoScanner(fs);
    const index = await scanner.scan('/repo');

    expect(norm(index.project.rootPath)).toBe('/repo');
  });

  it('deve manter raiz original quando nenhum nível tem manifesto', async () => {
    // Repositório sem manifesto algum: fallback para layer 2 (extensões)
    // continua funcionando, e rootPath permanece o original.
    const fs = createMockFs({
      '/repo/inner/src/main.py': 'print("hi")',
    });

    const scanner = new RepoScanner(fs);
    const index = await scanner.scan('/repo');

    expect(norm(index.project.rootPath)).toBe('/repo');
  });
});
