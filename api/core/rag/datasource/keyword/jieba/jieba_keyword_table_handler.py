import re
from typing import cast


class JiebaKeywordTableHandler:
    def __init__(self):
        import jieba.analyse  # type: ignore
        from core.rag.datasource.keyword.jieba.stopwords import STOPWORDS

        # Compatibility patch for Jieba versions or lazy initialization issues
        if hasattr(jieba.analyse, "default_tfidf"):
            # Old / standard jieba versions
            jieba.analyse.default_tfidf.stop_words = STOPWORDS  # type: ignore
        else:
            # Newer jieba versions or missing default_tfidf
            try:
                from jieba.analyse.tfidf import TFIDF
                jieba.analyse.default_tfidf = TFIDF()
                jieba.analyse.default_tfidf.stop_words = STOPWORDS
            except Exception as e:
                print(f"[WARN] jieba TFIDF initialization failed: {e}")

    def extract_keywords(
        self, text: str, max_keywords_per_chunk: int | None = 10
    ) -> set[str]:
        """Extract keywords with JIEBA tfidf."""
        import jieba.analyse  # type: ignore

        keywords = jieba.analyse.extract_tags(
            sentence=text,
            topK=max_keywords_per_chunk,
        )

        # jieba.analyse.extract_tags returns list[Any] when withFlag is False by default.
        keywords = cast(list[str], keywords)

        return set(self._expand_tokens_with_subtokens(set(keywords)))

    def _expand_tokens_with_subtokens(self, tokens: set[str]) -> set[str]:
        """Get subtokens from a list of tokens, filtering for stopwords."""
        from core.rag.datasource.keyword.jieba.stopwords import STOPWORDS

        results = set()
        for token in tokens:
            results.add(token)
            sub_tokens = re.findall(r"\w+", token)
            if len(sub_tokens) > 1:
                results.update({w for w in sub_tokens if w not in list(STOPWORDS)})

        return results
