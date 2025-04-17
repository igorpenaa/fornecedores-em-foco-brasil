
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

// Create and configure Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'di1blafqh',
    apiKey: '519761752284611',
    apiSecret: 'jAMBp7el-xqcl0xKmRZ0QITbFeM',
  }
});

export const getOptimizedImage = (publicId: string, width: number = 1200, height: number = 400) => {
  return cloudinary
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));
};

export const getOptimizedVideo = (publicId: string, width: number = 1200, height: number = 400) => {
  return cloudinary
    .video(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));
};
