CREATE TABLE test_backup (
    id UUID DEFAULT generateUUIDv4(),
    name String,
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;
INSERT INTO test_backup (name)
SELECT substring(toString(rand() * 1000000000), 1, 5) AS random_string
FROM numbers(100);