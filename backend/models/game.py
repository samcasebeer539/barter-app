from datetime import datetime, timezone
from bson import ObjectId
from backend import games_collection


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
    ):
        self._id = _id
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
        },
        "barter": {
            "query": "barter",
            "counter": "barter",
            "verify": "barter",
            "stall": "barter",
            "accept": "close",
            "decline": "declined",
        },
        "close": {
            "query": "close",
            "where": "close",
            "when": "close",
            "accept": "close",
            "decline": "declined",
            "rate": "completed",
        },
    }
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
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @classmethod
    def get(cls, game_id: ObjectId) -> "Game | None":
        doc = games_collection.find_one({"_id": game_id})
        return cls.from_doc(doc) if doc else None

    @classmethod
    def get_or_create(cls, initiator_id: ObjectId, receiver_id: ObjectId, target_post_id: ObjectId) -> "Game":
        doc = games_collection.find_one({
            "initiator_user_id": initiator_id,
            "target_post_id": target_post_id,
        })
        if doc:
            return cls.from_doc(doc)

        game = cls(initiator_id, receiver_id, target_post_id)
        result = games_collection.insert_one(game.to_doc())
        game._id = result.inserted_id
        return game

    def save(self):
        self.updated_at = datetime.now(timezone.utc)
        games_collection.update_one(
            {"_id": self._id},
            {"$set": self.to_doc()},
            upsert=True,
        )

    def next_phase(self, action_type: str) -> str:
        """Look up the phase this game moves to after `action_type`.
        Raises ValueError if the action isn't valid in the current phase."""
        valid_actions = self.PHASE_TRANSITIONS.get(self.phase, {})
        if action_type not in valid_actions:
            raise ValueError(
                f"Action '{action_type}' is not valid in phase '{self.phase}'"
            )
        return valid_actions[action_type]

    def apply_transition(self, action_type: str, next_turn_user_id: ObjectId = None):
        """Validates and applies a phase transition for the given action."""
        next_phase = self.next_phase(action_type)
        self.advance(next_phase, next_turn_user_id=next_turn_user_id)

        
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
        if next_phase in ("declined", "completed"):
            self.completed_at = datetime.now(timezone.utc)

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
        }