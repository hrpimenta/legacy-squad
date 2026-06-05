import type { Rule } from '@legacy-squad/core';

/**
 * Initial rule catalog focused on mobile security (OWASP MASVS)
 * and general code quality. Each rule has evidence-based detection.
 */
export const SECURITY_RULES: Rule[] = [
  {
    id: 'SEC-CRED-001',
    title: 'Hardcoded credentials in source code',
    category: 'security',
    severity: 'critical',
    appliesTo: ['react-native', 'node', 'mobile', 'backend', 'frontend'],
    frameworks: ['OWASP MASVS V2', 'CWE-798'],
    detection: {
      type: 'pattern',
      patterns: [
        'password\\s*[:=]\\s*[\'"][^\\s\'"]{4,}[\'"]',
        'senha\\s*[:=]\\s*[\'"][^\\s\'"]{4,}[\'"]',
        'secret\\s*[:=]\\s*[\'"][^\\s\'"]{4,}[\'"]',
        'api_?key\\s*[:=]\\s*[\'"][^\\s\'"]{4,}[\'"]',
      ],
    },
    impact: 'Credentials can be extracted from app binary or source repository, enabling unauthorized access.',
    recommendation: 'Move all credentials to environment variables, secure vault (Azure Key Vault, AWS Secrets Manager), or expo-secure-store for mobile.',
  },
  {
    id: 'SEC-CRED-002',
    title: 'Keystore or signing certificate committed to repository',
    category: 'security',
    severity: 'high',
    appliesTo: ['react-native', 'mobile', 'android'],
    frameworks: ['OWASP MASVS V2', 'CWE-312'],
    detection: {
      type: 'filename',
      patterns: [
        '\\.keystore$',
        '\\.jks$',
        'google-services\\.json$',
        'GoogleService-Info\\.plist$',
      ],
    },
    impact: 'Signing keys or service credentials exposed in version control may allow app impersonation or unauthorized API access.',
    recommendation: 'Remove from repository, add to .gitignore, and distribute via secure CI/CD secrets.',
  },
  {
    id: 'SEC-LOG-001',
    title: 'Console.log active in production code',
    category: 'security',
    severity: 'medium',
    appliesTo: ['react-native', 'node', 'mobile', 'frontend'],
    frameworks: ['OWASP MASVS V2', 'CWE-532'],
    detection: {
      type: 'pattern',
      patterns: ['console\\.log\\('],
    },
    impact: 'Sensitive data (tokens, user info, API responses) may leak to device logs accessible by other apps or debugging tools.',
    recommendation: 'Replace console.log with a logger that strips output in production builds, or use crashlytics().recordError() for error tracking.',
  },
  {
    id: 'SEC-LOG-002',
    title: 'Sensitive data (CPF/PII) logged or sent to external service',
    category: 'security',
    severity: 'high',
    appliesTo: ['react-native', 'node', 'mobile', 'backend'],
    frameworks: ['OWASP MASVS V2', 'CWE-532', 'LGPD'],
    detection: {
      type: 'pattern',
      patterns: [
        'cpf[^a-zA-Z].*(?:log|set|ref|database|send)',
        '_CPF.*(?:log|set|ref|database|send)',
        'generateRawCPF',
      ],
    },
    impact: 'PII (CPF) transmitted or logged without masking violates data protection regulations (LGPD) and may expose user identity.',
    recommendation: 'Mask PII before logging. Never send raw CPF to external services. Use anonymized identifiers for analytics.',
  },
  {
    id: 'SEC-ERR-001',
    title: 'Empty catch block swallowing errors silently',
    category: 'security',
    severity: 'medium',
    appliesTo: ['react-native', 'node', 'mobile', 'frontend', 'backend'],
    frameworks: ['CWE-390', 'Clean Code'],
    detection: {
      type: 'pattern',
      patterns: [
        'catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}',
        'catch\\s*\\{\\s*\\}',
      ],
    },
    impact: 'Errors are silently discarded, masking bugs and security issues in production.',
    recommendation: 'Log errors to a monitoring service (Sentry, Crashlytics). Never leave catch blocks empty.',
  },
  {
    id: 'SEC-STORE-001',
    title: 'Token stored in insecure storage (AsyncStorage)',
    category: 'security',
    severity: 'high',
    appliesTo: ['react-native', 'mobile'],
    frameworks: ['OWASP MASVS V2'],
    detection: {
      type: 'pattern',
      patterns: [
        'AsyncStorage\\.setItem\\s*\\(\\s*[\'"](?:token|access_token|refresh_token|api_key)',
      ],
    },
    impact: 'Authentication tokens in AsyncStorage are accessible to other apps on rooted devices.',
    recommendation: 'Use expo-secure-store, react-native-keychain, or native Keychain/Keystore APIs.',
  },
];

export const CODE_QUALITY_RULES: Rule[] = [
  {
    id: 'CQ-MIX-001',
    title: 'Mixed JavaScript and TypeScript files in same module',
    category: 'legacy_code',
    severity: 'low',
    appliesTo: ['react-native', 'node', 'frontend'],
    frameworks: ['Clean Code'],
    detection: {
      type: 'structure',
      patterns: ['mixed-js-ts'],
    },
    impact: 'Inconsistent typing reduces IDE support and increases risk of runtime errors.',
    recommendation: 'Complete TypeScript migration module by module. Prioritize modules with business logic.',
  },
  {
    id: 'CQ-DEP-001',
    title: 'Transitive dependency used without explicit declaration',
    category: 'legacy_code',
    severity: 'medium',
    appliesTo: ['react-native', 'node', 'frontend'],
    frameworks: ['Clean Code'],
    detection: {
      type: 'pattern',
      patterns: [
        "require\\(['\"](?:prop-types|lodash|sprintf-js|payment|react-native-flip-card|react-native-animatable)['\"]\\)",
        "from\\s+['\"](?:prop-types|lodash|sprintf-js|payment|react-native-flip-card|react-native-animatable)['\"]",
      ],
    },
    impact: 'Transitive dependencies may be removed in future updates, causing silent breakage.',
    recommendation: 'Declare all used packages explicitly in package.json or replace with native alternatives.',
  },
];

export const ALL_RULES: Rule[] = [...SECURITY_RULES, ...CODE_QUALITY_RULES];
