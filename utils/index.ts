
export const createPageUrl = (pageName: string): string => {
  if (pageName === 'Landing') return '/';
  const kebabCaseName = pageName
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `/${kebabCaseName}`;
};
