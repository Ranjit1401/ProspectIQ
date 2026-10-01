from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    if not hashed_password or hashed_password == "google_auth_user":
        return False
    try:
        return password_hash.verify(password, hashed_password)
    except (UnknownHashError, ValueError, Exception):
        return False