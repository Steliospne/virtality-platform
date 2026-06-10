import type { BucketFolderRow, BucketObjectRow } from '@virtality/shared/utils'
import { describe, expect, it } from 'vitest'
import {
  filterBucketImagePickerFolders,
  filterBucketImagePickerObjects,
} from './bucket-image-picker'

const folders: BucketFolderRow[] = [
  { type: 'folder', name: 'campaigns', prefix: 'campaigns/' },
  { type: 'folder', name: 'logos', prefix: 'logos/' },
]

const objects: BucketObjectRow[] = [
  {
    type: 'object',
    name: 'hero.png',
    objectKey: 'hero.png',
    cdnUrl: 'https://cdn.example/hero.png',
    contentType: 'image/png',
    size: 100,
    lastModified: null,
  },
  {
    type: 'object',
    name: 'notes.txt',
    objectKey: 'notes.txt',
    cdnUrl: 'https://cdn.example/notes.txt',
    contentType: 'text/plain',
    size: 10,
    lastModified: null,
  },
  {
    type: 'object',
    name: 'nested.jpg',
    objectKey: 'campaigns/nested.jpg',
    cdnUrl: 'https://cdn.example/campaigns/nested.jpg',
    contentType: 'image/jpeg',
    size: 200,
    lastModified: null,
  },
]

describe('filterBucketImagePickerFolders', () => {
  it('returns all folders when the query is empty', () => {
    expect(filterBucketImagePickerFolders(folders, '')).toEqual(folders)
  })

  it('filters folders by name or prefix', () => {
    expect(filterBucketImagePickerFolders(folders, 'logo')).toEqual([folders[1]])
    expect(filterBucketImagePickerFolders(folders, 'campaigns/')).toEqual([
      folders[0],
    ])
  })
})

describe('filterBucketImagePickerObjects', () => {
  it('returns only image objects from the current folder listing', () => {
    expect(filterBucketImagePickerObjects(objects, '')).toEqual([
      objects[0],
      objects[2],
    ])
  })

  it('filters image objects by name or object key', () => {
    expect(filterBucketImagePickerObjects(objects, 'nested')).toEqual([
      objects[2],
    ])
    expect(filterBucketImagePickerObjects(objects, 'hero.png')).toEqual([
      objects[0],
    ])
  })
})
