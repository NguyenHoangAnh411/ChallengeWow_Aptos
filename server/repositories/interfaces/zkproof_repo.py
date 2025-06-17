from abc import ABC, abstractmethod
from typing import List


class IZkProofRepository(ABC):
    @abstractmethod
    def save_proof(
        self, room_id: str, winner_wallet_id: str, proof: str, scores: List[dict]
    ) -> None:
        pass
