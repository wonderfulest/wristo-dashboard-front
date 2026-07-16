import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('share image API lists, appends, and deletes app-bound assets', async () => {
  const source = await readFile(
    new URL('../src/api/product-share-images.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /fetchProductShareImages/)
  assert.match(source, /uploadProductShareImages/)
  assert.match(source, /deleteProductShareImage/)
  assert.match(source, /\/admin\/products\/\$\{appId\}\/share-images/)
  assert.match(source, /formData\.append\('files', file\)/)
})

test('product share dialog manages up to eight bound images', async () => {
  const source = await readFile(
    new URL('../src/views/products/Products.vue', import.meta.url),
    'utf8',
  )

  assert.match(source, /Bound Share Images/)
  assert.match(source, /accept="image\/png,image\/jpeg,image\/webp"/)
  assert.match(source, /MAX_SHARE_IMAGES\s*=\s*8/)
  assert.match(source, /:limit="MAX_SHARE_IMAGES"/)
  assert.match(source, /shareImageFiles/)
  assert.match(source, /boundShareImages/)
  assert.match(source, /handleUploadShareImages/)
  assert.match(source, /handleDeleteShareImage/)
  assert.match(source, /fetchProductShareImages/)
  assert.match(source, /uploadProductShareImages/)
  assert.match(source, /deleteProductShareImage/)
})
