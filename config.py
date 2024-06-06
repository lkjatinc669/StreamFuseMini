class Config(object):
    DEBUG = True
    DEVELOPMENT = True
    SECRET_KEY = 'do-i-really-need-this'
    # FLASK_HTPASSWD_PATH = '/secret/.htpasswd'
    FLASK_SECRET = SECRET_KEY
    DB_HOST = 'database' # a docker link

class ProductionConfig(Config):
    DEVELOPMENT = False
    DEBUG = False
    DB_HOST = 'my.production.database'