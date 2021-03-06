import { FileSystem } from '../FileSystem';
import { LicenseTextReader } from '../LicenseTextReader';
import { Compilation as compilation } from './FakeCompilation';
import { FakeLogger as logger } from './FakeLogger';

class FakeFileSystem implements FileSystem {
  pathSeparator: string = '/';

  constructor(
    private licenseFilenames: string[],
    private useCRLF: boolean = false
  ) {}

  readFileAsUtf8(filename: string) {
    return 'LICENSE-' + filename + (this.useCRLF ? '\r\n' : '');
  }

  pathExists(filename: string) {
    return filename !== '/project/notexist.txt';
  }

  isFileInDirectory(filename: string, directory: string) {
    return filename === '/project/LICENSE' || filename === 'custom_file.txt';
  }

  join(...paths: string[]) {
    return paths.join(this.pathSeparator);
  }

  resolvePath(pathInput: string) {
    return pathInput;
  }

  listPaths(dir: string): string[] {
    if (dir === '/project') {
      return this.licenseFilenames;
    }
    throw new Error(`not implemented for ${dir}`);
  }
}

describe('the license text reader', () => {
  test('overrides are honored', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENSE']),
      {},
      { foo: 'custom' },
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('custom');
  });

  test('LICENSE file is detected', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENSE']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('LICENSE-/project/LICENSE');
  });

  test('LICENCE file is detected', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENCE']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('LICENSE-/project/LICENCE');
  });

  test('license files ending with an extension are detected', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['license.txt']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('LICENSE-/project/license.txt');
  });

  test('license files with a suffix are detected', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['license-MIT.txt']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('LICENSE-/project/license-MIT.txt');
  });

  test('line endings are normalized', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENSE'], true),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      ''
    );
    expect(licenseText).toBe('LICENSE-/project/LICENSE\n');
  });

  test('non-matches return null', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem([]),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      'MIT'
    );
    expect(licenseText).toBe(null);
  });

  test('template dir is used as a fallback', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem([]),
      {},
      {},
      '/templates',
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      'MIT'
    );
    expect(licenseText).toBe('LICENSE-/templates/MIT.txt');
  });

  test('the SEE LICENSE IN license type resolves the license text from the specified file', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENSE']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      'SEE LICENSE IN custom_file.txt'
    );
    expect(licenseText).toBe('LICENSE-/project/custom_file.txt');
  });

  test('the SEE LICENSE IN license type does not try to resolve nonexistent files', () => {
    const reader: LicenseTextReader = new LicenseTextReader(
      logger,
      new FakeFileSystem(['LICENSE']),
      {},
      {},
      null,
      () => null
    );
    const licenseText = reader.readLicense(
      compilation,
      {
        name: 'foo',
        directory: '/project'
      },
      'SEE LICENSE IN https://something'
    );
    expect(licenseText).toBeNull();
  });
});
