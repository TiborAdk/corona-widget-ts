function createFileManager() {
    let fm;
    try {
        fm = FileManager.iCloud();
        fm.documentsDirectory();
    }
    catch (e) {
        console.warn(e);
        fm = FileManager.local();
    }
    return fm;
}
async function installScript(url) {
    const request = new Request(url);
    request.timeoutInterval = 10;
    const script = await request.loadString();
    const resp = request.response;
    if (!resp.statusCode || resp.statusCode !== 200) {
        console.warn('loading script failed');
        return;
    }
    if (script === '') {
        console.log('received empty script');
    }
    const fm = createFileManager();
    fm.writeString(this.module.filename, script);
}
// @ts-ignore
await installScript('https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/built/incidence.js');
//# sourceMappingURL=installer.js.map