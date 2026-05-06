const SEARCH_SEPARATOR_CHARACTERS = /[%,()]/g;
const SEARCH_WHITESPACE = /\s+/g;

export function sanitizeSearchTerm(value: string) {
  return value.replace(SEARCH_SEPARATOR_CHARACTERS, " ").trim();
}

export function getSearchTerms(value: string) {
  return Array.from(
    new Set(
      sanitizeSearchTerm(value)
        .toLowerCase()
        .split(SEARCH_WHITESPACE)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  );
}

export function buildSupabaseOrSearchFilter(columns: string[], term: string) {
  const cleanTerm = sanitizeSearchTerm(term);

  if (!cleanTerm) return "";

  return columns.map((column) => `${column}.ilike.%${cleanTerm}%`).join(",");
}

export function applySupabaseMultiWordSearch<
  QueryBuilder extends { or: (filters: string) => QueryBuilder },
>(query: QueryBuilder, columns: string[], value: string) {
  return getSearchTerms(value).reduce((currentQuery, term) => {
    const filter = buildSupabaseOrSearchFilter(columns, term);
    return filter ? currentQuery.or(filter) : currentQuery;
  }, query);
}

export function textMatchesMultiWordSearch(
  values: Array<string | null | undefined>,
  search: string,
) {
  const terms = getSearchTerms(search);

  if (terms.length === 0) return true;

  const searchable = values.filter(Boolean).join(" ").toLowerCase();

  return terms.every((term) => searchable.includes(term));
}
