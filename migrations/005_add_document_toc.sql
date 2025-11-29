-- Add TOC (Table of Contents) metadata to documents
ALTER TABLE documents ADD COLUMN toc JSONB;

-- Create index for faster TOC queries
CREATE INDEX idx_documents_toc ON documents USING GIN (toc);

-- Add comment
COMMENT ON COLUMN documents.toc IS 'Table of contents metadata extracted from document structure';
