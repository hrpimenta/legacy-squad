import type { Rule } from '@legacy-squad/core';

/**
 * Tags de aplicabilidade reconhecidas:
 * - Mobile/JS: 'react-native', 'expo', 'mobile', 'node', 'frontend', 'typescript'
 * - PHP:       'php', 'laravel', 'symfony', 'codeigniter'
 * - .NET:      'dotnet', 'csharp', 'asp.net'
 * - Java:      'java', 'spring-boot', 'spring-mvc'
 * - Genérico:  'backend' (cobre PHP/.NET/Java/Node-backend)
 *
 * Regras com `appliesTo: ['backend']` ativam para qualquer projeto backend.
 * Os patterns regex são específicos por linguagem — falsos positivos
 * cross-language são raros porque cada regex referencia APIs/sintaxe
 * exclusivas (e.g. `$_GET` só existe em PHP, `MD5.Create` só em .NET).
 */

const BACKEND_LANGUAGES = [
  'backend',
  'php', 'laravel', 'symfony', 'codeigniter',
  'dotnet', 'csharp', 'asp.net',
  'java', 'spring-boot', 'spring-mvc',
];

export const SECURITY_RULES: Rule[] = [
  {
    id: 'SEC-CRED-001',
    title: 'Hardcoded credentials in source code',
    category: 'security',
    severity: 'critical',
    appliesTo: ['react-native', 'node', 'mobile', 'backend', 'frontend', ...BACKEND_LANGUAGES],
    frameworks: ['OWASP MASVS V2', 'OWASP ASVS V2', 'CWE-798'],
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
    appliesTo: ['react-native', 'node', 'mobile', 'backend', ...BACKEND_LANGUAGES],
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
    appliesTo: ['react-native', 'node', 'mobile', 'frontend', 'backend', ...BACKEND_LANGUAGES],
    frameworks: ['CWE-390', 'Clean Code'],
    detection: {
      type: 'pattern',
      patterns: [
        'catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}',
        'catch\\s*\\{\\s*\\}',
      ],
    },
    impact: 'Errors are silently discarded, masking bugs and security issues in production.',
    recommendation: 'Log errors to a monitoring service (Sentry, Crashlytics, Application Insights). Never leave catch blocks empty.',
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

  // ─── Regras multi-linguagem para backend (DT-003) ──────────────────────────

  {
    id: 'SEC-SQL-001',
    title: 'Possible SQL injection via string concatenation',
    category: 'security',
    severity: 'critical',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V5', 'OWASP Top 10 A03:2021', 'CWE-89'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: keyword SQL na mesma linha que superglobal
        '(SELECT|INSERT|UPDATE|DELETE)[^;]*\\$_(GET|POST|REQUEST|COOKIE)',
        // .NET: SqlCommand/CommandText concatenando string
        '(SqlCommand|CommandText)[^;{]*\\+\\s*\\w',
        // Java: execute*/executeQuery/executeUpdate concatenando string
        '(executeQuery|executeUpdate|execute)\\s*\\([^)]*"\\s*\\+',
      ],
    },
    impact: 'Attacker-controlled input concatenated into SQL allows arbitrary query execution, data exfiltration or database compromise.',
    recommendation: 'Use parameterized queries / prepared statements: PDO/mysqli in PHP (?-placeholders), SqlParameter in .NET, PreparedStatement in Java, or ORM bindings (Eloquent, EF Core, Hibernate) without raw concatenation.',
  },
  {
    id: 'SEC-CRYPTO-001',
    title: 'Weak cryptographic hash (MD5/SHA-1)',
    category: 'security',
    severity: 'high',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V6', 'CWE-327', 'CWE-328'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: md5($x), sha1($x)
        '\\b(md5|sha1)\\s*\\(',
        // .NET: MD5.Create(), SHA1.Create()
        '\\b(MD5|SHA1)\\.Create\\s*\\(',
        // Java: MessageDigest.getInstance("MD5"/"SHA-1")
        'MessageDigest\\.getInstance\\s*\\(\\s*["\'](MD5|SHA-?1)["\']',
      ],
    },
    impact: 'MD5 and SHA-1 are cryptographically broken — vulnerable to collisions and brute-force. Unsuitable for password hashing or integrity checks.',
    recommendation: 'For passwords: bcrypt/argon2 (password_hash in PHP, BCrypt.Net in .NET, Spring Security in Java). For integrity: SHA-256, SHA-3, or BLAKE2.',
  },
  {
    id: 'SEC-DESER-001',
    title: 'Insecure deserialization of user-controlled data',
    category: 'security',
    severity: 'high',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V5', 'OWASP Top 10 A08:2021', 'CWE-502'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: unserialize de superglobais
        'unserialize\\s*\\(\\s*\\$_(GET|POST|REQUEST|COOKIE)',
        // .NET: BinaryFormatter/SoapFormatter/NetDataContractSerializer
        '\\b(BinaryFormatter|SoapFormatter|NetDataContractSerializer)\\b',
        // Java: chamada readObject() — específica de ObjectInputStream/XMLDecoder
        '\\.readObject\\s*\\(\\s*\\)',
      ],
    },
    impact: 'Deserializing untrusted input can lead to remote code execution via gadget chains.',
    recommendation: 'Avoid native serialization for untrusted input. Prefer JSON with strict schemas (json_decode, System.Text.Json, Jackson with default-typing disabled).',
  },
  {
    id: 'SEC-CMD-001',
    title: 'Possible command injection via user-controlled input',
    category: 'security',
    severity: 'critical',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V5', 'CWE-78'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: exec/system/passthru/shell_exec/popen com superglobal nos parens
        '(exec|system|passthru|shell_exec|popen|proc_open)\\s*\\([^)]*\\$_(GET|POST|REQUEST|COOKIE)',
        // .NET: Process.Start com Request
        'Process\\.Start\\s*\\([^)]*\\bRequest\\b',
        // Java: Runtime.exec com .getParameter (qualquer variável do servlet)
        'Runtime\\.getRuntime\\s*\\(\\)\\.exec\\s*\\([^)]*\\.getParameter',
      ],
    },
    impact: 'Untrusted input passed to shell execution allows attackers to run arbitrary commands on the host.',
    recommendation: 'Avoid shell invocation when possible. If necessary, validate input against a strict allow-list and pass arguments as an array (not concatenated string).',
  },
  {
    id: 'SEC-PATH-001',
    title: 'Possible path traversal via user-controlled input',
    category: 'security',
    severity: 'high',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V12', 'CWE-22'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: include/require/file_get_contents/fopen/readfile com superglobal
        '(file_get_contents|fopen|readfile|file)\\s*\\([^)]*\\$_(GET|POST|REQUEST|COOKIE)',
        '(include|require|include_once|require_once)\\s*\\(?[^;]*\\$_(GET|POST|REQUEST|COOKIE)',
        // .NET: File.ReadAllText/OpenRead/Open com Request
        'File\\.(ReadAllText|ReadAllBytes|OpenRead|Open|ReadAllLines)\\s*\\([^)]*\\bRequest\\b',
        // Java: new File / new FileInputStream com .getParameter (qualquer var)
        '(new\\s+File|new\\s+FileInputStream|new\\s+FileReader|Files\\.read)\\s*\\([^)]*\\.getParameter',
      ],
    },
    impact: 'User-controlled file paths allow attackers to read or include arbitrary files outside the intended directory.',
    recommendation: 'Validate against an allow-list of filenames, normalize the path (realpath in PHP, Path.GetFullPath in .NET, Path.normalize in Java) and confirm it stays under a known root directory.',
  },
  {
    id: 'SEC-XSS-001',
    title: 'Cross-site scripting via unescaped output',
    category: 'security',
    severity: 'high',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['OWASP ASVS V5', 'OWASP Top 10 A03:2021', 'CWE-79'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: echo/print de superglobal sem escape
        '(echo|print)[^;]*\\$_(GET|POST|REQUEST|COOKIE)',
        // .NET: Response.Write com Request
        'Response\\.Write\\s*\\([^)]*\\bRequest\\b',
      ],
    },
    impact: 'Reflecting user input into HTML without escaping allows script injection in victims\' browsers.',
    recommendation: 'PHP: htmlspecialchars() / Blade {{ }} / Twig auto-escape. .NET: Razor @ syntax (auto-escapes), HttpUtility.HtmlEncode. Java: JSTL <c:out> or Thymeleaf th:text.',
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
  {
    id: 'CQ-DEPRECATED-001',
    title: 'Use of deprecated or removed language API',
    category: 'legacy_code',
    severity: 'medium',
    appliesTo: BACKEND_LANGUAGES,
    frameworks: ['Clean Code'],
    detection: {
      type: 'pattern',
      patterns: [
        // PHP: mysql_* extension (removed in PHP 7)
        'mysql_(connect|query|fetch_array|fetch_assoc|fetch_row|num_rows|real_escape_string|select_db)\\s*\\(',
        // PHP: ereg/split (removed in PHP 7)
        '\\b(ereg|eregi|ereg_replace|split)\\s*\\(',
        // Java: legacy synchronized collections
        '\\bnew\\s+(Vector|Hashtable)\\s*[(<]',
      ],
    },
    impact: 'Deprecated APIs are unsupported and may be removed in future runtime versions, causing breakage. They often have safer modern replacements.',
    recommendation: 'PHP: migrate mysql_* to PDO or mysqli; ereg_* to preg_*. Java: replace Vector with ArrayList and Hashtable with HashMap (or ConcurrentHashMap if thread-safety needed).',
  },
];

export const ALL_RULES: Rule[] = [...SECURITY_RULES, ...CODE_QUALITY_RULES];
