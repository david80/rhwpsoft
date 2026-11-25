// Windows 실행 파일에 앱 아이콘과 이름을 넣습니다. (electron-builder afterPack)
// signAndEditExecutable: false(PATCH-004)이면 electron-builder가 이 단계를 건너뛰어 Electron 기본값이 남습니다.
const fs = require('fs');
const path = require('path');
const { Data, NtExecutable, NtExecutableResource, Resource } = require('resedit');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'win32') return;

  const { appInfo, projectDir } = context.packager;
  const exePath = path.join(context.appOutDir, `${appInfo.productFilename}.exe`);
  const exe = NtExecutable.from(fs.readFileSync(exePath));
  const resource = NtExecutableResource.from(exe);

  const icon = Data.IconFile.from(fs.readFileSync(path.join(projectDir, 'build/icon.ico')));
  for (const group of Resource.IconGroupEntry.fromEntries(resource.entries)) {
    Resource.IconGroupEntry.replaceIconsForResource(
      resource.entries,
      group.id,
      group.lang,
      icon.icons.map((item) => item.data),
    );
  }

  const [version] = Resource.VersionInfo.fromEntries(resource.entries);
  const [language] = version.getAllLanguagesForStringValues();
  version.setFileVersion(appInfo.version, language.lang);
  version.setProductVersion(appInfo.version, language.lang);
  version.setStringValues(language, {
    CompanyName: appInfo.companyName,
    FileDescription: appInfo.productName,
    InternalName: appInfo.productName,
    LegalCopyright: appInfo.copyright,
    OriginalFilename: `${appInfo.productFilename}.exe`,
    ProductName: appInfo.productName,
  });
  version.outputToResourceEntries(resource.entries);

  resource.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
};
