"""Photos: only this app's own uploads are accepted, and photos you remove
are deleted from Storage."""
import pytest
from bson import ObjectId

import conftest
from conftest import photo_url


# ── what's accepted ──────────────────────────────────────────────────────────

def _refused_photo_urls(pid):
    return [
        "https://example.com/cat.jpg",                                          # another site
        f"http://firebasestorage.googleapis.com/v0/b/test-bucket/o/post_photos%2Falice%2F{pid}%2F1",  # not https
        photo_url(f"post_photos/alice/{pid}/1", bucket="someone-elses-bucket"),  # another project
        photo_url(f"post_photos/bob/{pid}/1"),                                  # someone else's upload
        photo_url(f"post_photos/alice/{ObjectId()}/1"),                         # another post's photo
        photo_url(f"post_photos/alice/{pid}/../{ObjectId()}/1"),                # sneaking out of the folder
        photo_url("profile_photos/alice.jpg"),                                  # not a post photo
        photo_url(f"post_photos/alice/{pid}/1").replace("googleapis.com", "googleapis.com.evil.com"),  # look-alike host
        123,
    ]


def test_post_photos_must_be_this_posts_own_uploads(api, user, post):
    alice = user("alice")
    pid = post(alice)
    for bad in _refused_photo_urls(pid):
        assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": [bad]})[0] == 400, bad
        assert api.post("/dev/posts", as_="alice", json={"_id": str(pid), "photos": [bad]})[0] in (400, 409), bad
    good = photo_url(f"post_photos/alice/{pid}/1_0")
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": [good]})[0] == 200


def test_a_new_post_with_photos_needs_its_own_id(api, user):
    user("alice")
    pid = str(ObjectId())
    # Photos are stored under the post's id, so a post without one can't have any.
    assert api.post("/dev/posts", as_="alice", json={"photos": [photo_url(f"post_photos/alice/{pid}/1_0")]})[0] == 400
    assert api.post("/dev/posts", as_="alice", json={"_id": pid, "photos": [photo_url(f"post_photos/alice/{pid}/1_0")]})[0] == 201


@pytest.mark.parametrize("url", [
    "https://example.com/me.jpg",
    photo_url("profile_photos/bob.jpg"),
    photo_url("profile_photos/alicex.jpg"),
    photo_url("profile_photos/alice.jpg", bucket="other"),
    photo_url("post_photos/alice/x/1"),
    42,
])
def test_profile_photo_must_be_your_own_upload(api, user, db, url):
    user("alice")
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": url})[0] == 400
    assert "profile_photo" not in db.user_data_collection.find_one({"firebase_uid": "alice"})


def test_photos_already_saved_are_left_alone(api, user, post, db):
    # Saved before these checks existed: still editable, and saving the
    # profile (which resends the photo) still works.
    old = "https://example.com/old.jpg"
    alice = user("alice", profile_photo=old)
    pid = post(alice, photos=[old])
    conftest.storage_files.add("profile_photos/alice.jpg")
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": [old], "post_title": "Lamp"})[0] == 200
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": old, "bio": "hi"})[0] == 200
    me = db.user_data_collection.find_one({"firebase_uid": "alice"})
    assert me["profile_photo"] == old and me["bio"] == "hi"
    assert "profile_photos/alice.jpg" in conftest.storage_files   # unchanged photo: nothing deleted
    # Someone else's post's photo still isn't yours to use.
    bob = user("bob")
    assert api.patch(f"/dev/posts/{post(bob)}", as_="bob", json={"photos": [old]})[0] == 400


def test_profile_photo_can_be_set_or_cleared(api, user, db):
    user("alice")
    me = photo_url("profile_photos/alice.png")
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": me})[0] == 200
    assert db.user_data_collection.find_one({"firebase_uid": "alice"})["profile_photo"] == me
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": ""})[0] == 200
    assert db.user_data_collection.find_one({"firebase_uid": "alice"})["profile_photo"] == ""


# ── cleaning up ──────────────────────────────────────────────────────────────

def test_photos_removed_from_a_post_are_deleted(api, user, post):
    alice, bob = user("alice"), user("bob")
    pid, other = post(alice), post(alice)
    conftest.storage_files.update({
        f"post_photos/alice/{pid}/1_0", f"post_photos/alice/{pid}/1_1",
        f"post_photos/alice/{pid}/2_0",            # left over from a save that never finished
        f"post_photos/alice/{other}/1_0",          # another post: untouched
        f"post_photos/bob/{pid}/1_0",              # someone else: untouched
    })
    keep = photo_url(f"post_photos/alice/{pid}/1_1")
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": [keep]})[0] == 200
    assert conftest.storage_files == {
        f"post_photos/alice/{pid}/1_1", f"post_photos/alice/{other}/1_0", f"post_photos/bob/{pid}/1_0",
    }


def test_editing_only_the_text_leaves_photos_alone(api, user, post):
    alice = user("alice")
    pid = post(alice)
    conftest.storage_files.add(f"post_photos/alice/{pid}/1_0")
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"post_title": "New name"})[0] == 200
    assert conftest.storage_files == {f"post_photos/alice/{pid}/1_0"}


def test_a_refused_or_failed_edit_deletes_nothing(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    pid = post(alice)
    conftest.storage_files.add(f"post_photos/alice/{pid}/1_0")
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": ["https://example.com/x.jpg"]})[0] == 400
    assert api.patch(f"/dev/posts/{ObjectId()}", as_="alice", json={"photos": []})[0] == 404
    game(bob, alice, pid, phase="barter")   # locked in a trade
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": []})[0] == 409
    assert conftest.storage_files == {f"post_photos/alice/{pid}/1_0"}


def test_an_old_profile_photo_with_another_extension_is_deleted(api, user):
    user("alice")
    conftest.storage_files.update({"profile_photos/alice.png", "profile_photos/alice.jpg", "profile_photos/alicex.jpg"})
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": photo_url("profile_photos/alice.jpg")})[0] == 200
    assert conftest.storage_files == {"profile_photos/alice.jpg", "profile_photos/alicex.jpg"}
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": None})[0] == 200
    assert conftest.storage_files == {"profile_photos/alicex.jpg"}


def test_storage_trouble_never_fails_the_save(api, user, post, monkeypatch):
    alice = user("alice")
    pid = post(alice)
    import firebase_admin
    monkeypatch.setattr(firebase_admin.storage, "bucket", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("down")))
    assert api.patch(f"/dev/posts/{pid}", as_="alice", json={"photos": []})[0] == 200
    assert api.patch("/dev/update_user", as_="alice", json={"profile_photo": ""})[0] == 200
