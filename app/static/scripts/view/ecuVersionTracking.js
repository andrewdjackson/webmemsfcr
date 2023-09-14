window.onload = function(event) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const ecuVersion = urlParams.get('version');

    document.getElementById('ecuVersion').innerHTML = ecuVersion;
}
