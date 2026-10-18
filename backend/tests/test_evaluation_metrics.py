from app.services.evaluation import token_f1


def test_token_f1_exact_match():
    assert token_f1("The cat sat", "the cat sat") == 1.0


def test_token_f1_no_overlap():
    assert token_f1("alpha beta", "gamma delta") == 0.0


def test_token_f1_partial_overlap_is_bounded():
    score = token_f1("cat sat on mat", "cat on mat")
    assert 0 < score < 1
