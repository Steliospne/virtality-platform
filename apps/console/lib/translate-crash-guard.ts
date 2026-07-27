declare global {
  interface Window {
    __translateCrashGuardInstalled?: boolean
  }
}

/**
 * Softens Node.prototype.removeChild / insertBefore so Chrome Translate (and
 * similar DOM-mutating extensions) cannot white-screen the React tree when they
 * re-parent text nodes out from under React's fiber references.
 *
 * Based on Dan Abramov's workaround from facebook/react#11538.
 */
export function installTranslateCrashGuard(): void {
  if (
    typeof window === 'undefined' ||
    typeof Node !== 'function' ||
    !Node.prototype
  ) {
    return
  }

  if (window.__translateCrashGuardInstalled) {
    return
  }
  window.__translateCrashGuardInstalled = true

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (child.parentNode !== this) {
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
