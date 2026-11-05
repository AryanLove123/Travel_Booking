import { Injectable } from '@angular/core';
import { runSearch, SearchRequest } from './search-engine';
import { Observable } from 'rxjs';
import { SearchResult } from '../../models/domain.model';

export type SearchPayload = Omit<SearchRequest, 'requestId'>;

/** 
 `search()` returns a observable: subscribes post one request
 Fallback: if workers are not available, it will fallback to the main thread runSearch() function
**/
@Injectable({
  providedIn: 'root',
})
export class SearchWorkerService {
  worker: Worker | null = null;
  workerFailed = typeof Worker === 'undefined' || !window.Worker;
  nextId = 0;

  getWorker(): Worker | null {
    if (this.worker) return this.worker;
    try {
      this.worker = new Worker(new URL('./search.worker', import.meta.url), { type: 'module' });
      return this.worker;
    } catch {
      this.workerFailed = true;
      return null;
    }
  }

  runOnMainThread(
    request: SearchRequest,
    subscriber: {
      next: (value: SearchResult[]) => void;
      error(e: unknown): void;
      complete(): void;
    },
  ): void {
    try {
      subscriber.next(runSearch(request));
      subscriber.complete();
    } catch (error) {
      subscriber.error(error);
    }
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  search(payload: SearchPayload): Observable<SearchResult[]> {
    return new Observable<SearchResult[]>((subscriber) => {
      const request: SearchRequest = { ...payload, requestId: this.nextId++ };
      const worker = this.workerFailed ? null : this.getWorker();
      if (!worker) {
        this.runOnMainThread(request, subscriber);
        return;
      }

      const onMessage = (event: MessageEvent) => {
        if (event.data.requestId !== request.requestId) return;
        subscriber.next(event.data.results);
        subscriber.complete();
      };

      const onError = (error: ErrorEvent) => {
        subscriber.error(error);
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      worker.postMessage(request);

      return () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };
    });
  }

  ngOnDestroy(): void {
    this.terminate();
  }
}
