// i18nStore.ts
export type Translations = Record<string, any>;

export const Locales = [
    'cs','de','en','es','fr','hu','it','ja','ko','pl','pt','ro','ru','sk','tr','zh'
]

export class I18nStore {
  private readonly cache = new Map<string, Translations>();
  private current = 'en';

  constructor(
    private readonly basePath = '/i18n',
  ) {}

  getCurrent() {
    return this.current
  }

  async load(lang: string): Promise<void> {
    const key = (lang || 'en').toLowerCase().split('-')[0];
    const target = Locales.includes(key) ? key : 'en';

    // Always ensure English fallback is loaded
    if (!this.cache.has('en')) {
        await this.fetchInto('en');
    }
    if (!this.cache.has(target)) {
        await this.fetchInto(target);
    }

    this.current = target;
    document.documentElement.lang = this.current;
  }

  /** Translate a dotted key like "nav.home". Supports {placeholders} and plural objects. */
  t(path: string, params?: Record<string, unknown>, locale?:string): string {
    const dict = this.cache.get(locale ?? this.current);
    const fallback = this.cache.get('en');

    let node = this.get(dict, path);
    if (node === undefined) node = this.get(fallback, path);
    if (node === undefined) return `⟦${path}⟧`;

    // Plurals: { zero, one, other }
    if (params && typeof (params as any).count === 'number' && this.isPlural(node)) {
      const count = (params as any).count as number;
      const cat = new Intl.PluralRules(this.current).select(count); // 'one' | 'other' etc.
      const tpl = node[cat] ?? node.other ?? node.one ?? node.zero;
      return this.interpolate(tpl.replace('#', String(count)), params);
    }

    if (typeof node === 'string') return this.interpolate(node, params);
    return `⟦${path}⟧`;
  }

  /** Optional helper to read meta info from the file */
  get meta(): any {
    return this.cache.get(this.current)?.meta ?? {};
  }

  // ---- internals ----
  private async fetchInto(lang: string) {
    const res = await fetch(`${this.basePath}/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${lang}.json`);
    this.cache.set(lang, await res.json());
  }

  private get(dict: Translations | undefined, path: string): any {
    if (!dict) return undefined;
    return path.split('.').reduce<any>(
      (acc, part) => (acc && typeof acc === 'object') ? acc[part] : undefined,
      dict
    );
  }

  private isPlural(v: any) {
    return v && typeof v === 'object' && ['zero','one','two','few','many','other'].some(k => k in v);
  }

  private interpolate(str: string, params?: Record<string, unknown>) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? '').toString());
  }
}