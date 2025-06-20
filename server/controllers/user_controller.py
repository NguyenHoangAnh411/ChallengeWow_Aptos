from helpers.name_helper import generate_funny_username
from repositories.implement.user_repo_impl import UserRepository

class UserController:
    def __init__(self):
        self.user_repo = UserRepository()

    def login_or_create(self, wallet_address: str, username: str = None):
        user = self.user_repo.get_by_wallet(wallet_address)
        if user:
            return user
        
        if not username:
            username = generate_funny_username(wallet_address)
        
        return self.user_repo.create(wallet_address, username)

    def get_by_wallet(self, wallet_address: str):
        return self.user_repo.get_by_wallet(wallet_address)

    def update_username(self, wallet_address: str, username: str):
        return self.user_repo.update_username(wallet_address, username) 