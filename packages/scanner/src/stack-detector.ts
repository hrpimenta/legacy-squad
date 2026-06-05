import path from 'node:path';
import type { FileSystemPort } from '@legacy-squad/core';
import type { StackItem, DependencyItem, DependencyManager, ProjectType } from '@legacy-squad/core';

interface ManifestResult {
  stack: StackItem[];
  dependencies: DependencyItem[];
  projectType: ProjectType;
  projectName: string;
}

interface ManifestDetector {
  readonly filename: string;
  detect(content: string, filePath: string): ManifestResult;
}

/** Detects stack from package.json (Node/React/React Native/Expo) */
const packageJsonDetector: ManifestDetector = {
  filename: 'package.json',
  detect(content: string, filePath: string): ManifestResult {
    const pkg = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const stack: StackItem[] = [];
    const dependencies: DependencyItem[] = [];
    let projectType: ProjectType = 'backend';

    for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
      dependencies.push({
        name,
        version: String(version),
        manager: 'npm',
        scope: 'runtime',
      });
    }
    for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
      dependencies.push({
        name,
        version: String(version),
        manager: 'npm',
        scope: 'dev',
      });
    }

    if (allDeps['react-native']) {
      stack.push({ name: 'react-native', type: 'framework', version: String(allDeps['react-native']), source: filePath });
      projectType = 'mobile';
    }
    if (allDeps['expo']) {
      stack.push({ name: 'expo', type: 'framework', version: String(allDeps['expo']), source: filePath });
      projectType = 'mobile';
    }
    if (allDeps['react'] && !allDeps['react-native']) {
      stack.push({ name: 'react', type: 'framework', version: String(allDeps['react']), source: filePath });
      projectType = 'frontend';
    }
    if (allDeps['next']) {
      stack.push({ name: 'next', type: 'framework', version: String(allDeps['next']), source: filePath });
      projectType = 'fullstack';
    }
    if (allDeps['express']) {
      stack.push({ name: 'express', type: 'framework', version: String(allDeps['express']), source: filePath });
      projectType = 'backend';
    }
    if (allDeps['typescript']) {
      stack.push({ name: 'typescript', type: 'language', version: String(allDeps['typescript']), source: filePath });
    }
    if (allDeps['mobx']) {
      stack.push({ name: 'mobx', type: 'library', version: String(allDeps['mobx']), source: filePath });
    }
    if (allDeps['axios']) {
      stack.push({ name: 'axios', type: 'library', version: String(allDeps['axios']), source: filePath });
    }
    if (allDeps['styled-components']) {
      stack.push({ name: 'styled-components', type: 'library', version: String(allDeps['styled-components']), source: filePath });
    }

    const nodeVersion = pkg.engines?.node ?? 'unknown';
    stack.push({ name: 'node', type: 'runtime', version: nodeVersion, source: filePath });

    return {
      stack,
      dependencies,
      projectType,
      projectName: pkg.name ?? path.basename(path.dirname(filePath)),
    };
  },
};

/** Detects stack from composer.json (PHP) */
const composerJsonDetector: ManifestDetector = {
  filename: 'composer.json',
  detect(content: string, filePath: string): ManifestResult {
    const composer = JSON.parse(content);
    const stack: StackItem[] = [
      { name: 'php', type: 'language', version: composer.require?.php ?? 'unknown', source: filePath },
    ];
    const dependencies: DependencyItem[] = [];

    for (const [name, version] of Object.entries(composer.require ?? {})) {
      if (name === 'php') continue;
      dependencies.push({ name, version: String(version), manager: 'composer', scope: 'runtime' });
      if (name === 'laravel/framework') {
        stack.push({ name: 'laravel', type: 'framework', version: String(version), source: filePath });
      }
    }

    return { stack, dependencies, projectType: 'backend', projectName: composer.name ?? 'php-project' };
  },
};

/** Detects stack from .csproj (C#/.NET) */
const csprojDetector: ManifestDetector = {
  filename: '.csproj',
  detect(content: string, filePath: string): ManifestResult {
    const stack: StackItem[] = [];
    const dependencies: DependencyItem[] = [];

    const tfmMatch = content.match(/<TargetFramework>(.*?)<\/TargetFramework>/);
    if (tfmMatch) {
      stack.push({ name: 'dotnet', type: 'runtime', version: tfmMatch[1], source: filePath });
    }

    const pkgRefRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = pkgRefRegex.exec(content)) !== null) {
      dependencies.push({ name: match[1], version: match[2], manager: 'nuget', scope: 'runtime' });
    }

    return { stack, dependencies, projectType: 'backend', projectName: path.basename(filePath, '.csproj') };
  },
};

/** Detects stack from pom.xml (Java/Maven) */
const pomXmlDetector: ManifestDetector = {
  filename: 'pom.xml',
  detect(content: string, filePath: string): ManifestResult {
    const stack: StackItem[] = [
      { name: 'java', type: 'language', version: 'unknown', source: filePath },
    ];
    const dependencies: DependencyItem[] = [];

    if (content.includes('spring-boot')) {
      stack.push({ name: 'spring-boot', type: 'framework', version: 'detected', source: filePath });
    }

    return { stack, dependencies, projectType: 'backend', projectName: 'java-project' };
  },
};

const ALL_DETECTORS: ManifestDetector[] = [
  packageJsonDetector,
  composerJsonDetector,
  csprojDetector,
  pomXmlDetector,
];

/** Manifest filenames to search for */
export const MANIFEST_FILES = ALL_DETECTORS.map((d) => d.filename);

/**
 * Layer 1: Detect stack from manifest files (deterministic, evidence-based).
 * Returns null if no manifest is found.
 */
export async function detectFromManifests(
  rootPath: string,
  fs: FileSystemPort,
): Promise<ManifestResult | null> {
  for (const detector of ALL_DETECTORS) {
    if (detector.filename === '.csproj') {
      const files = await fs.glob(rootPath, /\.csproj$/.source);
      if (files.length > 0) {
        const content = await fs.readFile(files[0]);
        return detector.detect(content, files[0]);
      }
      continue;
    }

    const manifestPath = path.join(rootPath, detector.filename);
    if (await fs.exists(manifestPath)) {
      const content = await fs.readFile(manifestPath);
      return detector.detect(content, manifestPath);
    }
  }

  return null;
}

/**
 * Layer 2: Detect stack from file extensions (heuristic fallback).
 */
export async function detectFromExtensions(
  rootPath: string,
  fs: FileSystemPort,
): Promise<StackItem[]> {
  const extensionMap: Record<string, StackItem> = {
    '\\.tsx?$': { name: 'typescript', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.jsx?$': { name: 'javascript', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.php$': { name: 'php', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.cs$': { name: 'csharp', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.java$': { name: 'java', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.py$': { name: 'python', type: 'language', version: 'detected', source: 'file-extensions' },
    '\\.dart$': { name: 'dart', type: 'language', version: 'detected', source: 'file-extensions' },
  };

  const detected: StackItem[] = [];
  for (const [pattern, item] of Object.entries(extensionMap)) {
    const files = await fs.glob(rootPath, pattern);
    if (files.length > 0) {
      detected.push(item);
    }
  }

  return detected;
}
