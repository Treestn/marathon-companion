import { I18nHelper } from "../locale/I18nHelper";
import { FilterConst, FilterDict } from "../escape-from-tarkov/constant/FilterConst";

export class FilterAdapter {
 
    private static _instance:FilterAdapter;

    private static filters:FilterDict;

    private constructor() {
        FilterAdapter.filters = FilterConst
    }

    public static setFilters(filters:FilterDict) {
        this.filters = filters;
    }

    public static getLocalizedFilter(name:string): string {
        this._instance ??= new FilterAdapter();
        for(const filter in FilterAdapter.filters) {
            if(FilterAdapter.filters[filter].name === name) {
                return FilterAdapter.filters[filter].locales?.[I18nHelper.currentLocale()] ?? FilterAdapter.filters[filter].name;
            }
            for(const child of FilterAdapter.filters[filter].child) {
                if(child.name === name) {
                    return child.locales?.[I18nHelper.currentLocale()] ?? child.name;
                }
            }
        }
        return name;
    }

    public static getParentFilter(childName:string) {
        this._instance ??= new FilterAdapter();
        for(const filter in FilterAdapter.filters) {
            if(FilterAdapter.filters[filter].name === childName) {
                return FilterAdapter.filters[filter]
            }
            for(const child of FilterAdapter.filters[filter].child) {
                if(child.name === childName) {
                    return FilterAdapter.filters[filter]
                }
            }
        }
        return null;
    }

}