/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installTranslateCrashGuard } from './translate-crash-guard'

describe('installTranslateCrashGuard', () => {
  const originalRemoveChild = Node.prototype.removeChild
  const originalInsertBefore = Node.prototype.insertBefore

  beforeEach(() => {
    window.__translateCrashGuardInstalled = undefined
    Node.prototype.removeChild = originalRemoveChild
    Node.prototype.insertBefore = originalInsertBefore
  })

  afterEach(() => {
    window.__translateCrashGuardInstalled = undefined
    Node.prototype.removeChild = originalRemoveChild
    Node.prototype.insertBefore = originalInsertBefore
  })

  it('installs only once', () => {
    installTranslateCrashGuard()
    const guardedRemoveChild = Node.prototype.removeChild
    const guardedInsertBefore = Node.prototype.insertBefore

    installTranslateCrashGuard()

    expect(Node.prototype.removeChild).toBe(guardedRemoveChild)
    expect(Node.prototype.insertBefore).toBe(guardedInsertBefore)
  })

  it('does not throw when removeChild targets a node with a different parent', () => {
    installTranslateCrashGuard()

    const parent = document.createElement('div')
    const otherParent = document.createElement('div')
    const child = document.createTextNode('hello')
    otherParent.appendChild(child)

    expect(() => parent.removeChild(child)).not.toThrow()
    expect(child.parentNode).toBe(otherParent)
  })

  it('still removes a child that belongs to the parent', () => {
    installTranslateCrashGuard()

    const parent = document.createElement('div')
    const child = document.createTextNode('hello')
    parent.appendChild(child)

    expect(parent.removeChild(child)).toBe(child)
    expect(child.parentNode).toBeNull()
    expect(parent.childNodes).toHaveLength(0)
  })

  it('does not throw when insertBefore reference has a different parent', () => {
    installTranslateCrashGuard()

    const parent = document.createElement('div')
    const otherParent = document.createElement('div')
    const reference = document.createTextNode('ref')
    const newNode = document.createTextNode('new')
    otherParent.appendChild(reference)

    expect(() => parent.insertBefore(newNode, reference)).not.toThrow()
    expect(newNode.parentNode).toBeNull()
    expect(reference.parentNode).toBe(otherParent)
  })

  it('still inserts before a reference that belongs to the parent', () => {
    installTranslateCrashGuard()

    const parent = document.createElement('div')
    const reference = document.createTextNode('ref')
    const newNode = document.createTextNode('new')
    parent.appendChild(reference)

    expect(parent.insertBefore(newNode, reference)).toBe(newNode)
    expect([...parent.childNodes]).toEqual([newNode, reference])
  })
})
