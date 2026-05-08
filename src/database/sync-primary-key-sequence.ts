import { ObjectLiteral, Repository } from 'typeorm';

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function syncPrimaryKeySequence<T extends ObjectLiteral>(
  repository: Repository<T>,
): Promise<void> {
  const primaryColumn = repository.metadata.primaryColumns[0];

  if (!primaryColumn?.isGenerated) {
    return;
  }

  const tableName = repository.metadata.tableName;
  const schemaName = repository.metadata.schema;
  const qualifiedTableName = schemaName
    ? `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`
    : quoteIdentifier(tableName);
  const sequenceTableReference = schemaName
    ? `${schemaName}.${tableName}`
    : tableName;
  const primaryColumnName = quoteIdentifier(primaryColumn.databaseName);

  await repository.query(
    `SELECT setval(
      pg_get_serial_sequence($1, $2),
      COALESCE((SELECT MAX(${primaryColumnName}) FROM ${qualifiedTableName}), 0) + 1,
      false
    )`,
    [sequenceTableReference, primaryColumn.databaseName],
  );
}
