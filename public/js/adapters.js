export class SVGToCanvasContext {
    constructor(svg) {
        this.svg = svg;
        this.strokeStyle = 'black';
        this.fillStyle = 'black';
        this.filter = 'none';
        this.lineWidth = 0;
        this.path = [];
    }

    appendChild(child) {
        this.svg.appendChild(child);
        return child;
    }

    removeChild(child) {
        this.svg.removeChild(child);
        return child;
    }

    rect(x, y, width, height) {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.closePath();
    }

    get_children() {
        return this.svg.children;
    }

    clearRect(x, y, width, height) {
        for (const child of this.get_children()) {
            const bounds = child.getBBox();

            if (bounds.x >= x &&
                (bounds.x + bounds.width) <= (x + width) &&
                bounds.y >= y &&
                (bounds.y + bounds.height) <= (y + height)) {
                    this.removeChild(child);
                }
        }
    }

    closePath() {
        this.path.push('Z');
    }

    fillRect(x, y, width, height) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', this.fillStyle);
        rect.setAttribute('filter', this.filter);
        rect.setAttribute('stroke-width', 0);

        return this.appendChild(rect);
    }

    drawImageFromSource(href, x, y, width, height) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');

        image.setAttribute('href', href);
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('filter', this.filter);
        image.setAttribute('width', width);
        image.setAttribute('height', height);

        return this.appendChild(image);
    }

    beginPath() {
        this.path = [];
    }

    moveTo(x, y) {
        this.path.push(`M${x} ${y}`);
    }

    lineTo(x, y) {
        this.path.push(`L${x} ${y}`);
    }

    stroke() {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        path.setAttribute('d', this.path.join(','));
        path.setAttribute('stroke', this.strokeStyle);
        path.setAttribute('fill', this.fillStyle);
        path.setAttribute('filter', this.filter);
        path.setAttribute('stroke-width', this.lineWidth);

        return this.appendChild(path);
    }
}

export class LayeredSVGToCanvasContext extends SVGToCanvasContext {
    constructor(svg, name = 'root') {
        super(svg);
        this.name = name;
        this.layers = {name: this};
        this.children = [];
    }

    layer(name) {
        if (!(name in this.layers))
            this.layers[name] = new LayeredSVGToCanvasContext(this.svg, name);

        return this.layers[name];
    }

    get_children() {
        return this.children;
    }

    appendChild(child) {
        this.children.push(child);
        return super.appendChild(child);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);

        if (index < 0)
            return;

        this.children.splice(index, 1);
        return super.removeChild(child);
    }
}