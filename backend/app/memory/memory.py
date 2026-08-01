from collections import deque


class Memory:
    """
    Stores recent conversation history.
    """

    def __init__(self, max_history: int = 20):
        self.history = deque(maxlen=max_history)

    def add(self, role: str, content: str):
        self.history.append(
            {
                "role": role,
                "content": content,
            }
        )

    def get_history(self):
        return list(self.history)

    def clear(self):
        self.history.clear()