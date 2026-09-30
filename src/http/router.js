const toRegex = (pattern) => {
  const keys = [];
  const source = pattern.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}/?$`), keys };
};

const createRouter = () => {
  const routes = [];

  const register = (method) => (pattern, ...handlers) => {
    routes.push({ method, handlers, ...toRegex(pattern) });
  };

  const match = (method, pathname) => {
    const allowed = [];
    for (const route of routes) {
      const found = route.regex.exec(pathname);
      if (!found) continue;
      if (route.method !== method) {
        allowed.push(route.method);
        continue;
      }
      const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(found[index + 1])]));
      return { handlers: route.handlers, params };
    }
    return { allowed };
  };

  return { get: register('GET'), post: register('POST'), put: register('PUT'), match };
};

module.exports = { createRouter };
