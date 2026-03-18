-- Remove ChatGPT citation / SEO audit capture, audit leads, IP rate limits,
-- and legacy store audit tables (no longer used by the backend).

DROP TABLE IF EXISTS chatgpt_citation_results;
DROP TABLE IF EXISTS chatgpt_citations;
DROP TABLE IF EXISTS audit_leads;
DROP TABLE IF EXISTS audit_rate_limits;
DROP TABLE IF EXISTS audit_results;
DROP TABLE IF EXISTS audits;
