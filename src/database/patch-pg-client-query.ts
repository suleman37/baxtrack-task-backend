import { Client, QueryResult } from 'pg';

type QueryArgs =
  | [string]
  | [string, unknown[]]
  | [string, unknown[], (error: Error, result: QueryResult) => void];

type PatchedClient = Client & {
  __bxTrackPgQueryPatchApplied?: boolean;
};

const queryQueue = new WeakMap<Client, Promise<unknown>>();
const patchedPrototype = Client.prototype as PatchedClient;

if (!patchedPrototype.__bxTrackPgQueryPatchApplied) {
  const originalQuery = Client.prototype.query;

  Client.prototype.query = function patchedQuery(...args: QueryArgs) {
    const hasCallback =
      typeof args[args.length - 1] === 'function' || typeof args[0] !== 'string';

    if (hasCallback) {
      return originalQuery.apply(this, args);
    }

    const client = this as Client;
    const previousQuery = queryQueue.get(client) ?? Promise.resolve();

    const nextQuery = previousQuery
      .catch(() => undefined)
      .then(() => originalQuery.apply(client, args));

    queryQueue.set(
      client,
      nextQuery.finally(() => {
        if (queryQueue.get(client) === nextQuery) {
          queryQueue.delete(client);
        }
      }),
    );

    return nextQuery;
  };

  patchedPrototype.__bxTrackPgQueryPatchApplied = true;
}
