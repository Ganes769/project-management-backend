"""In-memory LIFO undo stack -- a textbook Stack abstraction.

Each browser session (identified by an opaque token sent in X-Session-Id)
gets its own bounded stack so memory stays predictable.

Entries live only in the running process -- they're lost on server restart.
That tradeoff keeps the DSA primitive front-and-centre without dragging in
a persistence layer for ephemeral undo state.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from threading import Lock
from typing import Any, Literal

UndoKind = Literal["task_delete"]


@dataclass
class UndoEntry:
    """A single reversible action.

    `kind` is a discriminator; `payload` carries whatever data the matching
    handler needs to reverse the original operation.
    """

    kind: UndoKind
    payload: dict[str, Any] = field(default_factory=dict)


class UndoStack:
    """Bounded LIFO stack -- push / pop / peek in O(1).

    Backed by `collections.deque(maxlen=...)`, so the *oldest* entry is
    silently dropped when the stack overflows. That matches the user-facing
    contract: "you can only undo your last N actions".
    """

    def __init__(self, maxsize: int = 20) -> None:
        self._items: deque[UndoEntry] = deque(maxlen=maxsize)

    def push(self, entry: UndoEntry) -> None:
        self._items.append(entry)

    def pop(self) -> UndoEntry | None:
        if not self._items:
            return None
        return self._items.pop()

    def peek(self) -> UndoEntry | None:
        return self._items[-1] if self._items else None

    def __len__(self) -> int:
        return len(self._items)


class _UndoRegistry:
    """Thread-safe map of session_id -> UndoStack."""

    def __init__(self, stack_size: int = 20) -> None:
        self._stacks: dict[str, UndoStack] = {}
        self._stack_size = stack_size
        self._lock = Lock()

    def stack_for(self, session_id: str) -> UndoStack:
        with self._lock:
            stack = self._stacks.get(session_id)
            if stack is None:
                stack = UndoStack(maxsize=self._stack_size)
                self._stacks[session_id] = stack
            return stack


_registry = _UndoRegistry()


def get_undo_stack(session_id: str) -> UndoStack:
    return _registry.stack_for(session_id)
