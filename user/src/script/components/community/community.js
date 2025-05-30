class Community extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<p>Komunitas coming soon</p>';
    }
}

customElements.define('app-community', Community);
