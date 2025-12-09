// Default placeholder images
export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=1e293b&color=fff&size=200';
export const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop';

// Helper function to get profile image with fallback
export const getProfileImage = (profileImage, username = 'User') => {
  return profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e293b&color=fff&size=200`;
};

// Helper function to get banner image with fallback
export const getBannerImage = (bannerImage) => {
  return bannerImage || DEFAULT_BANNER;
};
