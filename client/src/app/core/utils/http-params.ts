import { HttpParams } from '@angular/common/http';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function toHttpParams(query: QueryParams): HttpParams {
  let params = new HttpParams();
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  });
  return params;
}
