
// Generates absolute paths for use in <Link to="..."> components, handling dynamic params.
export const createUrl = (path: string, params?: Record<string, string>): string => {
  let url = path;

  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
  }

  return url;
};
