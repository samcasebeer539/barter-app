"""Every game route, given broken requests, answers with a clear 4xx and
never a server error: missing fields, malformed ids, ids that don't exist,
and a signed-in Firebase user who has no profile yet."""
import pytest

from conftest import future_iso

FAKE = "6750a1b2c3d4e5f601234567"  # well-formed but matches nothing

# route -> the rest of a valid body (gameId / targetPostId / queryId added by the test)
GAME_ROUTES = {
    "/dev/trades/stall": {},
    "/dev/trades/trade_details/accept": {},
    "/dev/trades/trade_details/decline": {},
    "/dev/trades/where": {"locationId": "x"},
    "/dev/trades/when": {"proposedAt": future_iso(), "label": "Soon"},
    "/dev/trades/add": {"postId": FAKE},
    "/dev/trades/subtract": {"postId": FAKE},
    "/dev/trades/query": {"message": "hi"},
    "/dev/trades/review": {"rating": 5},
    "/dev/trades/barter": {"selectedPostIds": [FAKE]},
}
POST_ROUTES = ["/dev/trades/offer", "/dev/trades/rescind"]  # take targetPostId


@pytest.fixture
def alice(user):
    return user("alice")


@pytest.mark.parametrize("path", GAME_ROUTES)
def test_missing_game_id(api, alice, path):
    status, body = api.post(path, as_="alice", json=GAME_ROUTES[path])
    assert status == 400, body


@pytest.mark.parametrize("path", GAME_ROUTES)
def test_malformed_game_id(api, alice, path):
    status, body = api.post(path, as_="alice", json={"gameId": "nope", **GAME_ROUTES[path]})
    assert status == 400, body


@pytest.mark.parametrize("path", GAME_ROUTES)
def test_unknown_game(api, alice, path):
    status, body = api.post(path, as_="alice", json={"gameId": FAKE, **GAME_ROUTES[path]})
    assert status == 404, body


@pytest.mark.parametrize("path", list(GAME_ROUTES) + POST_ROUTES)
def test_signed_in_without_a_profile(api, path):
    body = {"gameId": FAKE, "targetPostId": FAKE, **GAME_ROUTES.get(path, {})}
    status, resp = api.post(path, as_="ghost", json=body)
    assert status == 404, resp


@pytest.mark.parametrize("path", POST_ROUTES)
@pytest.mark.parametrize("target,expected", [(None, 400), ("nope", 400), (FAKE, 404)])
def test_bad_target_post(api, alice, path, target, expected):
    body = {} if target is None else {"targetPostId": target}
    status, resp = api.post(path, as_="alice", json=body)
    assert status == expected, resp


@pytest.mark.parametrize("query_id,expected", [(None, 400), ("nope", 400), (FAKE, 404)])
def test_bad_answer_ids(api, alice, query_id, expected):
    body = {"message": "hi"} if query_id is None else {"queryId": query_id, "message": "hi"}
    assert api.post("/dev/trades/answer", as_="alice", json=body)[0] == expected


@pytest.mark.parametrize("game_id,expected", [("", 400), ("nope", 400), (FAKE, 404)])
def test_bad_get_trade(api, alice, game_id, expected):
    assert api.get(f"/dev/trades/trade_details/get_trade?gameId={game_id}", as_="alice")[0] == expected


def test_add_and_subtract_with_bad_post_ids(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = str(game(bob, alice, post(alice), phase="barter", initiator_cards=[post(bob)], turn=alice))
    for path in ("/dev/trades/add", "/dev/trades/subtract"):
        assert api.post(path, as_="alice", json={"gameId": gid})[0] == 400
        assert api.post(path, as_="alice", json={"gameId": gid, "postId": "nope"})[0] == 400
        assert api.post(path, as_="alice", json={"gameId": gid, "postId": FAKE})[0] == 400


@pytest.mark.parametrize("path", ["/dev/posts/nope", f"/dev/posts/{FAKE}"])
def test_bad_post_ids_on_edit_and_delete(api, alice, path):
    assert api.patch(path, as_="alice", json={"post_title": "x"})[0] in (400, 404)
    assert api.delete(path, as_="alice")[0] in (400, 404)


@pytest.mark.parametrize("path", ["/dev/feed/nope", f"/dev/feed/{FAKE}"])
def test_bad_feed_post_ids(api, alice, path):
    assert api.get(path, as_="alice")[0] in (400, 404)


def test_no_json_body(api, alice):
    """A request with no JSON at all gets a 4xx, not a crash."""
    for path in list(GAME_ROUTES) + POST_ROUTES + ["/dev/trades/answer", "/dev/posts", "/dev/report"]:
        r = api.client.post(path, headers={"Authorization": "Bearer alice"})
        assert 400 <= r.status_code < 500, (path, r.status_code)


# ── moves in the wrong phase ─────────────────────────────────────────────────

# route -> (body extras, a phase where the move isn't allowed)
WRONG_PHASE = {
    "/dev/trades/stall": ({}, "close"),
    "/dev/trades/trade_details/accept": ({}, "offer_pending"),
    "/dev/trades/trade_details/decline": ({}, "agreed"),
    "/dev/trades/where": ({"locationId": "alice-loc"}, "barter"),
    "/dev/trades/when": ({"proposedAt": future_iso(), "label": "Soon"}, "barter"),
    "/dev/trades/add": (None, "close"),
    "/dev/trades/subtract": (None, "close"),
    "/dev/trades/barter": (None, "barter"),
}


@pytest.mark.parametrize("path", WRONG_PHASE)
def test_move_in_the_wrong_phase_is_refused(api, user, post, game, path, phase_of):
    alice, bob = user("alice"), user("bob")
    mine, theirs = post(alice), post(alice)
    bobs = post(bob)
    extras, phase = WRONG_PHASE[path]
    gid = game(bob, alice, mine, phase=phase, initiator_cards=[bobs], receiver_cards=[mine, theirs], turn=alice)
    if extras is None:
        extras = {"/dev/trades/add": {"postId": str(post(bob))},
                  "/dev/trades/subtract": {"postId": str(mine)},
                  "/dev/trades/barter": {"selectedPostIds": [str(bobs)]}}[path]
    status, body = api.post(path, as_="alice", json={"gameId": str(gid), **extras})
    assert status == 400, body
    assert phase_of(gid) == phase


@pytest.mark.parametrize("path", ["/dev/trades/stall", "/dev/trades/trade_details/accept",
                                  "/dev/trades/trade_details/decline", "/dev/trades/where",
                                  "/dev/trades/when", "/dev/trades/add", "/dev/trades/subtract"])
def test_move_off_turn_is_refused(api, user, post, game, path):
    alice, bob = user("alice"), user("bob")
    mine, bobs = post(alice), post(bob)
    phase = "close" if path in ("/dev/trades/where", "/dev/trades/when") else "barter"
    gid = game(bob, alice, mine, phase=phase, initiator_cards=[bobs], receiver_cards=[mine, post(alice)], turn=bob)
    extras = {"/dev/trades/where": {"locationId": "alice-loc"},
              "/dev/trades/when": {"proposedAt": future_iso(), "label": "Soon"},
              "/dev/trades/add": {"postId": str(post(bob))},
              "/dev/trades/subtract": {"postId": str(mine)}}.get(path, {})
    assert api.post(path, as_="alice", json={"gameId": str(gid), **extras})[0] == 403


# ── signed in, but no profile yet (mid sign-up) ──────────────────────────────

@pytest.mark.parametrize("path", [
    "/dev/posts", "/dev/feed", "/dev/feed/search?q=x", "/dev/locations", "/dev/user_data",
    "/settings", "/dev/profile_page", "/dev/blocked", "/dev/trades/open_tab", "/dev/trades/close_tab",
    "/dev/trades/barter", "/dev/trades/close", "/dev/trades/history?status=completed",
    "/dev/trades/open", "/dev/trades/query", "/dev/trades/declined", "/dev/trades/incoming",
    "/dev/trades/incoming_queries",
])
def test_reads_without_a_profile_dont_crash(api, path):
    status, _ = api.get(path, as_="ghost")
    assert status < 500, status
