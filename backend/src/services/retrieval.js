import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

function serializeVector(embedding) {
  return '[' + embedding.join(',') + ']'
}

const HYBRID_QUERY = `
WITH vector_results AS (
  SELECT
    c.id, c.document_id, c.content, c.metadata,
    1 - (c.embedding <=> $1::vector) AS vector_score
  FROM chunks c
  ORDER BY c.embedding <=> $1::vector
  LIMIT 20
),
fts_results AS (
  SELECT
    c.id, c.document_id, c.content, c.metadata,
    ts_rank_cd(c.content_tsv, plainto_tsquery('english', $2)) AS fts_score
  FROM chunks c
  WHERE c.content_tsv @@ plainto_tsquery('english', $2)
  LIMIT 20
),
combined AS (
  SELECT
    COALESCE(v.id, f.id) AS id,
    COALESCE(v.document_id, f.document_id) AS document_id,
    COALESCE(v.content, f.content) AS content,
    COALESCE(v.metadata, f.metadata) AS metadata,
    COALESCE(v.vector_score, 0) * 0.7 + COALESCE(f.fts_score, 0) * 0.3 AS combined_score
  FROM vector_results v
  FULL OUTER JOIN fts_results f ON v.id = f.id
)
SELECT combined.*, d.title, d.source
FROM combined
JOIN documents d ON combined.document_id = d.id
ORDER BY combined_score DESC
LIMIT $3
`

export async function hybridSearch(queryEmbedding, queryText, topK = 7) {
  const { rows } = await pool.query(HYBRID_QUERY, [
    serializeVector(queryEmbedding),
    queryText,
    topK,
  ])
  return rows
}

export { pool }
