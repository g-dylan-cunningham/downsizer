/**
 * Purpose: Client-side image resizing utilities.
 * Exports: resizeImage, createImageVersions
 * Invariants:
 * - display version: 1600px long edge
 * - thumb version: 400px long edge
 * - Maintains aspect ratio
 * - Outputs JPEG format
 */

/**
 * Resizes an image file to specified max dimension.
 * @param {File} file - Original image file
 * @param {number} maxDimension - Max width or height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Resized image blob
 */
export async function resizeImage(file, maxDimension, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates both display and thumbnail versions of an image.
 * @param {File} file - Original image file
 * @returns {Promise<{display: Blob, thumb: Blob}>}
 */
export async function createImageVersions(file) {
  const [display, thumb] = await Promise.all([
    resizeImage(file, 1600, 0.9), // display: 1600px long edge
    resizeImage(file, 400, 0.85),  // thumb: 400px long edge
  ]);

  return { display, thumb };
}
