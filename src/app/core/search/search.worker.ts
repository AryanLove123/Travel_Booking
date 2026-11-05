import { SearchRequest, SearchResponse, runSearch } from "./search-engine";

/**
 * Web worker: receives a SearchRequest, runs the pure search engine off the
 * main thread and posts back a SearchResponse. It holds no state, so every
 * request carries the data it needs (catalog + bookings snapshot).
 */
addEventListener('message', ({ data }: MessageEvent<SearchRequest>) => {
  let response: SearchResponse;
  try {
    response = { requestId: data.requestId, ok: true, results: runSearch(data) };
  } catch (error) {
    response = {
      requestId: data.requestId,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown search error',
    };
  }
  postMessage(response);
});