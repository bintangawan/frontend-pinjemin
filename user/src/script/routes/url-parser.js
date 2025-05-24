function extractPathnameSegments(path) {
    const pathSegments = path.replace(/^\/|\/$/g, '').split('/');

    return {
        resource: pathSegments[0] || null,
        id: pathSegments[1] || null, 
    };
}

function constructRouteFromSegments(pathSegments) {
    let route = '';

    if (pathSegments.resource) {
        route = route.concat(`/${pathSegments.resource}`);
    }

    if (pathSegments.id) {
        route = route.concat('/:id');
    }

    return route || '/';
}

export function getActivePathname() {
    return location.hash.slice(1) || '/';
}

export function getActiveRoute() {
    const pathname = getActivePathname();
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
}

export const parseActivePathname = () => {
    const pathname = getActivePathname();
    return extractPathnameSegments(pathname);
};

export function getRoute(pathname) {
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
    return extractPathnameSegments(pathname);
}
