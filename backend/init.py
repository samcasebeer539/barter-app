from flask import Flask
from routes.dev.create_user.route import create_user_bp
from routes.dev.feed.route import feed_bp
from routes.dev.locations.route import locations_bp
from routes.dev.locations.user_id.route import locations_userid_bp
from routes.dev.post_id.route import postId_bp
from routes.dev.posts.post_id.route import posts_post_id_bp
from routes.dev.posts.route import posts_bp
from routes.dev.posts.offer.route import posts_offer_bp
from routes.dev.update_user.route import update_user_bp
from routes.dev.user_data.route import user_data_bp


app = Flask(__name__)

# Registers a blueprint (like an instance of the app) for each API route
app.register_blueprint(create_user_bp)
app.register_blueprint(feed_bp)
app.register_blueprint(locations_bp)
app.register_blueprint(locations_userid_bp)
app.register_blueprint(postId_bp)
app.register_blueprint(posts_post_id_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(posts_offer_bp)
app.register_blueprint(update_user_bp)
app.register_blueprint(user_data_bp)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)