function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Ignore root, index, API, or static assets
    if (uri === '/' || uri === '/index.html' || uri.includes('.') || uri.startsWith('/api/')) {
        return request;
    }

    // Rewrite clean slugs to the payment shell
    request.uri = '/payment.html';
    return request;
}
