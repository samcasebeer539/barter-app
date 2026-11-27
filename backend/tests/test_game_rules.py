"""The Game model on its own: which moves each phase allows, turn order,
accepts, the turn timer and conflict-safe saves."""
from datetime import timedelta

import pytest

from models.game import Game, GameConflictError, NotYourTurnError

# Written out by hand (not copied from PHASE_TRANSITIONS) so a rule change
# has to be made on purpose in both places. phase -> {action: next phase}
EXPECTED = {
    "open": {"query": "open", "offer": "offer_pending", "decline": "declined"},
    "offer_pending": {"query": "offer_pending", "barter": "barter", "decline": "declined", "rescind": "open"},
    "barter": {"query": "barter", "counter": "barter", "subtract": "barter", "add": "barter",
               "stall": "barter", "accept": "close", "decline": "declined"},
    "close": {"query": "close", "where": "close", "when": "close", "accept": "agreed", "decline": "declined"},
    "agreed": {"review": "completed"},
    "declined": {},
    "completed": {},
}
ALL_ACTIONS = sorted({a for moves in EXPECTED.values() for a in moves})


def _game(phase):
    from bson import ObjectId
    return Game(ObjectId(), ObjectId(), ObjectId(), phase=phase)


@pytest.mark.parametrize("phase", EXPECTED)
@pytest.mark.parametrize("action", ALL_ACTIONS)
def test_every_action_in_every_phase(phase, action):
    game = _game(phase)
    if action in EXPECTED[phase]:
        assert game.next_phase(action) == EXPECTED[phase][action]
    else:
        with pytest.raises(ValueError):
            game.next_phase(action)


def test_no_phase_is_missing_from_the_table():
    assert set(Game.PHASE_TRANSITIONS) | set(Game.CLOSED_PHASES) == set(EXPECTED)


# ── turns ────────────────────────────────────────────────────────────────────

def test_turns_only_enforced_in_barter_and_close(user, post, game):
    a, b = user("alice"), user("bob")
    for phase in ("open", "offer_pending"):
        g = Game.get(game(a, b, post(b), phase=phase, turn=b))
        g.check_turn(a["_id"], "decline")  # off-turn but not enforced: no error
    for phase in ("barter", "close"):
        g = Game.get(game(a, b, post(b), phase=phase, turn=b))
        with pytest.raises(NotYourTurnError):
            g.check_turn(a["_id"], "stall")
        g.check_turn(b["_id"], "stall")


def test_unanswered_question_blocks_the_turn(user, post, game, turn, db):
    a, b = user("alice"), user("bob")
    gid = game(a, b, post(b), phase="barter", turn=b)
    q = turn(gid, "query", a, in_turn=True, answered_at=None)
    with pytest.raises(NotYourTurnError):
        Game.get(gid).check_turn(b["_id"], "stall")
    db.trades_collection.update_one({"_id": q}, {"$set": {"answered_at": "now"}})
    Game.get(gid).check_turn(b["_id"], "stall")


# ── accepts ──────────────────────────────────────────────────────────────────

def test_one_accept_passes_turn_two_accepts_advance(user, post, game):
    a, b = user("alice"), user("bob")
    g = Game.get(game(a, b, post(b), phase="barter", turn=a))
    assert g.accept(a["_id"]) is False
    assert (g.phase, g.turn_user_id, g.accepts["initiator"]) == ("barter", b["_id"], True)
    assert g.accept(b["_id"]) is True
    assert g.phase == "close"
    assert g.accepts == {"initiator": False, "receiver": False}  # fresh for close


def test_changing_the_deal_clears_accepts(user, post, game):
    a, b = user("alice"), user("bob")
    g = Game.get(game(a, b, post(b), phase="barter", turn=a))
    g.accept(a["_id"])
    g.apply_transition("add", next_turn_user_id=a["_id"], actor_id=b["_id"])
    assert g.accepts == {"initiator": False, "receiver": False}


def test_stall_keeps_accepts(user, post, game):
    a, b = user("alice"), user("bob")
    g = Game.get(game(a, b, post(b), phase="barter", turn=a))
    g.accept(a["_id"])
    g.apply_transition("stall", next_turn_user_id=a["_id"], actor_id=b["_id"])
    assert g.accepts["initiator"] is True


# ── turn timer ───────────────────────────────────────────────────────────────

def test_turn_timer_declines_for_the_player_who_ran_out(user, post, game, db, phase_of):
    a, b = user("alice"), user("bob")
    gid = game(a, b, post(b), phase="barter", turn=b)
    g = Game.get(gid)
    start = g.turn_started_at
    assert g.expire_if_overdue(now=start + Game.TURN_TIME_LIMIT - timedelta(minutes=1)) is False
    assert g.expire_if_overdue(now=start + Game.TURN_TIME_LIMIT + timedelta(minutes=1)) is True
    assert phase_of(gid) == "declined"
    decline = db.trades_collection.find_one({"game_id": gid, "type": "decline"})
    assert (decline["actor_id"], decline["reason"]) == (b["_id"], "turn_timeout")


def test_no_timer_before_barter_or_after_agreeing(user, post, game):
    a, b = user("alice"), user("bob")
    for phase in ("open", "offer_pending", "agreed"):
        assert Game.get(game(a, b, post(b), phase=phase)).turn_deadline() is None


# ── conflict-safe saves ──────────────────────────────────────────────────────

def test_second_of_two_racing_saves_is_refused(user, post, game, db):
    a, b = user("alice"), user("bob")
    gid = game(a, b, post(b), phase="barter", turn=a)
    first, second = Game.get(gid), Game.get(gid)
    first.apply_transition("stall", next_turn_user_id=b["_id"], actor_id=a["_id"])
    first.save()
    second.apply_transition("stall", next_turn_user_id=b["_id"], actor_id=a["_id"])
    with pytest.raises(GameConflictError):
        second.save()
    assert db.games_collection.find_one({"_id": gid})["rev"] == 1


def test_games_from_before_revisions_still_save(user, post, game, db):
    a, b = user("alice"), user("bob")
    gid = game(a, b, post(b), phase="barter", turn=a)
    db.games_collection.update_one({"_id": gid}, {"$unset": {"rev": ""}})
    g = Game.get(gid)
    g.save()
    assert db.games_collection.find_one({"_id": gid})["rev"] == 1


def test_card_ids_leave_out_a_subtracted_target(user, post, game):
    a, b = user("alice"), user("bob")
    target, other = post(b), post(b)
    g = Game.get(game(a, b, target, phase="barter", receiver_cards=[other]))
    assert target in g.post_ids() and target not in g.card_ids()
