export class AppVersionService {

    private static appVersion:string = null;

    public async init() {
        overwolf.extensions.current.getManifest(function(app) {
            if(app?.meta) {
                AppVersionService.appVersion = app.meta.version
                console.log(app.meta['minimum-gep-version']);
            }
        })
    }

    public static getAppVersion():string {
        return AppVersionService.appVersion;
    }

}