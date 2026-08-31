import urllib.parse
from app.config import settings
from app.utils.logger import logger

def get_db_connection():
    """Establish and return a live connection to Supabase PostgreSQL database."""
    try:
        import psycopg2
        conn = psycopg2.connect(settings.DATABASE_URL)
        return conn
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL database: {e}")
        return None

def test_db_connection() -> bool:
    """Test PostgreSQL database connection status."""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()
            conn.close()
            return result[0] == 1
        except Exception as e:
            logger.error(f"Database query test failed: {e}")
    return False
