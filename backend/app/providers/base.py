from abc import ABC, abstractmethod


class ProviderAdapter(ABC):
    @abstractmethod
    def chat(self, question: str) -> str:
        raise NotImplementedError


class EchoProviderAdapter(ProviderAdapter):
    def chat(self, question: str) -> str:
        return f"Echo: {question}"
