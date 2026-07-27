# Task 2: Add image upload to compose modal - COMPLETED

## Changes Made

### `src/components/organisms/compose-modal.tsx`

1. **Added imports and state:**
   - Imported `supabase` from `@/config/supabase`
   - Added `selectedImages` state (`File[]`)
   - Added `uploading` state (`boolean`)
   - Added `fileInputRef` for the hidden file input

2. **Image selection handler:**
   - `handleImageSelect`: Processes file input, limits to 4 images max
   - `removeImage`: Removes selected image by index

3. **Upload functionality:**
   - `uploadImages`: Uploads to Supabase Storage bucket `posts`
   - Generates unique filenames with random prefix and timestamp
   - Returns array of public URLs

4. **Updated handleSubmit:**
   - Now async function
   - Calls `uploadImages()` before creating post
   - Passes image URLs to `createPost.mutate()`
   - Resets selected images on success
   - Catches upload errors

5. **UI updates:**
   - Added image preview section above textarea
   - Each preview has a remove button (X icon)
   - Wired image button to trigger hidden file input
   - Updated Post button loading state to include uploading
   - Added hidden file input at end of component

6. **Close behavior:**
   - Reset `selectedImages` to empty array when closing

## TypeScript Check

✅ `npx tsc --noEmit` passed with no errors

## Commit

✅ Committed as: `feat: add image upload to compose modal`