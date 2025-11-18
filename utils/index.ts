
const pagePaths: Record<string, string> = {
  Home: '/home',
  HomeSocial: '/home-social',
  EmailVerification: '/email-verification',
  Upload: '/upload',
  Publish: '/publish',
  EditProfile: '/edit-profile',
  Messages: '/messages',
  Login: '/login',
  SignUp: '/sign-up',
};

export const createPageUrl = (pageName: string, params?: Record<string, string>): string => {
  if (pageName === 'Landing') {
    return '/';
  }

  let path: string;
  
  if (pageName === 'Profile' && params?.userId) {
    path = `/profile/${params.userId}`;
  } else {
    path = pagePaths[pageName];
  }

  if (!path) {
    console.warn(`No path found for page: ${pageName}`);
    return '/';
  }

  if (params) {
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, params[key]);
    });
  }

  return path;
};