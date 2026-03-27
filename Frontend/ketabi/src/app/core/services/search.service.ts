import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_ENDPOINTS } from "../constants/api-endpoints";
import { SearchParams, SearchResult, AutocompleteResult } from "../models/search.model";

@Injectable({ providedIn: "root" })
export class SearchService {
  private apiUrl = API_ENDPOINTS.books;

  constructor(private http: HttpClient) {}

  searchBooks(params: SearchParams): Observable<SearchResult> {
    let httpParams = new HttpParams()
      .set("query", params.query)
      .set("limit", params.limit?.toString() || "12")
      .set("skip", params.skip?.toString() || "0");

    if (params.language) httpParams = httpParams.set("language", params.language);
    if (params.age) httpParams = httpParams.set("age", params.age);

    return this.http.get<SearchResult>(`${this.apiUrl}/search`, { params: httpParams });
  }

  getAutocompleteSuggestions(query: string, limit: number = 5): Observable<AutocompleteResult> {
    const params = new HttpParams()
      .set("query", query)
      .set("limit", limit.toString());

    return this.http.get<AutocompleteResult>(`${this.apiUrl}/search/autocomplete`, { params });
  }
}
