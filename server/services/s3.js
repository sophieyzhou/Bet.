const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;
const CDN_BASE_URL = process.env.CDN_BASE_URL; // optional, e.g. CloudFront

if (!REGION || !BUCKET) {
    console.warn('[S3] AWS_REGION and S3_BUCKET_NAME must be set in environment for media uploads');
}

const s3Client = new S3Client({
    region: REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

/**
 * Upload a media buffer to S3 and return its public URL.
 * @param {Buffer} buffer - File contents
 * @param {string} contentType - MIME type (e.g. image/jpeg)
 * @param {string} key - Object key inside the bucket
 * @returns {Promise<string>} public URL
 */
async function uploadMediaToS3(buffer, contentType, key) {
    if (!BUCKET) {
        throw new Error('S3_BUCKET_NAME is not configured');
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL not set because the bucket uses Object Ownership: Bucket owner enforced (ACLs disabled).
        // Public read access, if desired, should be configured via bucket policy or CloudFront.
    });

    await s3Client.send(command);

    if (CDN_BASE_URL) {
        return `${CDN_BASE_URL.replace(/\/$/, '')}/${key}`;
    }

    // Default public URL format
    const regionSegment = REGION && REGION !== 'us-east-1' ? `.${REGION}` : '';
    return `https://${BUCKET}.s3${regionSegment}.amazonaws.com/${key}`;
}

module.exports = {
    uploadMediaToS3,
};


