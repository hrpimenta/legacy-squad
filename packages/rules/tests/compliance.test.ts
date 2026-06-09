import { describe, it, expect } from 'vitest';
import type { FileSystemPort, RepoIndex } from '@legacy-squad/core';
import { ComplianceEngine } from '../src/compliance-engine.js';
import { ALL_RULES, SECURITY_RULES } from '../src/rule-catalog.js';

function norm(p: string): string {
  return p.replace(/[\\/]+/g, '/');
}

function createMockFs(files: Record<string, string>): FileSystemPort {
  const normFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) {
    normFiles[norm(k)] = v;
  }

  return {
    readDir: async () => [],
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
      throw new Error(`Not found: ${filePath}`);
    },
    exists: async (filePath: string) => normFiles[norm(filePath)] !== undefined,
    glob: async (_root: string, pattern: string) => {
      const regex = new RegExp(pattern);
      return Object.keys(normFiles).filter((f) => regex.test(f));
    },
  };
}

function createMobileRepoIndex(): RepoIndex {
  return {
    project: { name: 'test-app', type: 'mobile', rootPath: '/repo', detectedAt: '' },
    stack: [
      { name: 'react-native', type: 'framework', version: '0.79.5', source: 'package.json' },
    ],
    modules: [],
    entrypoints: [],
    dependencies: [],
    integrations: [],
    hotspots: [],
  };
}

function createPhpRepoIndex(framework?: 'laravel' | 'symfony' | 'codeigniter'): RepoIndex {
  const stack = [
    { name: 'php', type: 'language' as const, version: '^8.2', source: 'composer.json' },
  ];
  if (framework) {
    stack.push({ name: framework, type: 'language' as const, version: 'detected', source: 'composer.json' });
  }
  return {
    project: { name: 'php-app', type: 'backend', rootPath: '/repo', detectedAt: '' },
    stack,
    modules: [],
    entrypoints: [],
    dependencies: [],
    integrations: [],
    hotspots: [],
  };
}

function createDotnetRepoIndex(framework?: 'asp.net'): RepoIndex {
  const stack = [
    { name: 'dotnet', type: 'runtime' as const, version: 'net8.0', source: 'App.csproj' },
    { name: 'csharp', type: 'language' as const, version: 'detected', source: 'file-extensions' },
  ];
  if (framework) {
    stack.push({ name: framework, type: 'language' as const, version: 'detected', source: 'App.csproj' });
  }
  return {
    project: { name: 'dotnet-app', type: 'backend', rootPath: '/repo', detectedAt: '' },
    stack,
    modules: [],
    entrypoints: [],
    dependencies: [],
    integrations: [],
    hotspots: [],
  };
}

function createJavaRepoIndex(framework?: 'spring-boot' | 'spring-mvc'): RepoIndex {
  const stack = [
    { name: 'java', type: 'language' as const, version: 'unknown', source: 'pom.xml' },
  ];
  if (framework) {
    stack.push({ name: framework, type: 'language' as const, version: 'detected', source: 'pom.xml' });
  }
  return {
    project: { name: 'java-app', type: 'backend', rootPath: '/repo', detectedAt: '' },
    stack,
    modules: [],
    entrypoints: [],
    dependencies: [],
    integrations: [],
    hotspots: [],
  };
}

describe('Rule Catalog', () => {
  it('deve ter regras com IDs únicos', () => {
    const ids = ALL_RULES.map((r) => r.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('deve ter regras de segurança com referência OWASP ou CWE', () => {
    for (const rule of SECURITY_RULES) {
      const hasFramework = rule.frameworks.some(
        (f) => f.includes('OWASP') || f.includes('CWE') || f.includes('LGPD'),
      );
      expect(hasFramework, `Rule ${rule.id} missing OWASP/CWE framework reference`).toBe(true);
    }
  });
});

describe('Compliance Engine', () => {
  it('deve detectar credenciais hardcoded no código', async () => {
    const fs = createMockFs({
      '/repo/src/Auth.ts': `
        const response = await fetch(url, {
          body: JSON.stringify({
            usuario: 'admin',
            password: '8wW49oHPq9pC'
          })
        });
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const credFinding = findings.find((f) => f.id === 'SEC-CRED-001');
    expect(credFinding).toBeDefined();
    expect(credFinding!.severity).toBe('critical');
    expect(credFinding!.evidence.length).toBeGreaterThan(0);
    expect(credFinding!.evidence[0].file).toBe('src/Auth.ts');
  });

  it('deve detectar console.log ativo', async () => {
    const fs = createMockFs({
      '/repo/src/Store.ts': `
        console.log('[Store] Token obtido com sucesso');
        console.log('[Store] Erro:', error);
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const logFinding = findings.find((f) => f.id === 'SEC-LOG-001');
    expect(logFinding).toBeDefined();
    expect(logFinding!.severity).toBe('medium');
    expect(logFinding!.evidence.length).toBeGreaterThan(0);
  });

  it('deve detectar catch vazio', async () => {
    const fs = createMockFs({
      '/repo/src/Api.ts': `
        try {
          await fetch(url);
        } catch (error) { }
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const errFinding = findings.find((f) => f.id === 'SEC-ERR-001');
    expect(errFinding).toBeDefined();
  });

  it('deve detectar uso de CPF em logs/database', async () => {
    const fs = createMockFs({
      '/repo/src/ApiStore.ts': `
        const cpf = store._CPF;
        database().ref('logs/' + cpf).set({ url, data });
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const piiFinding = findings.find((f) => f.id === 'SEC-LOG-002');
    expect(piiFinding).toBeDefined();
    expect(piiFinding!.severity).toBe('high');
  });

  it('não deve gerar findings para código limpo', async () => {
    const fs = createMockFs({
      '/repo/src/Clean.ts': `
        export function greet(name: string): string {
          return 'Hello ' + name;
        }
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const securityFindings = findings.filter(
      (f) => f.id === 'SEC-CRED-001' || f.id === 'SEC-LOG-001',
    );
    expect(securityFindings).toHaveLength(0);
  });

  it('deve filtrar regras por stack aplicável', () => {
    const engine = new ComplianceEngine(createMockFs({}));
    const rules = engine.loadRules();

    const mobileRules = rules.filter((r) => r.appliesTo.includes('react-native'));
    expect(mobileRules.length).toBeGreaterThan(0);
  });
});

describe('Compliance Engine — PHP / Laravel / Symfony', () => {
  it('SEC-SQL-001: detecta SQL injection via $_GET/$_POST', async () => {
    const fs = createMockFs({
      '/repo/src/UserRepo.php': `<?php
        $id = $_GET['id'];
        $sql = "SELECT * FROM users WHERE id = " . $id;
        $rows = $db->query("DELETE FROM logs WHERE owner = '$_POST[owner]'");
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createPhpRepoIndex('laravel'));

    const sqlFinding = findings.find((f) => f.id === 'SEC-SQL-001');
    expect(sqlFinding, 'expected SEC-SQL-001 for PHP').toBeDefined();
    expect(sqlFinding!.severity).toBe('critical');
    expect(sqlFinding!.evidence[0].file).toBe('src/UserRepo.php');
  });

  it('SEC-CRYPTO-001: detecta md5() e sha1() em PHP', async () => {
    const fs = createMockFs({
      '/repo/src/Auth.php': `<?php
        $hash = md5($password);
        $token = sha1($salt . $secret);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-CRYPTO-001');
    expect(f, 'expected SEC-CRYPTO-001 for PHP').toBeDefined();
    expect(f!.severity).toBe('high');
  });

  it('SEC-DESER-001: detecta unserialize de input do usuário', async () => {
    const fs = createMockFs({
      '/repo/src/Session.php': `<?php
        $data = unserialize($_COOKIE['session']);
        $cfg = unserialize($_POST['config']);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-DESER-001');
    expect(f, 'expected SEC-DESER-001 for PHP').toBeDefined();
  });

  it('SEC-CMD-001: detecta exec/system/passthru com input do usuário', async () => {
    const fs = createMockFs({
      '/repo/src/Cmd.php': `<?php
        exec("ls " . $_GET['dir']);
        system($_POST['command']);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-CMD-001');
    expect(f, 'expected SEC-CMD-001 for PHP').toBeDefined();
    expect(f!.severity).toBe('critical');
  });

  it('SEC-PATH-001: detecta path traversal via include/require/file_get_contents', async () => {
    const fs = createMockFs({
      '/repo/src/File.php': `<?php
        include $_GET['page'] . '.php';
        $content = file_get_contents($_REQUEST['file']);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-PATH-001');
    expect(f, 'expected SEC-PATH-001 for PHP').toBeDefined();
  });

  it('SEC-XSS-001: detecta echo/print de input do usuário', async () => {
    const fs = createMockFs({
      '/repo/src/View.php': `<?php
        echo $_GET['name'];
        print $_POST['comment'];
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-XSS-001');
    expect(f, 'expected SEC-XSS-001 for PHP').toBeDefined();
  });

  it('CQ-DEPRECATED-001: detecta extensão mysql_* removida no PHP 7+', async () => {
    const fs = createMockFs({
      '/repo/src/Legacy.php': `<?php
        $link = mysql_connect("localhost", "user", "pwd");
        $result = mysql_query("SELECT * FROM t");
        $row = mysql_fetch_assoc($result);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'CQ-DEPRECATED-001');
    expect(f, 'expected CQ-DEPRECATED-001 for PHP').toBeDefined();
  });

  it('SEC-CRED-001: credenciais hardcoded também valem em PHP', async () => {
    const fs = createMockFs({
      '/repo/src/Config.php': `<?php
        $api_key = "AKIA1234567890ABCDEF";
        $password = "supersecret123";
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-CRED-001');
    expect(f, 'expected SEC-CRED-001 for PHP').toBeDefined();
  });

  it('SEC-ERR-001: catch vazio em PHP', async () => {
    const fs = createMockFs({
      '/repo/src/Try.php': `<?php
        try {
          $client->request();
        } catch (\\Exception $e) { }
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    expect(findings.find((x) => x.id === 'SEC-ERR-001'), 'expected SEC-ERR-001 for PHP').toBeDefined();
  });
});

describe('Compliance Engine — .NET / C# / ASP.NET', () => {
  it('SEC-SQL-001: detecta concatenação em SqlCommand/CommandText', async () => {
    const fs = createMockFs({
      '/repo/Repos/UserRepo.cs': `
        var cmd = new SqlCommand("SELECT * FROM users WHERE id = " + Request["id"], conn);
        cmd.CommandText = "DELETE FROM logs WHERE owner = '" + userInput + "'";
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex('asp.net'));
    const f = findings.find((x) => x.id === 'SEC-SQL-001');
    expect(f, 'expected SEC-SQL-001 for .NET').toBeDefined();
  });

  it('SEC-CRYPTO-001: detecta MD5.Create / SHA1.Create', async () => {
    const fs = createMockFs({
      '/repo/Crypto.cs': `
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
        using var sha = SHA1.Create();
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-CRYPTO-001');
    expect(f, 'expected SEC-CRYPTO-001 for .NET').toBeDefined();
  });

  it('SEC-DESER-001: detecta BinaryFormatter.Deserialize', async () => {
    const fs = createMockFs({
      '/repo/Session.cs': `
        var bf = new BinaryFormatter();
        var obj = bf.Deserialize(stream);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-DESER-001');
    expect(f, 'expected SEC-DESER-001 for .NET').toBeDefined();
  });

  it('SEC-CMD-001: detecta Process.Start com input do usuário', async () => {
    const fs = createMockFs({
      '/repo/Cmd.cs': `
        Process.Start("cmd.exe", "/c " + Request.Form["command"]);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex('asp.net'));
    const f = findings.find((x) => x.id === 'SEC-CMD-001');
    expect(f, 'expected SEC-CMD-001 for .NET').toBeDefined();
  });

  it('SEC-PATH-001: detecta File.ReadAllText com input', async () => {
    const fs = createMockFs({
      '/repo/File.cs': `
        var content = File.ReadAllText(Request.QueryString["file"]);
        var stream = File.OpenRead(Request["path"]);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex('asp.net'));
    const f = findings.find((x) => x.id === 'SEC-PATH-001');
    expect(f, 'expected SEC-PATH-001 for .NET').toBeDefined();
  });

  it('SEC-XSS-001: detecta Response.Write com input', async () => {
    const fs = createMockFs({
      '/repo/Page.cs': `
        Response.Write("<h1>" + Request.QueryString["name"] + "</h1>");
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex('asp.net'));
    const f = findings.find((x) => x.id === 'SEC-XSS-001');
    expect(f, 'expected SEC-XSS-001 for .NET').toBeDefined();
  });

  it('SEC-ERR-001: catch vazio em C#', async () => {
    const fs = createMockFs({
      '/repo/Try.cs': `
        try { client.Send(); }
        catch (Exception) { }
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createDotnetRepoIndex());
    expect(findings.find((x) => x.id === 'SEC-ERR-001'), 'expected SEC-ERR-001 for .NET').toBeDefined();
  });
});

describe('Compliance Engine — Java / Spring', () => {
  it('SEC-SQL-001: detecta Statement.execute com concatenação', async () => {
    const fs = createMockFs({
      '/repo/src/Repo.java': `
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = " + request.getParameter("id"));
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex('spring-boot'));
    const f = findings.find((x) => x.id === 'SEC-SQL-001');
    expect(f, 'expected SEC-SQL-001 for Java').toBeDefined();
  });

  it('SEC-CRYPTO-001: detecta MessageDigest.getInstance("MD5"/"SHA-1")', async () => {
    const fs = createMockFs({
      '/repo/src/Crypto.java': `
        MessageDigest md = MessageDigest.getInstance("MD5");
        MessageDigest sha = MessageDigest.getInstance("SHA-1");
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-CRYPTO-001');
    expect(f, 'expected SEC-CRYPTO-001 for Java').toBeDefined();
  });

  it('SEC-DESER-001: detecta ObjectInputStream.readObject', async () => {
    const fs = createMockFs({
      '/repo/src/Session.java': `
        ObjectInputStream ois = new ObjectInputStream(input);
        Object obj = ois.readObject();
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex());
    const f = findings.find((x) => x.id === 'SEC-DESER-001');
    expect(f, 'expected SEC-DESER-001 for Java').toBeDefined();
  });

  it('SEC-CMD-001: detecta Runtime.exec com input', async () => {
    const fs = createMockFs({
      '/repo/src/Cmd.java': `
        Runtime.getRuntime().exec("ls " + request.getParameter("dir"));
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex('spring-boot'));
    const f = findings.find((x) => x.id === 'SEC-CMD-001');
    expect(f, 'expected SEC-CMD-001 for Java').toBeDefined();
  });

  it('SEC-CMD-001: detecta também variantes do nome da variável (req em vez de request)', async () => {
    const fs = createMockFs({
      '/repo/src/Cmd2.java': `
        Runtime.getRuntime().exec("ls " + req.getParameter("dir"));
        new File(httpReq.getParameter("path"));
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex('spring-boot'));
    expect(findings.find((x) => x.id === 'SEC-CMD-001'), 'expected SEC-CMD-001 with req.getParameter').toBeDefined();
    expect(findings.find((x) => x.id === 'SEC-PATH-001'), 'expected SEC-PATH-001 with httpReq.getParameter').toBeDefined();
  });

  it('SEC-PATH-001: detecta new File(request.getParameter)', async () => {
    const fs = createMockFs({
      '/repo/src/Files.java': `
        File f = new File(request.getParameter("path"));
        FileInputStream in = new FileInputStream(request.getParameter("file"));
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex('spring-boot'));
    const f = findings.find((x) => x.id === 'SEC-PATH-001');
    expect(f, 'expected SEC-PATH-001 for Java').toBeDefined();
  });

  it('SEC-ERR-001: catch vazio em Java', async () => {
    const fs = createMockFs({
      '/repo/src/Try.java': `
        try { client.request(); }
        catch (IOException e) { }
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createJavaRepoIndex());
    expect(findings.find((x) => x.id === 'SEC-ERR-001'), 'expected SEC-ERR-001 for Java').toBeDefined();
  });
});

describe('Compliance Engine — Falsos positivos', () => {
  it('NÃO deve disparar SEC-SQL-001 em código limpo com prepared statement', async () => {
    const fs = createMockFs({
      '/repo/src/Clean.php': `<?php
        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    expect(findings.find((x) => x.id === 'SEC-SQL-001')).toBeUndefined();
  });

  it('NÃO deve disparar SEC-CMD-001 em string literal de comando fixo', async () => {
    const fs = createMockFs({
      '/repo/src/Static.php': `<?php
        exec("ls /var/log");
      `,
    });

    const findings = await new ComplianceEngine(fs).evaluate('/repo', createPhpRepoIndex());
    expect(findings.find((x) => x.id === 'SEC-CMD-001')).toBeUndefined();
  });
});
