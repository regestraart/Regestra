
export const createPageUrl = (pageName: string, params?: Record<string, string>): string => {
  let path;
  if (pageName === 'Landing') {
    path = '/';
  } else {
     const kebabCaseName = pageName
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase();
    path = `/${kebabCaseName}`;
  }
  
  // A special case for dynamic profile URLs
  if (pageName === 'Profile' && params?.userId) {
    return `/profile/${params.userId}`;
  }

  if (params) {
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, params[key]);
    });
  }

  return path;
};