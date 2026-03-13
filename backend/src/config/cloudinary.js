const cloudinary = require('cloudinary').v2;

const connectCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    console.log('✅ Cloudinary configured');
};

/**
 * Upload a file buffer or base64 string to Cloudinary
 * @param {string} fileData - base64 data URI or file path
 * @param {string} folder - Cloudinary folder (e.g. 'homihire/profiles')
 * @returns {object} - { url, public_id }
 */
const uploadToCloudinary = async (fileData, folder = 'homihire') => {
    try {
        const result = await cloudinary.uploader.upload(fileData, {
            folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
                { format: 'webp' },
            ],
        });
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error.message);
        throw new Error('Image upload failed. Please try again.');
    }
};

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error.message);
    }
};

module.exports = { connectCloudinary, uploadToCloudinary, deleteFromCloudinary };
