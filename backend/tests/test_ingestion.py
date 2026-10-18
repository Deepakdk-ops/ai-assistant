from app.services.ingestion import chunk_text


def test_chunk_text_empty():
    assert chunk_text("") == []


def test_chunk_text_preserves_content():
    text = " ".join(f"word{i}" for i in range(500))
    chunks = chunk_text(text, size=150, overlap=20)
    assert len(chunks) > 1
    assert all(chunks)
    assert "word0" in chunks[0]
    assert "word499" in chunks[-1]


def test_chunk_overlap_validation():
    try:
        chunk_text("hello world", size=10, overlap=10)
    except ValueError:
        pass
    else:
        raise AssertionError("Expected invalid overlap to fail")
