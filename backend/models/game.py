from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from backend import games_collection, trades_collection, posts_collection


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Mongo hands datetimes back without a timezone; they're stored as UTC."""
    if dt is None or dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=timezone.utc)


def iso_utc(dt: Optional[datetime]) -> Optional[str]:
    """UTC timestamp with millisecond precision and a Z suffix, e.g.
    2026-10-04T20:14:00.123Z, which every JS engine's Date.parse accepts."""
    if dt is None:
        return None
    dt = _as_utc(dt).astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


class NotYourTurnError(Exception):
    """Raised when a player acts out of turn in a turn-based phase."""


class GameConflictError(Exception):
    """Raised by save() when someone else changed the game after it was
    loaded (e.g. a double tap, or both players moving at once). Nothing is
    written; the app shows a 409 and reloads."""


class Game:
    def __init__(
        self,
        initiator_user_id: ObjectId,
        receiver_user_id: ObjectId,
        target_post_id: ObjectId,
        _id: ObjectId = None,
        phase: str = "open",
        cards: dict = None,
        turn_user_id: ObjectId = None,
        accepts: dict = None,
        created_at: datetime = None,
        updated_at: datetime = None,
        completed_at: datetime = None,
        turn_started_at: datetime = None,
        rev: int = None,
    ):
        self._id = _id
        # Bumped on every save; a save only lands if it still matches (see save).
        self.rev = rev
        self.initiator_user_id = initiator_user_id
        self.receiver_user_id = receiver_user_id
        self.target_post_id = target_post_id
        self.phase = phase
        self.cards = cards or {"initiator": [], "receiver": []}
        self.turn_user_id = turn_user_id or receiver_user_id
        self.accepts = accepts or {"initiator": False, "receiver": False}
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
        self.completed_at = completed_at
        # When the current player's turn began; their deadline counts from here.
        self.turn_started_at = _as_utc(turn_started_at) or datetime.now(timezone.utc)

    PHASE_TRANSITIONS = {
        "open": {
            "query": "open",
            "offer": "offer_pending",
            "decline": "declined",
            
        },
        "offer_pending": {
            "query": "offer_pending",
            "barter": "barter",
            "decline": "declined",
            "rescind": "open"
        },
        "barter": {
            "query": "barter",
            "counter": "barter",
            "subtract": "barter",
            "add": "barter",
            "stall": "barter",
            "accept": "close",
            "decline": "declined",
        },
        "close": {
            "query": "close",
            "where": "close",
            "when": "close",
            # Needs a standing WHERE and WHEN (checked in the accept route);
            # once both players accept, the deal is agreed.
            "accept": "agreed",
            "decline": "declined",
        },
        # Deal agreed: items, place and time are settled. Not turn-based,
        # and no turn timer. Each player reviews the other once; the review
        # route completes the game after both have (see there).
        "agreed": {
            "review": "completed",
        },
    }

    # Phases where players alternate moves. Earlier phases (open,
    # offer_pending) are gated by role instead, since the initiator acts
    # first while turn_user_id still defaults to the receiver.
    TURN_ENFORCED_PHASES = {"barter", "close"}

    # Actions allowed out of turn in turn-based phases. None: even DECLINE
    # is only on your own turn (the app shows WAIT only off-turn).
    TURN_EXEMPT_ACTIONS = set()

    # Moves that change what's on the table. Any *accept made before one of
    # these was for a different deal, so it's cleared.
    DEAL_CHANGING_ACTIONS = {"counter", "add", "subtract", "where", "when"}

    # How long the active player has to move in a turn-enforced phase before
    # the game auto-declines on their behalf.
    TURN_TIME_LIMIT = timedelta(hours=48)
    # ── construction / persistence ──────────────────────────────────────

    @classmethod
    def from_doc(cls, doc: dict) -> "Game":
        return cls(
            _id=doc["_id"],
            initiator_user_id=doc["initiator_user_id"],
            receiver_user_id=doc["receiver_user_id"],
            target_post_id=doc["target_post_id"],
            phase=doc["phase"],
            cards=doc["cards"],
            turn_user_id=doc["turn_user_id"],
            accepts=doc["accepts"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            completed_at=doc.get("completed_at"),
            # Games saved before turn timers existed have no start time; they
            # get a fresh clock from now (persisted on their next save).
            turn_started_at=doc.get("turn_started_at"),
            rev=doc.get("rev"),
        )

    def to_doc(self) -> dict:
        doc = {
            "initiator_user_id": self.initiator_user_id,
            "receiver_user_id": self.receiver_user_id,
            "target_post_id": self.target_post_id,
            "phase": self.phase,
            "cards": self.cards,
            "turn_user_id": self.turn_user_id,
            "accepts": self.accepts,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
            "turn_started_at": self.turn_started_at,
            "rev": self.rev,
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @classmethod
    def get(cls, game_id: ObjectId) -> "Game | None":
        doc = games_collection.find_one({"_id": game_id})
        return cls.from_doc(doc) if doc else None

    CLOSED_PHASES = ["declined", "completed"]

    @classmethod
    def find_active(cls, initiator_id: ObjectId, target_post_id: ObjectId) -> "Game | None":
        """This player's ongoing game for this post, if any. Ended games
        (declined / completed) don't count: they stay as history."""
        doc = games_collection.find_one({
            "initiator_user_id": initiator_id,
            "target_post_id": target_post_id,
            "phase": {"$nin": cls.CLOSED_PHASES},
        })
        return cls.from_doc(doc) if doc else None

    @classmethod
    def get_or_create(cls, initiator_id: ObjectId, receiver_id: ObjectId, target_post_id: ObjectId) -> "Game":
        """The ongoing game for this player and post, or a fresh one. After a
        game ends, a new offer or question starts over in a new game."""
        existing = cls.find_active(initiator_id, target_post_id)
        if existing:
            return existing

        game = cls(initiator_id, receiver_id, target_post_id, rev=0)
        result = games_collection.insert_one(game.to_doc())
        game._id = result.inserted_id
        return game

    def save(self):
        """Write the game back, but only if nobody else saved it since it was
        loaded; otherwise raise GameConflictError. Two requests racing on the
        same turn (a double tap) can't both land. Games saved before revisions
        existed have no rev, which {"rev": None} matches."""
        loaded_rev = self.rev
        self.rev = (loaded_rev or 0) + 1
        self.updated_at = datetime.now(timezone.utc)
        result = games_collection.update_one(
            {"_id": self._id, "rev": loaded_rev},
            {"$set": self.to_doc()},
        )
        if result.matched_count == 0:
            self.rev = loaded_rev
            raise GameConflictError("This trade just changed. Refresh and try again.")

    @classmethod
    def force_decline(cls, game_id: ObjectId, actor_id_for, reason: str, now: datetime = None) -> bool:
        """Decline a game no matter what's happening in it (blocking, its post
        being traded). Retries if a player's move lands at the same moment.
        actor_id_for(game) picks who the decline is credited to. Returns True
        if it declined the game, False if it had already ended."""
        now = now or datetime.now(timezone.utc)
        for _ in range(5):
            game = cls.get(game_id)
            if not game or game.is_closed():
                return False
            was_agreed = game.phase == "agreed"
            game.advance("declined")
            try:
                game.save()
            except GameConflictError:
                continue
            if was_agreed:
                game.set_cards_traded(False)  # the deal is off: back in the feed
            trades_collection.insert_one({
                "game_id": game._id,
                "type": "decline",
                "actor_id": actor_id_for(game),
                "auto": True,
                "reason": reason,
                "created_at": now,
                "messages": [],
            })
            return True
        return False

    def next_phase(self, action_type: str) -> str:
        """Look up the phase this game moves to after `action_type`.
        Raises ValueError if the action isn't valid in the current phase."""
        valid_actions = self.PHASE_TRANSITIONS.get(self.phase, {})
        if action_type not in valid_actions:
            raise ValueError(
                f"Action '{action_type}' is not valid in phase '{self.phase}'"
            )
        return valid_actions[action_type]

    def check_turn(self, actor_id: ObjectId, action_type: str):
        """Raises NotYourTurnError if actor_id can't act right now."""
        if self.phase not in self.TURN_ENFORCED_PHASES:
            return
        if action_type in self.TURN_EXEMPT_ACTIONS:
            return
        if not self.is_turn(actor_id):
            raise NotYourTurnError(
                f"It's not your turn (action '{action_type}' in phase '{self.phase}')"
            )
        if self.pending_query_for(actor_id):
            raise NotYourTurnError("Answer the other player's question to begin your turn")

    def pending_query_for(self, user_id: ObjectId) -> Optional[dict]:
        """The other player's unanswered in-game question to user_id, if any.
        Until it's answered, user_id's turn can't begin. Queries asked before
        the game reached a turn-based phase don't block anything."""
        if self._id is None:
            return None
        return trades_collection.find_one(
            {
                "game_id": self._id,
                "type": "query",
                "actor_id": self.other_user(user_id),
                "in_turn": True,
                "answered_at": None,
            },
            sort=[("created_at", -1)],
        )

    def apply_transition(
        self,
        action_type: str,
        next_turn_user_id: ObjectId = None,
        actor_id: ObjectId = None,
    ):
        """Validates and applies a phase transition for the given action.

        Pass actor_id to enforce turn order (see TURN_ENFORCED_PHASES).
        Raises ValueError for an invalid action, NotYourTurnError for an
        out-of-turn move."""
        next_phase = self.next_phase(action_type)
        if actor_id is not None:
            self.check_turn(actor_id, action_type)
        if action_type in self.DEAL_CHANGING_ACTIONS:
            self.reset_accepts()
        self.advance(next_phase, next_turn_user_id=next_turn_user_id)

    def accept(self, actor_id: ObjectId) -> bool:
        """Record actor_id's *accept and pass the turn.

        The phase only moves on once BOTH players have accepted; until then
        the game stays put and the other player gets the turn so they can
        accept (or keep bartering). Returns True if the phase advanced.

        Raises ValueError / NotYourTurnError like apply_transition."""
        next_phase = self.next_phase("accept")
        self.check_turn(actor_id, "accept")

        self.accepts[self.role_of(actor_id)] = True
        other = self.other_user(actor_id)

        if all(self.accepts.values()):
            self.reset_accepts()  # fresh slate for the next phase
            self.advance(next_phase, next_turn_user_id=other)
            return True

        self.advance(self.phase, next_turn_user_id=other)
        return False

    def reset_accepts(self):
        self.accepts = {"initiator": False, "receiver": False}


    # ── domain logic ─────────────────────────────────────────────────────

    def other_user(self, actor_id: ObjectId) -> ObjectId:
        return self.receiver_user_id if actor_id == self.initiator_user_id else self.initiator_user_id

    def role_of(self, user_id: ObjectId) -> str:
        if user_id == self.initiator_user_id:
            return "initiator"
        if user_id == self.receiver_user_id:
            return "receiver"
        raise ValueError("user is not a participant in this game")

    def is_participant(self, user_id: ObjectId) -> bool:
        return user_id in (self.initiator_user_id, self.receiver_user_id)

    def is_turn(self, user_id: ObjectId) -> bool:
        return self.turn_user_id == user_id

    def is_closed(self) -> bool:
        return self.phase in ("declined", "completed")

    def add_card(self, role: str, post_id: ObjectId):
        if post_id not in self.cards[role]:
            self.cards[role].append(post_id)

    def remove_card(self, role: str, post_id: ObjectId):
        if post_id in self.cards[role]:
            self.cards[role].remove(post_id)

    def advance(self, next_phase: str, next_turn_user_id: ObjectId = None):
        self.phase = next_phase
        if next_turn_user_id is not None:
            self.turn_user_id = next_turn_user_id
            self.turn_started_at = datetime.now(timezone.utc)
        if next_phase in ("declined", "completed"):
            self.completed_at = datetime.now(timezone.utc)

    # ── turn timer ───────────────────────────────────────────────────────

    def turn_deadline(self) -> Optional[datetime]:
        """When the active player runs out of time, or None if this phase
        has no turn timer."""
        if self.phase not in self.TURN_ENFORCED_PHASES:
            return None
        return self.turn_started_at + self.TURN_TIME_LIMIT

    def expire_if_overdue(self, now: datetime = None) -> bool:
        """If the active player's time is up, decline the game on their
        behalf, save it, and log the decline. Returns True if it expired.

        There's no background job: this runs whenever a game is loaded, so
        an overdue game is declined the next time either player looks at it
        or tries to move."""
        deadline = self.turn_deadline()
        now = now or datetime.now(timezone.utc)
        if deadline is None or now < deadline:
            return False

        timed_out_user = self.turn_user_id
        self.advance("declined")
        try:
            self.save()
        except GameConflictError:
            return False  # someone just changed it; checked again next load
        trades_collection.insert_one({
            "game_id": self._id,
            "type": "decline",
            "actor_id": timed_out_user,
            "auto": True,
            "reason": "turn_timeout",
            "created_at": now,
            "messages": [],
        })
        return True

    @classmethod
    def expire_overdue_for_user(cls, user_id: ObjectId) -> int:
        """Run expire_if_overdue on every timed game this user is in.
        Returns how many were declined."""
        docs = games_collection.find({
            "$or": [{"initiator_user_id": user_id}, {"receiver_user_id": user_id}],
            "phase": {"$in": list(cls.TURN_ENFORCED_PHASES)},
        })
        return sum(1 for doc in docs if cls.from_doc(doc).expire_if_overdue())

    # Phases where a player's cards are committed to a trade.
    ACTIVE_PHASES = {"offer_pending", "barter", "close", "agreed"}

    @classmethod
    def locked_post_ids_for(cls, user_id: ObjectId) -> set:
        """The user's own posts that are in an active trade (on their side of
        any game in ACTIVE_PHASES). These can't be edited."""
        locked = set()
        docs = games_collection.find({
            "$or": [{"initiator_user_id": user_id}, {"receiver_user_id": user_id}],
            "phase": {"$in": list(cls.ACTIVE_PHASES)},
        })
        for doc in docs:
            role = "initiator" if doc["initiator_user_id"] == user_id else "receiver"
            locked.update(doc.get("cards", {}).get(role, []))
        return locked

    # Phases where the deal is final: its posts are spoken for.
    FINAL_PHASES = ["agreed", "completed"]

    @staticmethod
    def _posts_query(post_ids) -> dict:
        ids = list(post_ids)
        return {"$or": [
            {"target_post_id": {"$in": ids}},
            {"cards.initiator": {"$in": ids}},
            {"cards.receiver": {"$in": ids}},
        ]}

    @classmethod
    def traded_post_ids(cls, post_ids) -> set:
        """Which of post_ids are already in a finalized deal."""
        ids = set(post_ids)
        if not ids:
            return set()
        traded = set()
        for doc in games_collection.find({**cls._posts_query(ids), "phase": {"$in": cls.FINAL_PHASES}}):
            traded.update(ids & set(cls.from_doc(doc).card_ids()))
        return traded

    def decline_others_with_posts(self) -> int:
        """Once this deal is final, every other ongoing game that involves
        any of its posts (pending offers, open questions, barter, close) is
        declined. The decline is credited to whoever in that game is part of
        this deal, i.e. the owner of the traded post. Returns how many."""
        mine = self.card_ids()
        docs = games_collection.find({
            **self._posts_query(mine),
            "_id": {"$ne": self._id},
            "phase": {"$nin": self.CLOSED_PHASES},
        })
        now = datetime.now(timezone.utc)
        dealers = {self.initiator_user_id, self.receiver_user_id}
        owner = lambda g: next((u for u in (g.receiver_user_id, g.initiator_user_id) if u in dealers),
                               g.receiver_user_id)
        return sum(Game.force_decline(doc["_id"], owner, "post_traded", now) for doc in docs)

    def set_cards_traded(self, traded: bool = True):
        """Mark (or unmark) this deal's posts as traded. Traded posts are
        left out of everyone else's lists (feed, search, profiles); see
        helpers.NOT_TRADED."""
        ids = self.card_ids()
        if not ids:
            return
        if traded:
            posts_collection.update_many({"_id": {"$in": ids}}, {"$set": {"traded": True}})
        else:
            posts_collection.update_many({"_id": {"$in": ids}}, {"$unset": {"traded": ""}})

    def card_ids(self) -> list:
        """The posts actually on the table (both sides' cards). Unlike
        post_ids, leaves out the target post if it was subtracted."""
        return list(dict.fromkeys([*self.cards.get("initiator", []), *self.cards.get("receiver", [])]))

    def post_ids(self) -> list:
        """Every post in this game: both players' cards plus the target post."""
        ids = [self.target_post_id, *self.cards.get("initiator", []), *self.cards.get("receiver", [])]
        return list(dict.fromkeys(ids))  # de-duplicate, keep order

    # ── serialization for API responses ─────────────────────────────────

    def to_json(self) -> dict:
        return {
            "_id": str(self._id),
            "initiator_user_id": str(self.initiator_user_id),
            "receiver_user_id": str(self.receiver_user_id),
            "target_post_id": str(self.target_post_id),
            "phase": self.phase,
            "cards": {
                "initiator": [str(pid) for pid in self.cards["initiator"]],
                "receiver": [str(pid) for pid in self.cards["receiver"]],
            },
            "turn_user_id": str(self.turn_user_id),
            "accepts": self.accepts,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "turn_deadline": iso_utc(self.turn_deadline()),
        }