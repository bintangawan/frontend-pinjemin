function extractPathnameSegments(path) {
    // Remove leading and trailing slashes, then split by '/'
    const pathSegments = path.replace(/^\/|\/$/g, '').split('/');

    return {
        resource: pathSegments[0] || null,
        id: pathSegments[1] || null, // ID is the second segment
    };
}

function constructRouteFromSegments(pathSegments) {
    let route = '';

    if (pathSegments.resource) {
        route = route.concat(`/${pathSegments.resource}`);
    }

    // If there is an ID, replace it with ':id' to get the route pattern
    if (pathSegments.id) {
        route = route.concat('/:id');
    }

    return route || '/';
}

export function getActivePathname() {
    // Get path from hash, remove '#' and ensure it starts with '/'
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

// You might not need these if only using active path, but included based on reference
export function getRoute(pathname) {
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
    return extractPathnameSegments(pathname);
}
