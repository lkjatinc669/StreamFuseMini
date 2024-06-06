from flask import Flask, redirect, url_for
from blueprints import authBluePrint, fileBluePrint, streamBluePrint
import config

# Initialize the Flask application
app = Flask(
    __name__, 
    static_folder="src/static", 
    static_url_path="/core", 
    template_folder="src/templates"
)

# Load configuration from the config object
app.config.from_object(config.Config)

# Define the main route
@app.route('/', methods=['GET', 'POST'])
def index():
    return redirect(url_for("auth.login"))

# Register blueprints
app.register_blueprint(authBluePrint.authBP)
app.register_blueprint(fileBluePrint.fileBP, url_prefix="/folder")
app.register_blueprint(streamBluePrint.streamBP, url_prefix="/stream")

# Run the Flask application
if __name__ == '__main__':
    app.run(
        host="0.0.0.0",
        port=18800,
        debug=True
    )
